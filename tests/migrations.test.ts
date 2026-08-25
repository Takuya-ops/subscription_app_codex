import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const migration = (name: string) => readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8');

test('D1移行は既存データと外部キーを保持する', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(migration('0000_chief_living_tribunal.sql'));
  db.exec(`
    INSERT INTO subscriptions VALUES(
      's1','u1','監査用','標準',1000,'JPY','monthly','2026-01-31','2026-02-28',
      '仕事',3,4,'often','2026-08-25','manual','active','',datetime('now'),datetime('now')
    );
    INSERT INTO usage_checkins VALUES('c1','u1','s1','2026-08-25','often',datetime('now'));
    INSERT INTO charges VALUES('p1','u1','s1','2026-08-25',1000,'JPY','manual',datetime('now'));
  `);

  db.exec(migration('0001_silly_hairball.sql'));
  db.exec(migration('0002_medical_beast.sql'));
  db.exec(`
    INSERT INTO google_connections VALUES(
      'u1','owner@example.com','encrypted-access','encrypted-refresh','2026-08-25T00:00:00.000Z',
      'https://www.googleapis.com/auth/gmail.readonly',NULL,datetime('now'),datetime('now')
    );
    INSERT INTO gmail_import_candidates VALUES(
      'g1','u1','fingerprint','message1','Netflix','Netflix',1490,'JPY','monthly',
      '2026-08-25','2026-08-25',1,95,NULL,'2026-09-01T00:00:00.000Z',datetime('now'),datetime('now')
    );
  `);
  db.exec(migration('0003_supreme_toro.sql'));

  const counts = db.prepare(`
    SELECT
      (SELECT count(*) FROM subscriptions) AS subscriptions,
      (SELECT count(*) FROM usage_checkins) AS checkins,
      (SELECT count(*) FROM charges) AS charges
  `).get();
  assert.deepEqual({ ...counts }, { subscriptions: 1, checkins: 1, charges: 1 });
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);

  const usageParents = db.prepare("PRAGMA foreign_key_list('usage_checkins')").all() as Array<{ table: string }>;
  const chargeParents = db.prepare("PRAGMA foreign_key_list('charges')").all() as Array<{ table: string }>;
  assert.deepEqual(usageParents.map((row) => row.table), ['subscriptions']);
  assert.deepEqual(chargeParents.map((row) => row.table), ['subscriptions']);

  const googleColumns = db.prepare("PRAGMA table_info('google_connections')").all() as Array<{ name: string; pk: number }>;
  const candidateColumns = db.prepare("PRAGMA table_info('gmail_import_candidates')").all() as Array<{ name: string }>;
  assert.equal(googleColumns.find((column) => column.name === 'user_id')?.pk, 1);
  assert.ok(candidateColumns.some((column) => column.name === 'fingerprint'));
  assert.ok(candidateColumns.some((column) => column.name === 'imported_at'));
  assert.ok(googleColumns.some((column) => column.name === 'scan_started_at'));
  assert.ok(googleColumns.some((column) => column.name === 'gmail_page_token'));
  assert.equal(db.prepare('SELECT count(*) AS count FROM gmail_import_candidates').get()?.count, 1);

  const candidateParents = db.prepare("PRAGMA foreign_key_list('gmail_import_candidates')").all() as Array<{ table: string }>;
  const eventParents = db.prepare("PRAGMA foreign_key_list('gmail_import_events')").all() as Array<{ table: string }>;
  assert.deepEqual(candidateParents.map((row) => row.table), ['google_connections']);
  assert.deepEqual(eventParents.map((row) => row.table), ['subscriptions']);
  db.exec(`
    INSERT INTO gmail_import_events VALUES('e1','u1','fingerprint','2026-08-25','s1',datetime('now'));
  `);
  assert.throws(() => db.exec(`
    INSERT INTO gmail_import_events VALUES('e2','u1','fingerprint','2026-08-25','s1',datetime('now'));
  `), /UNIQUE constraint failed/u);

  db.exec("DELETE FROM subscriptions WHERE id='s1'");
  assert.equal(db.prepare('SELECT count(*) AS count FROM usage_checkins').get()?.count, 0);
  assert.equal(db.prepare('SELECT count(*) AS count FROM charges').get()?.count, 0);
  assert.equal(db.prepare('SELECT count(*) AS count FROM gmail_import_events').get()?.count, 0);
  db.exec("DELETE FROM google_connections WHERE user_id='u1'");
  assert.equal(db.prepare('SELECT count(*) AS count FROM gmail_import_candidates').get()?.count, 0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});
