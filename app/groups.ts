import type { Pattern } from "./data";

export type Group = { key: string; name: string; description: string; categories: string[] };

// 37 のカテゴリを、意味の近いものどうしで 7 つに束ねた上位分類
export const groups: Group[] = [
  { key: "A", name: "言葉で傷つける", description: "暴言や侮辱で、能力・外見・存在そのものを否定する関わり。", categories: ["暴言", "侮辱", "人格否定", "身体・容姿への否定", "存在否定", "心理的虐待"] },
  { key: "B", name: "恐怖で従わせる", description: "大声・暴力・脅しなど、恐怖を使って行動を変えさせる関わり。", categories: ["威圧", "脅迫", "怒鳴る", "感情爆発", "身体的暴力", "身体的虐待", "面前DV"] },
  { key: "C", name: "愛情を条件にする", description: "成果や従順さと引き換えに、関心や愛情を与えたり取り上げたりする関わり。", categories: ["条件付き愛情", "愛情の撤回", "無視", "成果による評価", "過度な期待", "完璧主義の強要", "比較", "兄弟差別"] },
  { key: "D", name: "心を操作する", description: "罪悪感や悲しみを利用して、子どもの選択を変えさせる関わり。", categories: ["感情操作", "罪悪感による操作"] },
  { key: "E", name: "親と子の役割が逆転する", description: "親が担うべき世話や感情の支えを、子どもに負わせる関わり。", categories: ["親役化", "夫婦問題への巻き込み", "ネグレクト"] },
  { key: "F", name: "境界線を越える", description: "私的な空間・情報・交友に、本人の同意なく踏み込む関わり。", categories: ["境界線の侵害", "プライバシー侵害", "過度な監視", "過干渉"] },
  { key: "G", name: "人生の決定を奪う", description: "進路・恋愛・お金・住まいなど、本人が決めるべきことを親が決める関わり。", categories: ["支配", "自立妨害", "進路への過干渉", "恋愛への過干渉", "交友関係への過干渉", "過保護", "経済的支配"] },
];

export const groupsOf = (p: Pattern): string[] =>
  groups.filter(g => p.categories.some(c => g.categories.includes(c))).map(g => g.key);

export const patternsInGroup = (list: Pattern[], key: string): Pattern[] =>
  list.filter(p => groupsOf(p).includes(key));

// [i][j] = グループ i と j の両方に属するパターン数（対角は 0）
export const overlapMatrix = (list: Pattern[]): number[][] => {
  const keys = list.map(groupsOf);
  return groups.map((a, i) => groups.map((b, j) => i === j ? 0 : keys.filter(k => k.includes(a.key) && k.includes(b.key)).length));
};

export const sceneMatrix = (list: Pattern[]): { scene: string; counts: number[] }[] =>
  Array.from(new Set(list.map(p => p.scene))).map(scene => {
    const inScene = list.filter(p => p.scene === scene).map(groupsOf);
    return { scene, counts: groups.map(g => inScene.filter(k => k.includes(g.key)).length) };
  });

export const bridges = (list: Pattern[], min = 3): Pattern[] =>
  list.filter(p => groupsOf(p).length >= min);
