import { test } from "node:test";
import assert from "node:assert/strict";
import { patterns } from "./data.ts";
import { searchPatterns } from "./search.ts";

const titles = (q: string) => searchPatterns(patterns, q).map(p => p.title);
const expectTop = (q: string, fragment: string, within = 3) => {
  const top = titles(q).slice(0, within);
  assert.ok(top.some(t => t.includes(fragment)), `「${q}」の上位${within}件に「${fragment}」がない: ${JSON.stringify(top)}`);
};

test("空クエリは全件を返す", () => {
  assert.equal(searchPatterns(patterns, "  ").length, patterns.length);
});

test("暴言そのもので検索できる", () => {
  expectTop("死ね", "死ね");
  expectTop("消えろ", "死ね");
  expectTop("産まなきゃよかった", "産まなきゃよかった");
  expectTop("お前さえいなければ", "産まなきゃよかった");
  expectTop("出ていけ", "出ていけ");
  expectTop("クズ", "侮辱語");
});

test("「〜と言われた」「〜された」のような自然文でも検索できる", () => {
  expectTop("死ねと言われた", "死ね");
  expectTop("親に死ねって言われた", "死ね");
  expectTop("バカと言われた", "侮辱語");
});

test("トップのサジェストが結果を返す", () => {
  expectTop("スマホを見られた", "スマホ");
  expectTop("兄弟と比較された", "兄弟姉妹");
  expectTop("親の愚痴を聞かされた", "愚痴");
});

test("表記ゆれ（全角半角・カタカナ）を吸収する", () => {
  expectTop("ｽﾏﾎ", "スマホ");
  expectTop("しね", "死ね");
});

test("スペース区切りは AND 検索", () => {
  const r = titles("スマホ 監視");
  assert.ok(r.length > 0);
  assert.ok(r.every(t => !t.includes("死ね")));
});

test("無関係な語では何も返さない", () => {
  assert.equal(titles("量子コンピュータ").length, 0);
});
