import type { Metadata } from "next";
import { patterns } from "../data";
import { bridges, groups, groupsOf, overlapMatrix, patternsInGroup, sceneMatrix } from "../groups";
import { Footer, Header } from "../site-chrome";

export const metadata: Metadata = {
  title: "カテゴリマップ｜毒親ライブラリ",
  description: "行動パターンのカテゴリを7つのグループに整理し、重なりや場面ごとの傾向を示します。",
};

const countOf = (c: string) => patterns.filter(p => p.categories.includes(c)).length;
const patternHref = (id: string) => `/?pattern=${id}`;

// 件数に応じて濃くなるセル
function Heat({ n, max }: { n: number; max: number }) {
  if (!n) return <td className="heat zero">·</td>;
  const a = 0.12 + 0.88 * (n / max);
  return <td className="heat" style={{ background: `rgba(15,104,100,${a})`, color: a > 0.55 ? "white" : "var(--ink)" }}>{n}</td>;
}

export default function MapPage() {
  const overlap = overlapMatrix(patterns);
  const overlapMax = Math.max(...overlap.flat());
  const scenes = sceneMatrix(patterns);
  const sceneMax = Math.max(...scenes.flatMap(r => r.counts));
  const multi = bridges(patterns);
  const categoryCount = new Set(patterns.flatMap(p => p.categories)).size;

  return <div className="site-shell"><Header /><main className="map-page">
    <section className="map-hero">
      <p className="section-label">CATEGORY MAP</p>
      <h1>関わり方の種類を、<br />7つのまとまりで見る。</h1>
      <p>{patterns.length}件の行動パターンには、{categoryCount}種類のカテゴリが1件あたり2〜4個ついています。意味の近いカテゴリを7つのグループにまとめ、重なりや起きやすい場面を整理しました。</p>
    </section>

    <section className="map-section">
      <p className="section-label">GROUPS</p>
      <h2>7つのグループ</h2>
      <p className="map-note">件数は、そのグループのカテゴリを1つ以上もつパターンの数です。1つのパターンが複数のグループに入ることがあります。</p>
      <div className="group-grid">{groups.map(g => <a className="group-card" key={g.key} href={`#group-${g.key}`}>
        <div className="group-head"><span className="group-key">{g.key}</span><h3>{g.name}</h3><b>{patternsInGroup(patterns, g.key).length}件</b></div>
        <p>{g.description}</p>
        <div className="group-cats">{g.categories.map(c => <span key={c}>{c}<i>{countOf(c)}</i></span>)}</div>
      </a>)}</div>
    </section>

    <section className="map-section">
      <p className="section-label">OVERLAPS</p>
      <h2>グループ同士の重なり</h2>
      <p className="map-note">両方のグループにまたがるパターンの件数です。「境界線を越える」と「人生の決定を奪う」の重なりが最も多く、監視や過干渉は、進路や自立への支配と一緒に起きやすいことがわかります。「心を操作する」は、ほとんどのグループとつながっています。</p>
      <div className="table-scroll"><table className="heat-table">
        <thead><tr><th />{groups.map(g => <th key={g.key} title={g.name}>{g.key}</th>)}</tr></thead>
        <tbody>{groups.map((g, i) => <tr key={g.key}><th>{g.key}. {g.name}</th>{overlap[i].map((n, j) => i === j ? <td key={j} className="heat self">—</td> : <Heat key={j} n={n} max={overlapMax} />)}</tr>)}</tbody>
      </table></div>
    </section>

    <section className="map-section">
      <p className="section-label">SCENES</p>
      <h2>場面ごとの傾向</h2>
      <p className="map-note">どの場面で、どの種類の関わりが起きやすいかを件数で示します。会話・衝突では言葉や恐怖、家族関係では役割の逆転、進路や自立では決定を奪う関わりが目立ちます。</p>
      <div className="table-scroll"><table className="heat-table">
        <thead><tr><th>場面</th>{groups.map(g => <th key={g.key} title={g.name}>{g.key}</th>)}</tr></thead>
        <tbody>{scenes.map(r => <tr key={r.scene}><th>{r.scene}</th>{r.counts.map((n, j) => <Heat key={j} n={n} max={sceneMax} />)}</tr>)}</tbody>
      </table></div>
      <p className="map-legend">{groups.map(g => <span key={g.key}><b>{g.key}</b>{g.name}</span>)}</p>
    </section>

    <section className="map-section">
      <p className="section-label">MULTIPLE HARMS</p>
      <h2>3つ以上のグループにまたがるパターン</h2>
      <p className="map-note">1つの行動に、複数の種類の有害性が重なっている例です。</p>
      <ul className="bridge-list">{multi.map(p => <li key={p.id}><a href={patternHref(p.id)}>{p.title}</a><span>{groupsOf(p).map(k => <b key={k}>{k}</b>)}</span></li>)}</ul>
    </section>

    <section className="map-section">
      <p className="section-label">DETAILS</p>
      <h2>グループごとの詳細</h2>
      <p className="map-note">カテゴリごとに、該当するパターンを並べています。パターン名から詳細ページを開けます。</p>
      {groups.map(g => <details className="group-detail" id={`group-${g.key}`} key={g.key}>
        <summary><span className="group-key">{g.key}</span>{g.name}<b>{patternsInGroup(patterns, g.key).length}件</b></summary>
        {g.categories.map(c => <div className="cat-block" key={c}>
          <h4>{c}<i>{countOf(c)}件</i></h4>
          <ul>{patterns.filter(p => p.categories.includes(c)).map(p => <li key={p.id}><a href={patternHref(p.id)}>{p.title}</a></li>)}</ul>
        </div>)}
      </details>)}
    </section>
  </main><Footer /></div>;
}
