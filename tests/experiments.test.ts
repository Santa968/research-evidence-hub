import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateBundle,replaySchema} from "../lib/experiments.ts";
const teaching=JSON.parse(readFileSync(new URL("../content/replays.json",import.meta.url),"utf8"))[0];
function bundle(){
 const replay={...structuredClone(teaching),id:"fixture-trace",origin:"recorded_run",benchmark:"fixture-only",run_id:"fixture-run",task_id:"task-1",attempt_id:"attempt-1",model:"fixture-model",recorded_at:"2026-11-03T00:00:00Z",article_ids:["planning"]};
 const experiment={run_id:"fixture-run",benchmark:"fixture-only",upstream_commit:"abcdef0",model:"fixture-model",method:"fixture",scorer:"fixture-scorer",recorded_at:"2026-11-03T00:00:00Z",scope:"subset",dataset:"fixture",config:{temperature:0},summary:"仅用于校验的测试夹具，不发布成绩。",sources:[{title:"fixture",url:"https://example.com/fixture"}],counts:{planned:1,succeeded:1,task_failed:0,environment_failed:0,scoring_failed:0,not_run:0},metrics:[],tokens:null,cost_usd:null,tasks:[{task_id:"task-1",attempt_id:"attempt-1",status:"succeeded",summary:"fixture",replay_id:"fixture-trace"}]};
 return {experiment,replays:[replay]};
}
test("teaching replay is explicit; actual runs retain unknown costs as null",()=>{
 assert.equal(replaySchema.parse(teaching).origin,"scripted_demo");
 assert.equal(validateBundle(bundle(),["planning"]).experiment.cost_usd,null);
 const wrong={...teaching,run_id:"fake"};assert.throws(()=>replaySchema.parse(wrong));
});
test("import rejects inconsistent denominators and dangling or mismatched traces",()=>{
 const wrongCount=bundle();wrongCount.experiment.counts.planned=10;assert.throws(()=>validateBundle(wrongCount,["planning"]));
 const wrongTask=bundle();wrongTask.replays[0].attempt_id="other";assert.throws(()=>validateBundle(wrongTask,["planning"]));
 const missing=bundle();missing.replays=[];assert.throws(()=>validateBundle(missing,["planning"]));
 const sequence=bundle();sequence.replays[0].events[0].sequence=2;assert.throws(()=>validateBundle(sequence,["planning"]));
});
test("import rejects credential fields and unreviewed article references",()=>{
 const secret=bundle();Object.assign(secret.experiment.config,{api_key:"fixture-secret"});assert.throws(()=>validateBundle(secret,["planning"]),/凭证/);
 assert.throws(()=>validateBundle(bundle(),[]),/文章/);
});

test("external author traces remain attributable and cannot enter team-run bundles",()=>{
 const traces=JSON.parse(readFileSync(new URL("../content/author-replays.json",import.meta.url),"utf8"));
 for(const trace of traces){assert.equal(replaySchema.parse(trace).origin,"author_record");assert.match(trace.source_url,/^https:\/\//);assert.throws(()=>replaySchema.parse({...trace,source_url:undefined}));const data=bundle();data.replays=[trace];assert.throws(()=>validateBundle(data,["planning"]));}
});
test("external scores retain source and condition; distinct groups do not get merged",()=>{
 const benchmarks: {results:string[]}[]=JSON.parse(readFileSync(new URL("../content/benchmarks.json",import.meta.url),"utf8"));
 const scores: {id:string;url:string;metric:string;condition:string;accessed:string;rows:{model:string;value:number}[]}[]=JSON.parse(readFileSync(new URL("../content/benchmark-results.json",import.meta.url),"utf8"));
 assert.equal(benchmarks.length,4);assert.equal(new Set(scores.map(g=>g.id)).size,scores.length);
 for(const b of benchmarks)for(const id of b.results)assert.ok(scores.some(g=>g.id===id));
 for(const group of scores){assert.match(group.url,/^https:\/\//);assert.ok(group.metric&&group.condition&&group.accessed);for(const row of group.rows)assert.ok(row.model&&Number.isFinite(row.value));}
 assert.notEqual(scores.find(g=>g.id==="live-paper")?.id,scores.find(g=>g.id==="live-leaderboard")?.id);
});
