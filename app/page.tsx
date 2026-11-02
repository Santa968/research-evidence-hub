import { Suspense } from "react";
import { Catalog } from "./ui/catalog";
export default function Home(){return <Suspense fallback={<div className="loading-page">正在载入知识库…</div>}><Catalog/></Suspense>;}
