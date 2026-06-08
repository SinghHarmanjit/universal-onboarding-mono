import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgvectorIndexes1780837009000 implements MigrationInterface {
  name = 'AddPgvectorIndexes1780837009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adding hnsw indexes for pgvector using cosine distance (vector_cosine_ops)
    await queryRunner.query(
      `CREATE INDEX "idx_docs_chunk_embedding" ON "documentation_chunks" USING hnsw ("embedding" vector_cosine_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_business_knowledge_embedding" ON "business_knowledge_entries" USING hnsw ("embedding" vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_business_knowledge_embedding"`);
    await queryRunner.query(`DROP INDEX "idx_docs_chunk_embedding"`);
  }
}
