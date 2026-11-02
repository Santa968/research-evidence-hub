import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {validateBundle} from "../lib/experiments.ts";
const root=resolve(import.meta.dirname,"..");
try{
 const file=process.argv[2];
 if(!file)throw new Error("用法：npm run import:experiment -- 脱敏后的运行.json [--check]");
 const input=readFileSync(resolve(file),"utf8");
 if(Buffer.byteLength(input)>10_000_000)throw new Error("单个导入包不能超过 10 MB");
 const read=(name:string)=>JSON.parse(readFileSync(resolve(root,"content",name+".json"),"utf8"));
 const data=validateBundle(JSON.parse(input),read("articles").map((a:{id:string})=>a.id));
 const runs=read("experiments"),replays=read("replays");
 if(runs.some((r:{run_id:string})=>r.run_id===data.experiment.run_id)||data.replays.some(r=>replays.some((p:{id:string})=>p.id===r.id)))throw new Error("标识已存在；不会覆盖已发布运行");
 if(!process.argv.includes("--check")){
  writeFileSync(resolve(root,"content/experiments.json"),JSON.stringify([...runs,data.experiment],null,2)+"\n");
  writeFileSync(resolve(root,"content/replays.json"),JSON.stringify([...replays,...data.replays],null,2)+"\n");
 }
 console.log(process.argv.includes("--check")?"校验通过，未写入文件。":"已导入运行及关联回放；请核对公开内容后提交。");
}catch(e){console.error(e instanceof Error&&e.name!=="ZodError"?e.message:"数据结构无效，请检查字段、计数和任务关联。");process.exitCode=1;}
