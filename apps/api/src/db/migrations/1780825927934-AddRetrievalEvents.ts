import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRetrievalEvents1780825927934 implements MigrationInterface {
  name = 'AddRetrievalEvents1780825927934';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "retrieval_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" character varying NOT NULL, "query" character varying NOT NULL, "has_conflict" boolean NOT NULL DEFAULT false, "was_refused" boolean NOT NULL DEFAULT false, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e47a9910753400a7021cd15d81c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "retrieval_events"`);
  }
}
