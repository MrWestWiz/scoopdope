import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearningPaths1749000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "learning_paths" (
        "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"        varchar NOT NULL,
        "description"  text NOT NULL,
        "isPublished"  boolean NOT NULL DEFAULT false,
        "thumbnailUrl" varchar,
        "courseOrder"  jsonb NOT NULL DEFAULT '[]',
        "createdAt"    timestamptz NOT NULL DEFAULT now(),
        "updatedAt"    timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "learning_path_courses" (
        "learningPathId" uuid NOT NULL REFERENCES "learning_paths"("id") ON DELETE CASCADE,
        "courseId"       uuid NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        PRIMARY KEY ("learningPathId", "courseId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "learning_path_enrollments" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"           uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "learningPathId"   uuid NOT NULL REFERENCES "learning_paths"("id") ON DELETE CASCADE,
        "enrolledAt"       timestamptz NOT NULL DEFAULT now(),
        "completedAt"      timestamptz,
        UNIQUE ("userId", "learningPathId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "learningPathId" uuid REFERENCES "learning_paths"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN IF EXISTS "learningPathId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_path_enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_path_courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "learning_paths"`);
  }
}
