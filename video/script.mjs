// 動画の台本。voice はナレーション（VOICEVOX）、caption は画面下の字幕（省略時は出さない）
export const SPEAKER = 31; // No.7（読み聞かせ）
export const SITE = "https://toxic-parent-library.mituba.workers.dev";

export const scenes = [
  { id: "intro", kind: "html", min: 6.8,
    voice: "親に言われた、あの言葉。あれは、何だったんだろう。" },
  { id: "title", kind: "html", min: 6,
    voice: "毒親ライブラリ。家庭の中で起きたことを、行動から理解するための場所です。" },
  { id: "search", kind: "site", min: 9.5,
    voice: "言われた言葉を、そのまま入れるだけで、検索できます。",
    caption: "言われた言葉を、そのまま検索できる" },
  { id: "detail", kind: "site", min: 12,
    voice: "実際の言葉の例、健全な関わりとの境界、子どもへの影響、そして、代わりにできる伝え方まで。",
    caption: "言葉の例・境界線・影響・代わりの伝え方" },
  { id: "map", kind: "site", min: 8.5,
    voice: "49のパターンを、7つのグループで整理。重なりやすい関わりも、ひと目でわかります。",
    caption: "49のパターンを、7つのグループで俯瞰する" },
  { id: "principle", kind: "html", min: 8,
    voice: "誰かを裁くためではなく。同じパターンを、次の世代へ繰り返さないために。" },
  { id: "end", kind: "html", min: 6,
    voice: "毒親ライブラリ。パターンを、ここで止めるために。" },
];
