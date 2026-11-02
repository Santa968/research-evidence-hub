import { context,errorResponse } from "../../../lib/server";
import { usage } from "../../../lib/quota";
export async function GET(request:Request){try{const c=await context(request);return Response.json({quota:await usage(c.db,c.visitor,c.s),available:!!c.s.key},{headers:{"Set-Cookie":c.cookie,"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
