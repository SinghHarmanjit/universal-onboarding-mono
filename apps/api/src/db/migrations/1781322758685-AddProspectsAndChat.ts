import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProspectsAndChat1781322758685 implements MigrationInterface {
    name = 'AddProspectsAndChat1781322758685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "prospect_meddic" ("prospect_id" uuid NOT NULL, "metrics" jsonb, "economic_buyer" jsonb, "decision_criteria" jsonb, "decision_process" jsonb, "identified_pain" jsonb, "champion" jsonb, "timeline" jsonb, "budget" jsonb, "completeness_score" numeric, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7c4f79e242d5f49980aef0d7e5" PRIMARY KEY ("prospect_id"))`);
        await queryRunner.query(`CREATE TABLE "prospect_facts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prospect_id" uuid NOT NULL, "fact_type" character varying NOT NULL, "fact_key" character varying NOT NULL, "fact_value" jsonb, "confidence" numeric, "source_message_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_853752d08b490e179c36064b182" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "prospects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_name" character varying, "industry" character varying, "website" character varying, "current_stage" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9fc60d8f29db14b861e3c96568e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prospect_id" uuid, "status" character varying NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_efc151a4aafa9a28b73dedc485f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chat_session_id" uuid NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "prospect_meddic" ADD CONSTRAINT "FK_e7c4f79e242d5f49980aef0d7e5" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prospect_facts" ADD CONSTRAINT "FK_e133f113c56d4e863af124c43eb" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prospect_facts" ADD CONSTRAINT "FK_cf5cb328d00205be87c227d75e2" FOREIGN KEY ("source_message_id") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_b34c51c98dea0e206c51948e0e9" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_7737b2da509d8769d559f354c7e" FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_7737b2da509d8769d559f354c7e"`);
        await queryRunner.query(`ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_b34c51c98dea0e206c51948e0e9"`);
        await queryRunner.query(`ALTER TABLE "prospect_facts" DROP CONSTRAINT "FK_cf5cb328d00205be87c227d75e2"`);
        await queryRunner.query(`ALTER TABLE "prospect_facts" DROP CONSTRAINT "FK_e133f113c56d4e863af124c43eb"`);
        await queryRunner.query(`ALTER TABLE "prospect_meddic" DROP CONSTRAINT "FK_e7c4f79e242d5f49980aef0d7e5"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TABLE "chat_sessions"`);
        await queryRunner.query(`DROP TABLE "prospects"`);
        await queryRunner.query(`DROP TABLE "prospect_facts"`);
        await queryRunner.query(`DROP TABLE "prospect_meddic"`);
    }

}
