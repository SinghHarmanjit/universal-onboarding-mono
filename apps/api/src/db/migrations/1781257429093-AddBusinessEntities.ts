import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessEntities1781257429093 implements MigrationInterface {
    name = 'AddBusinessEntities1781257429093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_business_knowledge_embedding"`);
        await queryRunner.query(`DROP INDEX "public"."idx_docs_chunk_embedding"`);
        await queryRunner.query(`CREATE TABLE "business_entities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "business_knowledge_entry_id" uuid NOT NULL, "entity_type" character varying NOT NULL, "entity_name" character varying NOT NULL, "attributes" jsonb NOT NULL, "embedding" vector(192), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5a32d191df5bd998a28ad53213" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "business_entities" ADD CONSTRAINT "FK_876d0d3e5c8f97e2929b51273a8" FOREIGN KEY ("business_knowledge_entry_id") REFERENCES "business_knowledge_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_entities" DROP CONSTRAINT "FK_876d0d3e5c8f97e2929b51273a8"`);
        await queryRunner.query(`DROP TABLE "business_entities"`);
        await queryRunner.query(`CREATE INDEX "idx_docs_chunk_embedding" ON "documentation_chunks" USING hnsw ("embedding") `);
        await queryRunner.query(`CREATE INDEX "idx_business_knowledge_embedding" ON "business_knowledge_entries" USING hnsw ("embedding") `);
    }

}
