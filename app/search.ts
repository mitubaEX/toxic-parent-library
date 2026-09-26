import type { Pattern } from "./data";

// 全角半角(NFKC)・大文字小文字・カタカナ/ひらがなの表記ゆれを吸収する
export function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

// 「死ねと言われた」→「死ね」のように、被害を語る語尾を落とす
const SUFFIX = /(って|と)?(言われ|いわれ)(た|る|ている|てた)?$|(させられ|され|られ)(た|る|ている|てた)?$/;
const stripSuffix = (term: string) => term.replace(SUFFIX, "");

// クエリがこの長さ以上の語を含んでいればヒットとみなす（「親」1文字などで何でも当たるのを防ぐ）
const MIN_REVERSE = 2;

type Field = { weight: number; texts: string[] };

const fieldsOf = (p: Pattern): Field[] => [
  { weight: 10, texts: p.phrases },
  { weight: 6, texts: [p.title, ...p.keywords] },
  { weight: 3, texts: [...p.categories, ...p.tags] },
  { weight: 1, texts: [p.summary, ...p.examples, ...p.context, ...p.impacts] },
];

function scoreTerm(term: string, fields: Field[]): number {
  const base = stripSuffix(term);
  let best = 0;
  for (const { weight, texts } of fields) {
    for (const raw of texts) {
      const t = normalize(raw);
      const hit = t.includes(term) || (base.length > 0 && t.includes(base)) || (weight > 1 && t.length >= MIN_REVERSE && term.includes(t));
      if (hit) { best = Math.max(best, weight); break; }
    }
  }
  return best;
}

// スペース区切りの語をすべて満たすパターンを、一致の強さ順に返す
export function searchPatterns(list: Pattern[], query: string): Pattern[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return list;
  return list
    .map((p, i) => {
      const fields = fieldsOf(p);
      const scores = terms.map(t => scoreTerm(t, fields));
      return { p, i, score: scores.every(s => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(r => r.p);
}
