import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, easeInOut, piecewise } from "./timeline.mjs";

const opts = { lead: 0.6, tail: 0.8, fade: 0.5 };

test("シーンの長さはナレーション＋前後の余白で、最短尺を下回らない", () => {
  const tl = buildTimeline([{ id: "a", min: 3 }, { id: "b", min: 8 }], { a: 4, b: 2 }, opts);
  assert.equal(tl.scenes[0].duration, 5.4);
  assert.equal(tl.scenes[1].duration, 8);
});

test("クロスフェードの分だけ次のシーンが前に重なり、全体の長さも縮む", () => {
  const tl = buildTimeline([{ id: "a", min: 4 }, { id: "b", min: 4 }, { id: "c", min: 4 }], {}, opts);
  assert.deepEqual(tl.scenes.map(s => s.start), [0, 3.5, 7]);
  assert.equal(tl.total, 11);
});

test("ナレーションはシーン開始から lead 秒後に始まる（ナレーションなしは null）", () => {
  const tl = buildTimeline([{ id: "a", min: 4 }, { id: "b", min: 4 }], { b: 2 }, opts);
  assert.equal(tl.scenes[0].voiceAt, null);
  assert.equal(tl.scenes[1].voiceAt, 3.5 + 0.6);
});

test("フレーム数は 30fps で切り上げ", () => {
  const tl = buildTimeline([{ id: "a", min: 1.01 }], {}, opts);
  assert.equal(tl.scenes[0].frames, 31);
});

test("easeInOut は両端 0 と 1、中点 0.5", () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(easeInOut(0.5), 0.5);
});

test("piecewise はキーの間を補間し、範囲外は端の値を保つ", () => {
  const f = piecewise([[1, 0], [3, 100], [5, 100]]);
  assert.equal(f(0), 0);
  assert.equal(f(2), 50);
  assert.equal(f(4), 100);
  assert.equal(f(9), 100);
});
