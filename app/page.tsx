"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Filter, Search, ShieldAlert, X } from "lucide-react";
import { categories, Pattern, patterns } from "./data";
import { searchPatterns } from "./search";
import { Footer, Header } from "./site-chrome";

const sources=[
 {title:"児童虐待の定義と対応",org:"こども家庭庁",type:"government",url:"https://www.cfa.go.jp/policies/jidougyakutai/"},
 {title:"子どもの権利条約",org:"ユニセフ",type:"ngo",url:"https://www.unicef.or.jp/about_unicef/about_rig.html"},
 {title:"体罰等によらない子育てのために",org:"こども家庭庁",type:"government",url:"https://www.cfa.go.jp/policies/jidougyakutai/taibatsu"},
];

const subscribeUrl=(cb:()=>void)=>{window.addEventListener("popstate",cb);return()=>window.removeEventListener("popstate",cb)};

export default function Home(){
 const [query,setQuery]=useState(""); const [category,setCategory]=useState("すべて"); const [age,setAge]=useState("すべて"); const [scene,setScene]=useState("すべて"); const [severity,setSeverity]=useState("すべて"); const [selected,setSelected]=useState<Pattern|null>(null); const [filtersOpen,setFiltersOpen]=useState(false);
 const results=useMemo(()=>{return searchPatterns(patterns,query).filter(p=>{return (category==="すべて"||p.categories.includes(category))&&(age==="すべて"||p.ages.includes("全年代")||p.ages.includes(age))&&(scene==="すべて"||p.scene===scene)&&(severity==="すべて"||p.severity===severity)})},[query,category,age,scene,severity]);
 // /?pattern=pattern-41 のように詳細ページを直接開く（カテゴリマップからの遷移用）
 const urlPatternId=useSyncExternalStore(subscribeUrl,()=>new URLSearchParams(window.location.search).get("pattern"),()=>null);
 const current=selected??patterns.find(p=>p.id===urlPatternId)??null;
 const openPattern=(p:Pattern)=>{setSelected(p);window.scrollTo({top:0,behavior:"smooth"})};
 const closePattern=()=>{if(window.location.search)window.history.replaceState(null,"",window.location.pathname);setSelected(null)};
 if(current)return <Detail pattern={current} onBack={closePattern} onOpen={openPattern}/>;
 const scenes=Array.from(new Set(patterns.map(p=>p.scene))); const activeFilters=[category,age,scene,severity].filter(v=>v!=="すべて").length;
 return <div className="site-shell"><Header/><main>
  <section className="search-hero"><div className="eyebrow"><span/>パターンを、ここで止めるために</div><h1>家庭の中で起きたことを、<br/><em>行動から理解する。</em></h1><p className="hero-copy">誰かを「毒親」と判定するのではなく、有害になりうる関わり方と、その代わりにできることを整理したライブラリです。</p><label className="search-box"><Search size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="親に言われたこと・されたことを検索" aria-label="行動パターンを検索"/>{query&&<button onClick={()=>setQuery("")} aria-label="検索をクリア"><X size={18}/></button>}</label><div className="suggestions"><span>たとえば</span>{["死ねと言われた","スマホを見られた","兄弟と比較された","親の愚痴を聞かされた"].map(s=><button key={s} onClick={()=>setQuery(s)}>{s}</button>)}</div></section>
  <section className="library" id="patterns"><aside className={filtersOpen?"filters open":"filters"}><div className="filter-head"><h2>絞り込み</h2><button onClick={()=>setFiltersOpen(false)}><X/></button></div><FilterGroup title="カテゴリ" value={category} setValue={setCategory} options={categories.slice(0,10)}/><FilterGroup title="子どもの年代" value={age} setValue={setAge} options={["小学生","中高生","成人"]}/><FilterGroup title="場面" value={scene} setValue={setScene} options={scenes}/><FilterGroup title="強度" value={severity} setValue={setSeverity} options={["低","中","高"]}/>{activeFilters>0&&<button className="clear-filter" onClick={()=>{setCategory("すべて");setAge("すべて");setScene("すべて");setSeverity("すべて")}}>絞り込みを解除</button>}</aside>
  <div className="results"><div className="results-head"><div><p className="section-label">BEHAVIOR PATTERNS</p><h2>{query?`「${query}」の検索結果`:"行動パターンを探す"}</h2><p>{results.length}件のパターン</p></div><button className="filter-button" onClick={()=>setFiltersOpen(true)}><Filter size={18}/>絞り込み {activeFilters>0&&<b>{activeFilters}</b>}</button></div>{results.length?<div className="card-grid">{results.map(p=><PatternCard key={p.id} p={p} onOpen={openPattern}/>)}</div>:<div className="empty"><Search/><h3>一致するパターンが見つかりませんでした</h3><p>言葉を短くするか、絞り込みを減らしてみてください。</p></div>}</div></section>
  <section className="category-section" id="categories"><p className="section-label">BROWSE BY CATEGORY</p><h2>関わり方の種類から探す</h2><div className="category-cloud">{categories.map(c=><button key={c} onClick={()=>{setCategory(c);document.getElementById("patterns")?.scrollIntoView({behavior:"smooth"})}}>{c}<span>{patterns.filter(p=>p.categories.includes(c)).length}</span></button>)}</div></section>
  <section className="about" id="about"><div><p className="section-label">OUR PRINCIPLE</p><h2>人を裁くためではなく、<br/>繰り返さないために。</h2></div><div className="steps">{[["01","行動を理解する"],["02","影響を理解する"],["03","境界線を見つける"],["04","別の選択肢を知る"]].map(([n,t])=><div key={n}><span>{n}</span><p>{t}</p></div>)}</div></section>
 </main><Footer/></div>
}

function PatternCard({p,onOpen}:{p:Pattern,onOpen:(p:Pattern)=>void}){return <article className="pattern-card" onClick={()=>onOpen(p)}><div className="card-tags">{p.categories.slice(0,3).map(c=><span key={c}>{c}</span>)}</div><h3>{p.title}</h3><p>{p.summary}</p><div className="card-meta"><span>{p.scene}</span><span>対象：親・養育者</span></div><button>詳しく見る <ArrowRight size={16}/></button></article>}
function FilterGroup({title,value,setValue,options}:{title:string,value:string,setValue:(v:string)=>void,options:string[]}){return <fieldset><legend>{title}</legend><label><input type="radio" checked={value==="すべて"} onChange={()=>setValue("すべて")}/>すべて</label>{options.map(o=><label key={o}><input type="radio" checked={value===o} onChange={()=>setValue(o)}/>{o}</label>)}</fieldset>}

function Detail({pattern:p,onBack,onOpen}:{pattern:Pattern,onBack:()=>void,onOpen:(p:Pattern)=>void}){const related=patterns.filter(x=>x.id!==p.id&&x.categories.some(c=>p.categories.includes(c))).slice(0,3);return <div className="site-shell"><header className="topbar"><button className="brand" onClick={onBack}><span className="brand-mark"><BookOpen size={19}/></span><span>毒親ライブラリ</span></button><button className="back-top" onClick={onBack}><ArrowLeft size={18}/> 一覧へ戻る</button></header><main className="detail-layout"><aside className="detail-toc"><p>このページの内容</p>{["概要",...(p.phrases.length?["言われた言葉の例"]:[]),"具体例","健全な関与との境界","背景の可能性","子どもへの影響","代わりにできる行動","養育者による現れ方","参考資料"].map(x=><span key={x}>{x}</span>)}</aside><article className="detail-article"><button className="mobile-back" onClick={onBack}><ArrowLeft size={17}/>行動パターン一覧</button><div className="detail-tags">{p.categories.map(c=><span key={c}>{c}</span>)}</div><h1>{p.title}</h1><p className="lead">{p.summary}</p><div className="principle-note"><BookOpen/><div><strong>このページは人物を診断するものではありません</strong><p>ひとつの行動だけで、特定の人を「毒親」と判定することはできません。頻度、強さ、文脈、本人への影響を含めて考えます。</p></div></div>
 {p.phrases.length>0&&<Section title="言われた言葉の例" kicker="WORDS"><div className="caregiver-list">{p.phrases.map(x=><span key={x}>「{x}」</span>)}</div></Section>}
 <Section title="よくある具体例" kicker="CONCRETE EXAMPLES"><ul className="check-list">{p.examples.map(x=><li key={x}><Check size={17}/>{x}</li>)}</ul></Section>
 <Section title="健全な関与との境界" kicker="WHERE IS THE BOUNDARY"><p>配慮や安全確認が、ただちに有害になるわけではありません。対話、本人の納得、繰り返しの有無を含めると、境界はグラデーションとして見えてきます。</p><div className="gradient-scale">{p.boundaries.map((b,i)=><div className={b.level} key={b.label}><span>{i+1}</span><p>{b.label}</p></div>)}</div></Section>
 <Section title="親・養育者側で起きている可能性" kicker="POSSIBLE CONTEXTS"><div className="context-grid">{p.context.map(x=><div key={x}>{x}</div>)}</div><p className="context-note"><ShieldAlert size={19}/><span><strong>背景の理解と、行動の許容は別です。</strong><br/>事情があることは、有害な関わりを続けてよい理由にはなりません。</span></p></Section>
 <Section title="子ども側に起こりうる影響" kicker="POSSIBLE IMPACTS"><ul className="impact-list">{p.impacts.map(x=><li key={x}>{x}</li>)}</ul></Section>
 <Section title="代わりにできる行動" kicker="HEALTHY ALTERNATIVES"><p>感情や心配を否定せず、決定権と境界線を尊重する言葉へ置き換えます。</p>{p.alternatives.map(a=><div className="alternative" key={a.ng}><div className="ng"><span>避けたい言い方</span><p>「{a.ng}」</p></div><ChevronRight/><div className="better"><span>代わりの伝え方</span><p>「{a.better}」</p></div></div>)}</Section>
 <Section title="母親・父親・その他養育者での現れ方" kicker="CAREGIVER CONTEXT"><p>{p.appearance}</p><div className="caregiver-list">{p.caregivers.map(x=><span key={x}>{x}</span>)}</div></Section>
 <Section title="参考資料" kicker="SOURCES"><div className="source-list">{sources.map(s=><a key={s.title} href={s.url} target="_blank" rel="noreferrer"><div><span>{s.type}</span><h3>{s.title}</h3><p>{s.org}</p></div><ArrowRight/></a>)}</div></Section>
 <section className="related"><p className="section-label">RELATED PATTERNS</p><h2>関連する行動パターン</h2><div className="card-grid">{related.map(x=><PatternCard key={x.id} p={x} onOpen={onOpen}/>)}</div></section></article></main><Footer/></div>}
function Section({title,kicker,children}:{title:string,kicker:string,children:React.ReactNode}){return <section className="detail-section"><p className="section-label">{kicker}</p><h2>{title}</h2>{children}</section>}

