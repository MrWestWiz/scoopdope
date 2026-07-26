import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificatePdfUrl1749000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "pdfUrl" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "certificates" DROP COLUMN IF EXISTS "pdfUrl"
    `);
  }
}
