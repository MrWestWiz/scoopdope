import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrolledVersionNumber1748400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "enrolledVersionNumber" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "enrolledVersionNumber"`,
    );
  }
}
