import records from "../content/benchmarks.json" with {type:"json"};
import scores from "../content/benchmark-results.json" with {type:"json"};

export const benchmarks=records;
export const benchmarkResults=scores;
export const benchmarkById=(id:string)=>benchmarks.find(b=>b.id===id);
export const resultsFor=(ids:string[])=>ids.map(id=>benchmarkResults.find(r=>r.id===id)).filter((r):r is (typeof scores)[number]=>Boolean(r));
