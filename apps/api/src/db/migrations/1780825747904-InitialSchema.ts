import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780825747904 implements MigrationInterface {
  name = 'InitialSchema1780825747904';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "action_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" character varying NOT NULL, "action_type" character varying NOT NULL, "langsmith_run_id" character varying, "payload" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cc15d2a348eaf2e1e153055380c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_knowledge_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" text NOT NULL, "category" character varying NOT NULL, "audience" character varying NOT NULL, "importance_score" double precision NOT NULL, "embedding" vector(768) NOT NULL, "embedding_model" character varying NOT NULL, "review_ownership" character varying NOT NULL, "expiration_date" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "approval_status" character varying NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_57a3858c7ec4c3138bb8629f076" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documentation_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "source_url" character varying NOT NULL, "version" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d805fa496677cc5c6fe575bea8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "documentation_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "section_heading" character varying, "content" text NOT NULL, "token_count" integer NOT NULL, "embedding" vector(768) NOT NULL, "embedding_model" character varying NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_55b7348da5193e65f4dd628fefb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "citations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "query_id" character varying NOT NULL, "source_id" character varying NOT NULL, "source_type" character varying NOT NULL, "text_snippet" text NOT NULL, "url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3ac0e933616c270f79f04cfc9fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentation_chunks" ADD CONSTRAINT "FK_17a59912f229cf87ae6befa55c7" FOREIGN KEY ("document_id") REFERENCES "documentation_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documentation_chunks" DROP CONSTRAINT "FK_17a59912f229cf87ae6befa55c7"`,
    );
    await queryRunner.query(`DROP TABLE "citations"`);
    await queryRunner.query(`DROP TABLE "documentation_chunks"`);
    await queryRunner.query(`DROP TABLE "documentation_documents"`);
    await queryRunner.query(`DROP TABLE "business_knowledge_entries"`);
    await queryRunner.query(`DROP TABLE "action_logs"`);
  }
}
