import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalIdToDocument1780834188603 implements MigrationInterface {
  name = 'AddExternalIdToDocument1780834188603';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_business_knowledge_embedding"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_docs_chunk_embedding"`);
    await queryRunner.query(
      `ALTER TABLE "documentation_documents" ADD "external_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_knowledge_entries" DROP COLUMN "embedding"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_knowledge_entries" ADD "embedding" vector(192) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_knowledge_entries" DROP COLUMN "embedding"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_knowledge_entries" ADD "embedding" vector(768) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentation_documents" DROP COLUMN "external_id"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_docs_chunk_embedding" ON "documentation_chunks" USING hnsw ("embedding") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_business_knowledge_embedding" ON "business_knowledge_entries" USING hnsw ("embedding") `,
    );
  }
}
