import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Verifier } from '@pact-foundation/pact';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Pact Provider Verification', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should verify all pacts from consumers', async () => {
    const verifier = new Verifier({
      provider: 'Scoopdope-Backend',
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: [path.resolve(__dirname, '../pacts')],
      stateHandlers: {
        // ── Auth ──────────────────────────────────────────────────────────────
        'user does not exist': async () => {
          // No-op: test DB starts empty
        },
        'user with email exists': async () => {
          // Seed a user with email existing@example.com
        },
        'user exists with credentials': async () => {
          // Seed user@example.com / Test@1234!
        },
        'user exists': async () => {
          // Seed a generic user
        },
        'user is authenticated': async () => {
          // Seed an authenticated session
        },
        'user is not authenticated': async () => {
          // No-op: no auth token provided
        },

        // ── Courses ───────────────────────────────────────────────────────────
        'courses exist': async () => {
          // Seed at least one published course
        },
        'course with id 1 exists': async () => {
          // Seed a course with id = 1
        },
        'course with id 999 does not exist': async () => {
          // No-op: course 999 absent by default
        },
        'user is authenticated and course exists': async () => {
          // Seed authenticated user + course with id = 1
        },

        // ── Users ─────────────────────────────────────────────────────────────
        'user with id 1 exists': async () => {
          // Seed a user with id = 1
        },

        // ── Wallet / Stellar ──────────────────────────────────────────────────
        'stellar account exists': async () => {
          // No-op: Stellar balance is fetched live from Horizon testnet
        },
        'stellar account does not exist': async () => {
          // No-op: unknown key returns 404 from Horizon
        },
      },
      logLevel: 'INFO',
      publishVerificationResult: false,
      providerVersion: process.env.GIT_COMMIT || 'unknown',
    });

    await verifier.verifyProvider();
  });
});
