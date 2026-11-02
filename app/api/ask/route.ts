import { context,errorResponse } from "../../../lib/server";
import { ask } from "../../../lib/ask";
import { ServiceError } from "../../../lib/quota";
export async function POST(request:Request){let cookie:string|undefined;try{
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)throw new ServiceError("INVALID_INPUT",403);
  if(!request.headers.get("content-type")?.includes("application/json"))throw new ServiceError("INVALID_INPUT",400);
  const reader=request.body?.getReader();if(!reader)throw new ServiceError("INVALID_INPUT",400);let size=0;const parts:Uint8Array[]=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw new ServiceError("INVALID_INPUT",400);}parts.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}
  let body;try{body=JSON.parse(new TextDecoder().decode(all));}catch{throw new ServiceError("INVALID_INPUT",400);}
  if(!body||typeof body.question!=="string"||typeof body.request_id!=="string"||!/^[a-zA-Z0-9-]{12,80}$/.test(body.request_id)||body.article_id!==undefined&&typeof body.article_id!=="string")throw new ServiceError("INVALID_INPUT",400);
  const c=await context(request);cookie=c.cookie;
  const result=await ask(c.db,c.s,{question:body.question,articleId:body.article_id,requestId:body.request_id},c.visitor,c.ip);
  return Response.json(result,{headers:{"Set-Cookie":cookie,"Cache-Control":"no-store"}});
}catch(e){return errorResponse(e,cookie);}}
