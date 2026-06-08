import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgvector1716601660123 implements MigrationInterface {
  name = 'EnablePgvector1716601660123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
