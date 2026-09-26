export const FPS = 30;

const round = n => Math.round(n * 1000) / 1000;

// 各シーンの尺・開始位置・ナレーション位置を決める。
// シーン同士は fade 秒のクロスフェードで重なるので、次のシーンは fade 秒前倒しで始まる。
export function buildTimeline(scenes, voiceDurations, { lead, tail, fade }) {
  let cursor = 0;
  const out = scenes.map((s, i) => {
    const voice = voiceDurations[s.id];
    const duration = round(Math.max(s.min, voice ? lead + voice + tail : 0));
    const start = round(cursor);
    cursor += duration - fade;
    return { ...s, index: i, start, duration, frames: Math.ceil(round(duration * FPS)), voiceAt: voice ? round(start + lead) : null };
  });
  const last = out.at(-1);
  return { scenes: out, total: round(last.start + last.duration) };
}

export const easeInOut = x => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

// [[時刻, 値], ...] のキーフレームを easeInOut で補間する関数を返す
export function piecewise(keys) {
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      if (t <= t1) return v0 + (v1 - v0) * easeInOut((t - t0) / (t1 - t0));
    }
    return keys.at(-1)[1];
  };
}
