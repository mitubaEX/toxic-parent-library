"use client";
import { useState } from "react";
import { BookOpen, HeartHandshake, Menu } from "lucide-react";

// vinext(beta) の next/link はクリック時に "RSC prefetch setup error" で遷移しないため、通常の <a> を使う
/* eslint-disable @next/next/no-html-link-for-pages */
export function Header(){const [menuOpen,setMenuOpen]=useState(false);return <header className="topbar"><a className="brand" href="/"><span className="brand-mark"><BookOpen size={19}/></span><span>毒親ライブラリ</span></a><nav className={menuOpen?"nav open":"nav"}><a href="/#patterns">行動パターン</a><a href="/#categories">カテゴリ</a><a href="/map">カテゴリマップ</a><a href="/#about">このサイトについて</a></nav><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="メニュー"><Menu/></button></header>}
/* eslint-enable @next/next/no-html-link-for-pages */
export function Footer(){return <footer><div><div className="brand"><span className="brand-mark"><HeartHandshake size={19}/></span><span>毒親ライブラリ</span></div><p>家庭の中で繰り返される有害なパターンを、ここで止めるためのライブラリ。</p></div><div><strong>大切なお知らせ</strong><p>「毒親」は医学的な診断名ではありません。このサービスは特定の人物を診断・評価するものではありません。暴力など緊急性がある場合は、ためらわず公的な相談窓口や専門機関へ相談してください。</p></div></footer>}
