import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoursePrerequisites1749000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_prerequisites" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId"       uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "prerequisiteId" uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "createdAt"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_course_prerequisites_pair" UNIQUE ("courseId", "prerequisiteId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_prerequisites"`);
  }
}
