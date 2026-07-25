import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitlist1748800000000 implements MigrationInterface {
  name = 'AddWaitlist1748800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add maxEnrollment to courses
    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "maxEnrollment" integer NULL
    `);

    // Create waitlist_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waitlist_entries" (
        "id"        uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"    uuid              NOT NULL,
        "courseId"  uuid              NOT NULL,
        "position"  integer           NOT NULL,
        "joinedAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_waitlist_entries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_waitlist_entries_user_course" UNIQUE ("userId", "courseId"),
        CONSTRAINT "FK_waitlist_entries_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_waitlist_entries_course"
          FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_waitlist_entries_userId"
        ON "waitlist_entries" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_waitlist_entries_courseId"
        ON "waitlist_entries" ("courseId")
    `);

    // Add new notification types to the enum (Postgres requires ALTER TYPE)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'waitlist_joined'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notifications_type_enum')
        ) THEN
          ALTER TYPE "notifications_type_enum" ADD VALUE 'waitlist_joined';
        END IF;
      END$$
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'waitlist_enrolled'
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notifications_type_enum')
        ) THEN
          ALTER TYPE "notifications_type_enum" ADD VALUE 'waitlist_enrolled';
        END IF;
      END$$
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waitlist_entries"`);
    await queryRunner.query(`
      ALTER TABLE "courses" DROP COLUMN IF EXISTS "maxEnrollment"
    `);
    // Note: Postgres does not support removing enum values; the enum values
    // waitlist_joined and waitlist_enrolled are left in place on rollback.
  }
}
