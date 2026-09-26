// 紹介動画を生成する: node render.mjs [--only=<sceneId,...>] [--skip-frames]
//   前提: VOICEVOX エンジンが 127.0.0.1:50021 で起動していること / ffmpeg がインストール済みであること
//   出力: out/intro.mp4（BGMあり）, out/intro-nobgm.mp4
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { scenes, SITE, SPEAKER } from "./script.mjs";
import { buildTimeline, FPS, piecewise } from "./timeline.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const BUILD = join(ROOT, "build"), OUT = join(ROOT, "out");
const TIMING = { lead: 0.5, tail: 0.8, fade: 0.6 };
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
const only = args.only?.split(",");

const ffmpeg = (...a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });

// ---------- ナレーション ----------
async function synthesize(scene) {
  const base = `http://127.0.0.1:50021`;
  const q = await (await fetch(`${base}/audio_query?speaker=${SPEAKER}&text=${encodeURIComponent(scene.voice)}`, { method: "POST" })).json();
  Object.assign(q, { speedScale: 1.05, prePhonemeLength: 0, postPhonemeLength: 0.1, outputSamplingRate: 48000 });
  const wav = Buffer.from(await (await fetch(`${base}/synthesis?speaker=${SPEAKER}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) })).arrayBuffer());
  const path = join(BUILD, "voice", `${scene.id}.wav`);
  writeFileSync(path, wav);
  return { path, seconds: wav.readUInt32LE(40) / wav.readUInt32LE(28) }; // data サイズ / バイトレート
}

// ---------- サイト録画用のオーバーレイ（カーソル・クリック波紋・字幕） ----------
const OVERLAY_CSS = `
html{scroll-behavior:auto!important}
#vv-cursor{position:fixed;z-index:2147483647;left:0;top:0;width:26px;height:26px;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
#vv-ripple{position:fixed;z-index:2147483646;width:46px;height:46px;border-radius:50%;border:3px solid #0f6864;pointer-events:none;opacity:0}
#vv-cap{position:fixed;z-index:2147483647;left:50%;bottom:30px;background:rgba(23,59,60,.94);color:#fff;font:600 23px/1.4 "Hiragino Sans",sans-serif;letter-spacing:.06em;padding:13px 32px;border-radius:99px;white-space:nowrap;box-shadow:0 12px 32px rgba(0,0,0,.2)}`;
const CURSOR_SVG = `<svg viewBox="0 0 24 24"><path d="M4 2l16 10.5-7 1.3 4.2 7.6-3 1.6-4.2-7.7L4 20z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

async function installOverlay(page) {
  await page.evaluate(([css, svg]) => {
    const s = document.createElement("style"); s.textContent = css; document.head.append(s);
    const c = document.createElement("div"); c.id = "vv-cursor"; c.innerHTML = svg;
    const r = document.createElement("div"); r.id = "vv-ripple";
    const cap = document.createElement("div"); cap.id = "vv-cap";
    document.body.append(r, c, cap);
    window.vvSet = ({ x, y, cursor, ripple, caption, capOpacity, scroll }) => {
      window.scrollTo({ top: scroll, behavior: "instant" });
      c.style.opacity = cursor; c.style.transform = `translate(${x - 4}px,${y - 2}px)`;
      r.style.opacity = ripple > 0 ? 1 - ripple : 0;
      r.style.transform = `translate(${x - 23}px,${y - 23}px) scale(${0.4 + ripple * 1.2})`;
      cap.textContent = caption; cap.style.opacity = capOpacity;
      cap.style.transform = `translateX(-50%) translateY(${(1 - capOpacity) * 16}px)`;
    };
  }, [OVERLAY_CSS, CURSOR_SVG]);
}

const docTop = (page, selector, text) => page.evaluate(([sel, text]) => {
  const el = [...document.querySelectorAll(sel)].find(e => !text || e.textContent.includes(text));
  return el.getBoundingClientRect().top + window.scrollY;
}, [selector, text]);

// 時刻 t に応じて切り替わる字幕。各要素は [開始秒, 文言]
const captionAt = (list, t) => [...list].reverse().find(([at]) => t >= at) ?? [0, ""];
const fadeIn = (t, at, len = 0.5) => Math.min(1, Math.max(0, (t - at) / len));

// 各サイトシーン: setup でページを準備して目標座標を測り、frame(t, D) でその瞬間の状態を返す
const siteScenes = {
  async search(page) {
    await page.goto(SITE, { waitUntil: "networkidle" });
    const input = "input[aria-label='行動パターンを検索']";
    const query = "死ねと言われた";
    const box = await page.locator(input).boundingBox();
    // 入力後のレイアウトで結果の位置を測ってから元に戻す
    await page.fill(input, query);
    const resultsTop = (await docTop(page, ".results-head")) - 40;
    const card = await page.evaluate(() => { const r = document.querySelector(".pattern-card").getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + scrollY + r.height * 0.5 }; });
    await page.fill(input, "");
    await page.evaluate(() => document.activeElement.blur());
    const inputPos = { x: box.x + 260, y: box.y + box.height / 2 };
    let typed = -1, clicked = false;
    return {
      async frame(t) {
        const scroll = piecewise([[4.0, 0], [5.4, resultsTop]])(t);
        const x = piecewise([[0.7, 900], [1.6, inputPos.x], [5.6, inputPos.x], [6.6, card.x]])(t);
        const y = piecewise([[0.7, 560], [1.6, inputPos.y], [4.0, inputPos.y], [5.4, inputPos.y - resultsTop], [5.6, inputPos.y - resultsTop], [6.6, card.y - resultsTop]])(t);
        if (!clicked && t >= 1.7) { clicked = true; await page.mouse.click(x, y); }
        const n = Math.min(query.length, Math.max(0, Math.floor((t - 1.9) / 0.2) + 1));
        if (n !== typed && t >= 1.9) { typed = n; await page.fill(input, query.slice(0, n)); }
        if (t >= 5.6) await page.mouse.move(x, y);
        const ripple = [1.7, 7.4].map(at => (t >= at && t < at + 0.6 ? (t - at) / 0.6 : 0)).find(r => r > 0) ?? 0;
        return { x, y, cursor: 1, ripple, scroll, captions: [[0.4, "言われた言葉を、そのまま検索できる"]] };
      },
    };
  },

  async detail(page) {
    await page.goto(SITE, { waitUntil: "networkidle" });
    await page.fill("input[aria-label='行動パターンを検索']", "死ねと言われた");
    await page.click(".pattern-card");
    await page.waitForTimeout(400);
    const at = h => docTop(page, ".detail-section h2", h).then(y => y - 90);
    const [words, bound, impact, alt] = await Promise.all(["言われた言葉の例", "健全な関与との境界", "子ども側に起こりうる影響", "代わりにできる行動"].map(at));
    return {
      async frame(t, D) {
        const k = D / 14; // 14 秒想定のキーを実際の尺に合わせて伸縮
        const scroll = piecewise([[1.2 * k, 0], [2.2 * k, words], [4.0 * k, words], [5.0 * k, bound], [7.4 * k, bound], [8.4 * k, impact], [10.0 * k, impact], [11.0 * k, alt]])(t);
        return { x: 0, y: 0, cursor: 0, ripple: 0, scroll, captions: [[0.4, "言われた言葉の例"], [5.0 * k, "健全な関わりとの境界"], [8.4 * k, "子どもへの影響"], [11.0 * k, "代わりにできる伝え方"]] };
      },
    };
  },

  async map(page) {
    await page.goto(`${SITE}/map`, { waitUntil: "networkidle" });
    const groups = (await docTop(page, "section h2", "7つのグループ")) - 110;
    const overlap = (await docTop(page, "section h2", "グループ同士の重なり")) - 110;
    return {
      async frame(t, D) {
        const k = D / 10;
        const scroll = piecewise([[1.0 * k, 0], [2.2 * k, groups], [4.8 * k, groups], [6.0 * k, overlap]])(t);
        return { x: 0, y: 0, cursor: 0, ripple: 0, scroll, captions: [[0.4, "49のパターンを、7つのグループで整理"], [6.0 * k, "重なりやすい関わりが、ひと目でわかる"]] };
      },
    };
  },
};

async function renderFrames(browser, scene) {
  const dir = join(BUILD, "frames", scene.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const site = scene.kind === "site";
  const page = await browser.newPage(site
    ? { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  let driver;
  if (site) {
    driver = await siteScenes[scene.id](page);
    await installOverlay(page);
  } else {
    await page.goto(`${pathToFileURL(join(ROOT, "scenes.html"))}?scene=${scene.id}`);
    await page.evaluate(() => document.fonts.ready);
  }
  for (let f = 0; f < scene.frames; f++) {
    const t = f / FPS;
    if (site) {
      const s = await driver.frame(t, scene.duration);
      const [capAt, caption] = captionAt(s.captions, t);
      const capOpacity = caption ? fadeIn(t, capAt, 0.4) : 0; // 字幕が切り替わるたびにフェードイン
      await page.evaluate(s2 => window.vvSet(s2), { ...s, caption, capOpacity });
    } else {
      await page.evaluate(t => window.seek(t), t);
    }
    await page.screenshot({ path: join(dir, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await page.close();
  console.log(`  frames: ${scene.id} (${scene.frames})`);
}

function encodeScene(scene) {
  ffmpeg("-framerate", String(FPS), "-i", join(BUILD, "frames", scene.id, "%05d.jpg"),
    "-vf", "scale=1920:1080,format=yuv420p", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-r", String(FPS),
    join(BUILD, "seg", `${scene.id}.mp4`));
}

// 静かなパッド系 BGM を合成する（和音を 4 つ、長めのクロスフェードでつなぐ）
function makeBgm(seconds) {
  const chords = [[110, 164.81, 196, 246.94, 261.63], [87.31, 130.81, 164.81, 220, 261.63], [130.81, 196, 246.94, 329.63], [123.47, 146.83, 196, 293.66]];
  const len = Math.ceil(seconds / chords.length) + 4;
  const parts = chords.map((c, i) => {
    const expr = c.map((f, j) => `sin(2*PI*${f}*t)*(0.55+0.45*sin(2*PI*${0.07 + j * 0.03}*t+${j}))`).join("+");
    const p = join(BUILD, `bgm-${i}.wav`);
    ffmpeg("-f", "lavfi", "-i", `aevalsrc=(${expr})/${c.length * 3}:s=48000:d=${len}`, "-af", `afade=in:d=3,afade=out:st=${len - 3}:d=3`, p);
    return p;
  });
  const inputs = parts.flatMap(p => ["-i", p]);
  const chain = parts.slice(1).reduce((acc, _, i) => `${acc}[${i ? `x${i}` : "0"}][${i + 1}]acrossfade=d=4[x${i + 1}];`, "");
  ffmpeg(...inputs, "-filter_complex", `${chain}[x${parts.length - 1}]lowpass=f=1100,aecho=0.8:0.6:180|360:0.3|0.2,atrim=0:${seconds},afade=in:d=2.5,afade=out:st=${seconds - 3.5}:d=3.5[a]`,
    "-map", "[a]", "-ac", "2", join(BUILD, "bgm.wav"));
}

function assemble(tl, voices, withBgm, out) {
  const v = tl.scenes;
  const inputs = v.flatMap(s => ["-i", join(BUILD, "seg", `${s.id}.mp4`)]);
  let graph = "", prev = "0:v";
  v.slice(1).forEach((s, i) => { graph += `[${prev}][${i + 1}:v]xfade=transition=fade:duration=${TIMING.fade}:offset=${s.start}[v${i + 1}];`; prev = `v${i + 1}`; });
  graph += `[${prev}]fade=in:d=0.6,fade=out:st=${tl.total - 1.2}:d=1.2[vout];`;
  const voiced = v.filter(s => voices[s.id]);
  const aInputs = voiced.flatMap(s => ["-i", voices[s.id].path]);
  const base = v.length;
  voiced.forEach((s, i) => { graph += `[${base + i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round(s.voiceAt * 1000)}:all=1[n${i}];`; });
  const mixIn = voiced.map((_, i) => `[n${i}]`).join("");
  if (withBgm) {
    aInputs.push("-i", join(BUILD, "bgm.wav"));
    graph += `[${base + voiced.length}:a]volume=0.55[bg];${mixIn}[bg]amix=inputs=${voiced.length + 1}:normalize=0:duration=longest,atrim=0:${tl.total}[aout]`;
  } else {
    graph += `${mixIn}amix=inputs=${voiced.length}:normalize=0:duration=longest,apad,atrim=0:${tl.total}[aout]`;
  }
  ffmpeg(...inputs, ...aInputs, "-filter_complex", graph, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", String(tl.total), out);
}

for (const d of ["voice", "frames", "seg"]) mkdirSync(join(BUILD, d), { recursive: true });
mkdirSync(OUT, { recursive: true });

console.log("1/4 ナレーション合成");
const voices = {};
for (const s of scenes) voices[s.id] = await synthesize(s);
const tl = buildTimeline(scenes, Object.fromEntries(Object.entries(voices).map(([k, v]) => [k, v.seconds])), TIMING);
writeFileSync(join(BUILD, "timeline.json"), JSON.stringify(tl, null, 2));
console.log(tl.scenes.map(s => `  ${s.id}: ${s.start}s +${s.duration}s`).join("\n"), `\n  total ${tl.total}s`);

if (!("skip-frames" in args)) {
  console.log("2/4 フレーム撮影");
  const browser = await chromium.launch();
  for (const s of tl.scenes) if (!only || only.includes(s.id)) { await renderFrames(browser, s); encodeScene(s); }
  await browser.close();
}

console.log("3/4 BGM 合成");
makeBgm(tl.total);

console.log("4/4 結合");
assemble(tl, voices, true, join(OUT, "intro.mp4"));
assemble(tl, voices, false, join(OUT, "intro-nobgm.mp4"));
console.log(`done: ${join(OUT, "intro.mp4")}`);
