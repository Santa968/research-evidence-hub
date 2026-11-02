const encoder=new TextEncoder();
export async function digest(value:string) {const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(value)));return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}
async function sign(value:string,secret:string) {const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(value)));return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}
function equal(a:string,b:string) {if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export async function identity(request:Request,secret:string) {
  if(secret.length<24) throw new Error("COOKIE_SECRET_REQUIRED");
  const value=request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith("yanzhi_visitor="))?.slice(15)||"";
  const [id,signature]=value.split(".");
  const valid=!!id && /^[a-z0-9-]{36}$/.test(id) && equal(signature||"",await sign(id,secret));
  const visitor=valid?id:crypto.randomUUID();
  const cookie=`yanzhi_visitor=${visitor}.${await sign(visitor,secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(request.url).protocol==="https:"?"; Secure":""}`;
  return {visitor:await digest(visitor),cookie};
}
