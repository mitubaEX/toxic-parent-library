"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, HeartHandshake, Menu } from "lucide-react";

export function Header(){const [menuOpen,setMenuOpen]=useState(false);return <header className="topbar"><Link className="brand" href="/"><span className="brand-mark"><BookOpen size={19}/></span><span>毒親ライブラリ</span></Link><nav className={menuOpen?"nav open":"nav"}><Link href="/#patterns">行動パターン</Link><Link href="/#categories">カテゴリ</Link><Link href="/map">カテゴリマップ</Link><Link href="/#about">このサイトについて</Link></nav><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="メニュー"><Menu/></button></header>}
export function Footer(){return <footer><div><div className="brand"><span className="brand-mark"><HeartHandshake size={19}/></span><span>毒親ライブラリ</span></div><p>家庭の中で繰り返される有害なパターンを、ここで止めるためのライブラリ。</p></div><div><strong>大切なお知らせ</strong><p>「毒親」は医学的な診断名ではありません。このサービスは特定の人物を診断・評価するものではありません。暴力など緊急性がある場合は、ためらわず公的な相談窓口や専門機関へ相談してください。</p></div></footer>}
