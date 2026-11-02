import { dayBucket, resetAt, reservation, type Settings } from "./settings.ts";

export interface Statement { bind(...values: unknown[]): Statement; first<T=Record<string,unknown>>(): Promise<T|null>; run(): Promise<unknown>; }
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown>;}
export class ServiceError extends Error { code:string;status:number;retryAfter:number;constructor(code:string,status=429,retryAfter=60){super(code);this.code=code;this.status=status;this.retryAfter=retryAfter;} }
const codes=["USER_QUOTA_EXCEEDED","IP_QUOTA_EXCEEDED","RATE_LIMITED","SITE_QUOTA_EXCEEDED","CONCURRENCY_LIMITED","SITE_BUDGET_EXCEEDED"];
export async function usage(db:Database,visitor:string,s:Settings,now=Date.now()) {
  const row=await db.prepare("SELECT count(*) AS used FROM requests WHERE visitor=? AND day=? AND state!='refunded'").bind(visitor,dayBucket(now)).first<{used:number}>();
  return {remaining:Math.max(0,s.userDay-(row?.used||0)),limit:s.userDay,reset_at:resetAt(now)};
}
export async function reserve(db:Database,params:{id:string;visitor:string;ip:string;signature:string;now?:number},s:Settings) {
  const now=params.now??Date.now();
  const existing=await db.prepare("SELECT state,signature,answer_json FROM requests WHERE id=?").bind(params.id).first<{state:string;signature:string;answer_json:string|null}>();
  if(existing) {
    if(existing.signature!==params.signature) throw new ServiceError("IDEMPOTENCY_CONFLICT",409);
    if(existing.state==="settled"&&existing.answer_json) return {duplicate:JSON.parse(existing.answer_json)};
    throw new ServiceError(existing.state==="reserved"?"REQUEST_IN_PROGRESS":"REQUEST_ALREADY_ATTEMPTED",409);
  }
  try {
    await db.batch([
      db.prepare("UPDATE requests SET state='unknown' WHERE state='reserved' AND created_at<=?").bind(now-90000),
      db.prepare("INSERT INTO requests (id,visitor,ip,day,created_at,state,signature,reserved_micro,user_day,user_minute,ip_day,ip_minute,site_day,user_concurrency,site_concurrency,budget_micro) VALUES (?,?,?,?,?,'reserved',?,?,?,?,?,?,?,?,?,?)")
        .bind(params.id,params.visitor,params.ip,dayBucket(now),now,params.signature,reservation(s),s.userDay,s.userMinute,s.ipDay,s.ipMinute,s.siteDay,s.userConcurrency,s.siteConcurrency,s.budgetMicro),
    ]);
    return {duplicate:null};
  } catch(e) {
    const message=String(e instanceof Error?e.message:"");
    const code=codes.find(c=>message.includes(c));
    if(code) { const daily=["USER_QUOTA_EXCEEDED","IP_QUOTA_EXCEEDED","SITE_QUOTA_EXCEEDED","SITE_BUDGET_EXCEEDED"].includes(code); throw new ServiceError(code,429,daily?Math.max(1,Math.ceil((Date.parse(resetAt(now))-now)/1000)):60); }
    // A concurrent request with the same id is never sent upstream twice.
    if(message.includes("UNIQUE")) throw new ServiceError("REQUEST_IN_PROGRESS",409);
    throw new ServiceError("QUOTA_STORAGE_UNAVAILABLE",503);
  }
}
export async function settle(db:Database,id:string,cost:number|null,answer:unknown,errorCode?:string,meter?:{model:string|null;input:number|null;output:number|null}) {
  if(cost===null) await db.prepare("UPDATE requests SET state='unknown',error_code=? WHERE id=? AND state='reserved'").bind(errorCode||"USAGE_UNKNOWN",id).run();
  else await db.prepare("UPDATE requests SET state='settled',actual_micro=?,answer_json=?,error_code=?,model=?,input_tokens=?,output_tokens=? WHERE id=? AND state='reserved'").bind(Math.max(0,Math.ceil(cost)),answer?JSON.stringify(answer):null,errorCode||null,meter?.model||null,meter?.input??null,meter?.output??null,id).run();
}
