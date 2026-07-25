import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleReleaseDate1748800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "course_modules" ADD COLUMN IF NOT EXISTS "releaseDate" timestamp`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "course_modules" DROP COLUMN IF EXISTS "releaseDate"`,
    );
  }
}
