import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentationDocument } from '../../models/document';
import { DocumentationChunk } from '../../models/chunk';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  NOMIC_EMBEDDING_DIMENSIONS,
  NOMIC_EMBEDDING_CHUNK_SIZE,
  NOMIC_EMBEDDING_CHUNK_OVERLAP,
  NOMIC_EMBEDDING_MODEL_NAME,
} from '../constants/embedding';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

@Injectable()
export class DocsIngestService {
  private readonly logger = new Logger(DocsIngestService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(DocumentationDocument)
    private readonly docRepository: Repository<DocumentationDocument>,
    @InjectRepository(DocumentationChunk)
    private readonly chunkRepository: Repository<DocumentationChunk>,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>(
      'EMBEDDING_BASE_URL',
      'http://localhost:8000/v1',
    );
    this.embeddings = new OpenAIEmbeddings({
      modelName: NOMIC_EMBEDDING_MODEL_NAME,
      configuration: {
        baseURL: baseUrl,
      },
      openAIApiKey: 'not-needed',
      encodingFormat: 'float',
    });
  }

  async ingestDocument(
    sourceUrl: string,
  ): Promise<DocumentationDocument | DocumentationDocument[]> {
    if (sourceUrl.endsWith('llms.txt')) {
      return this.ingestLlmsTxt(sourceUrl);
    }
    return this.ingestSingleDocument(sourceUrl);
  }

  async ingestLlmsTxt(sourceUrl: string): Promise<DocumentationDocument[]> {
    this.logger.log(`Fetching llms.txt from URL: ${sourceUrl}`);
    let content = '';
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt (${response.status}: ${response.statusText}).`);
      }
      content = await response.text();
    } catch (error) {
      this.logger.error(`Error fetching llms.txt from ${sourceUrl}`, error);
      throw error;
    }

    let inGuidesSection = false;
    const urlsToIngest: string[] = [];

    for (const line of content.split('\n')) {
      if (line.trim() === '## Guides') {
        inGuidesSection = true;
        continue;
      }
      if (inGuidesSection && line.startsWith('## ')) {
        inGuidesSection = false;
      }

      if (inGuidesSection) {
        // Extract markdown links specifically starting with https://reap.readme.io/docs
        const regex = /\[([^\]]+)\]\((https:\/\/reap\.readme\.io\/docs[^\)]+)\)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
          urlsToIngest.push(match[2]);
        }
      }
    }

    this.logger.log(`Found ${urlsToIngest.length} guides to ingest from llms.txt`);

    const ingestedDocs: DocumentationDocument[] = [];
    for (const url of urlsToIngest) {
      try {
        const doc = await this.ingestSingleDocument(url);
        ingestedDocs.push(doc);
      } catch (err) {
        this.logger.error(`Failed to ingest guide ${url}`, err);
      }
    }

    return ingestedDocs;
  }

  async ingestSingleDocument(
    sourceUrl: string,
  ): Promise<DocumentationDocument> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingDoc = await this.docRepository.findOne({
      where: { source_url: sourceUrl },
      order: { created_at: 'DESC' },
    });

    if (existingDoc && existingDoc.created_at > thirtyDaysAgo) {
      this.logger.log(`Document ${sourceUrl} was fetched less than 30 days ago. Skipping.`);
      return existingDoc;
    }

    this.logger.log(`Fetching document from URL: ${sourceUrl}`);
    let content = '';
    let title = sourceUrl;
    let externalId: string | undefined = undefined;

    // ReadMe supports appending .md to the doc URL to fetch raw Markdown directly.
    // This bypasses the API completely and avoids 403 errors on Git-backed projects.
    const readmeMatch = sourceUrl.match(/https?:\/\/([^\/]+)\/docs\/([^/?#]+)/);
    if (!readmeMatch) {
      throw new Error(`Only ReadMe URLs are supported. Provided URL: ${sourceUrl}`);
    }

    const slug = readmeMatch[2];
    const mdUrl = sourceUrl.endsWith('.md') ? sourceUrl : `${sourceUrl}.md`;

    this.logger.log(`Detected ReadMe URL. Fetching raw markdown from '${mdUrl}'...`);
    try {
      const response = await fetch(mdUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown from ReadMe (${response.status}: ${response.statusText}).`);
      }

      content = await response.text();
      // Extract title from markdown if possible (first H1)
      const titleMatch = content.match(/^#\s+(.*)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        title = slug;
      }
      externalId = slug;
      this.logger.log(`Successfully fetched ReadMe document: ${title}`);
    } catch (error) {
      this.logger.error(`Error fetching markdown from ReadMe for slug ${slug}`, error);
      throw error;
    }

    this.logger.log(`Ingesting document: ${title}`);

    // Create Document
    const doc = this.docRepository.create({
      title,
      source_url: sourceUrl,
      external_id: externalId,
      version: '1.0',
    });
    const savedDoc = await this.docRepository.save(doc);

    // ReadMe API body is already markdown
    const markdownContent = content;

    // Parse Markdown to extract headings
    const lines = markdownContent.split('\n');
    const sections: { heading: string | null; text: string }[] = [];
    let currentHeading: string | null = null;
    let currentText: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        if (currentText.length > 0) {
          sections.push({ heading: currentHeading, text: currentText.join('\n') });
          currentText = [];
        }
        currentHeading = headingMatch[2].trim();
        currentText.push(line);
      } else {
        currentText.push(line);
      }
    }
    if (currentText.length > 0) {
      sections.push({ heading: currentHeading, text: currentText.join('\n') });
    }

    // Use Langchain's RecursiveCharacterTextSplitter to take advantage of Nomic's large 8192 token context window.
    // Assuming roughly 4 chars per token, 8192 tokens is ~32768 chars.
    // We'll use a safe chunk size of 24000 characters with 2000 character overlap.
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: NOMIC_EMBEDDING_CHUNK_SIZE,
      chunkOverlap: NOMIC_EMBEDDING_CHUNK_OVERLAP,
    });

    const docChunks: DocumentationChunk[] = [];
    let globalChunkIndex = 0;

    for (const section of sections) {
      if (!section.text.trim()) continue;

      const chunks = await splitter.splitText(section.text);

      for (const chunkContentStr of chunks) {
        const chunkContent = chunkContentStr.trim();
        if (!chunkContent) continue;

        // Generate embedding
        // For local testing, we might mock this if the model is not running
        let embeddingVector: number[] = [];
        try {
          embeddingVector = await this.embeddings.embedQuery(
            `search_document: ${chunkContent}`,
          );
          if (embeddingVector.length > NOMIC_EMBEDDING_DIMENSIONS) {
            embeddingVector = embeddingVector.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
          }
        } catch (err) {
          this.logger.error(
            `Error generating embedding for chunk ${globalChunkIndex}:`,
            err,
          );
          throw err;
        }

        const chunk = this.chunkRepository.create({
          document_id: savedDoc.id,
          chunk_index: globalChunkIndex++,
          section_heading: section.heading || undefined,
          content: chunkContent,
          token_count: Math.floor(chunkContent.length / 4), // Rough approximation
          embedding: `[${embeddingVector.join(',')}]`, // pgvector string format
          embedding_model: NOMIC_EMBEDDING_MODEL_NAME,
        });
        docChunks.push(chunk);
      }
    }

    await this.chunkRepository.save(docChunks);
    this.logger.log(
      `Successfully ingested document ${savedDoc.id} with ${docChunks.length} chunks.`,
    );

    return savedDoc;
  }
}
