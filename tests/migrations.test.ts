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

  db.exec("DELETE FROM subscriptions WHERE id='s1'");
  assert.equal(db.prepare('SELECT count(*) AS count FROM usage_checkins').get()?.count, 0);
  assert.equal(db.prepare('SELECT count(*) AS count FROM charges').get()?.count, 0);
  db.close();
});
