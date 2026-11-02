"use client";
import {useAsk} from "./shell";
import {Icon} from "./icons";
export function ArticleAsk(){const ask=useAsk();return <button className="article-ask" onClick={ask}><span><Icon name="ask"/>关于这篇内容，有个问题？</span><Icon name="arrow-right" size={17}/></button>;}
