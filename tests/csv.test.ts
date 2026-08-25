import assert from 'node:assert/strict';
import test from 'node:test';
import { CsvParseError, parseCsvStrict } from '../lib/csv.ts';

test('引用符付きのカンマと改行を含むCSVを解析する', () => {
  assert.deepEqual(parseCsvStrict('name,notes\r\n"Service, Plus","line 1\nline 2"'), [
    ['name', 'notes'],
    ['Service, Plus', 'line 1\nline 2'],
  ]);
});

test('ヘッダーと列数が違うCSVを一括で拒否する', () => {
  assert.throws(() => parseCsvStrict('サービス名,料金\nNetflix,1,500'), CsvParseError);
});

test('閉じていない引用符を拒否する', () => {
  assert.throws(() => parseCsvStrict('サービス名,料金\n"Netflix,1500'), /引用符が閉じられていません/);
});
