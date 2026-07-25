import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLiveSessions1748900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "live_session_status_enum" AS ENUM ('scheduled', 'cancelled', 'completed')
    `);
    await queryRunner.query(`
      CREATE TABLE "live_sessions" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "cohortId"        uuid NOT NULL REFERENCES "cohorts"("id") ON DELETE CASCADE,
        "instructorId"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title"           varchar NOT NULL,
        "description"     text,
        "scheduledAt"     timestamptz NOT NULL,
        "durationMinutes" int NOT NULL DEFAULT 60,
        "meetingUrl"      varchar,
        "status"          "live_session_status_enum" NOT NULL DEFAULT 'scheduled',
        "remindersSent"   text,
        "createdAt"       timestamptz NOT NULL DEFAULT now(),
        "updatedAt"       timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "live_sessions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "live_session_status_enum"`);
  }
}
