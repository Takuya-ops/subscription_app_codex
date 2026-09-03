import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, uiPatterns } from '../lib/ui-patterns.ts';

test('UI図鑑は10カテゴリ・99パターンを重複なく収録する', () => {
  assert.equal(categories.length, 10);
  assert.equal(uiPatterns.length, 99);
  assert.equal(new Set(uiPatterns.map((pattern) => pattern.id)).size, uiPatterns.length);

  for (const category of categories) {
    assert.ok(uiPatterns.some((pattern) => pattern.category === category.id), `${category.label}が空です`);
  }
});

test('全UIパターンに判断材料と実在例が揃っている', () => {
  for (const pattern of uiPatterns) {
    assert.ok(pattern.name.trim(), `${pattern.id}: 日本語名`);
    assert.ok(pattern.english.trim(), `${pattern.id}: 英語名`);
    assert.ok(pattern.summary.length >= 15, `${pattern.id}: 概要`);
    assert.ok(pattern.when.length >= 15, `${pattern.id}: 使う場面`);
    assert.ok(pattern.avoid.length >= 15, `${pattern.id}: 避ける場面`);
    assert.ok(pattern.compare.length >= 10, `${pattern.id}: 比較ポイント`);
    assert.ok(pattern.a11y.length >= 20, `${pattern.id}: アクセシビリティ`);
    assert.ok(pattern.examples.length >= 2, `${pattern.id}: 実在アプリ例`);
    assert.ok(['Web', 'スマホ', '共通'].includes(pattern.platform), `${pattern.id}: プラットフォーム`);
  }
});

test('Web・スマホ・共通の教材をいずれも十分に含む', () => {
  const counts = uiPatterns.reduce<Record<string, number>>((result, pattern) => {
    result[pattern.platform] = (result[pattern.platform] ?? 0) + 1;
    return result;
  }, {});

  assert.ok(counts.Web >= 10);
  assert.ok(counts['スマホ'] >= 20);
  assert.ok(counts['共通'] >= 40);
});

