import { test } from "node:test";
import assert from "node:assert/strict";
import { categories, patterns } from "./data.ts";
import { bridges, groups, groupsOf, overlapMatrix, patternsInGroup, sceneMatrix } from "./groups.ts";

const idx = (key: string) => groups.findIndex(g => g.key === key);

test("7グループがあり、全カテゴリがちょうど1つのグループに属する", () => {
  assert.equal(groups.length, 7);
  for (const c of categories) {
    assert.equal(groups.filter(g => g.categories.includes(c)).length, 1, `「${c}」の所属が1つでない`);
  }
});

test("すべてのパターンが1つ以上のグループに属する", () => {
  assert.ok(patterns.every(p => groupsOf(p).length > 0));
  assert.equal(patterns.filter(p => groupsOf(p).length === 1).length, 25);
});

test("グループ別パターン一覧", () => {
  const a = patternsInGroup(patterns, "A").map(p => p.title);
  assert.ok(a.some(t => t.includes("死ね")));
  assert.ok(!a.some(t => t.includes("スマホ")));
});

test("グループ間の重なり件数（対称・対角は0）", () => {
  const m = overlapMatrix(patterns);
  assert.equal(m[idx("F")][idx("G")], 4);
  assert.equal(m[idx("G")][idx("F")], 4);
  assert.equal(m[idx("A")][idx("B")], 3);
  assert.equal(m[idx("A")][idx("F")], 0);
  assert.equal(m[idx("A")][idx("A")], 0);
});

test("場面 × グループ", () => {
  const rows = sceneMatrix(patterns);
  const family = rows.find(r => r.scene === "家族関係");
  assert.ok(family);
  assert.equal(family.counts[idx("E")], 5);
  assert.equal(rows.length, new Set(patterns.map(p => p.scene)).size);
});

test("3グループ以上にまたがるパターン", () => {
  assert.deepEqual(bridges(patterns).map(p => p.id), ["pattern-9", "pattern-39", "pattern-45", "pattern-46", "pattern-48"]);
});
