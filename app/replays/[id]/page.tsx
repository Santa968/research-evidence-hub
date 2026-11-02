import {notFound} from "next/navigation";
import replays from "../../../content/replays.json";
import {ReplayPlayer,type Replay} from "../../ui/replay-player";
export function generateStaticParams(){return replays.map(r=>({id:r.id}));}
export default async function ReplayPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const replay=replays.find(r=>r.id===id);if(!replay)notFound();return <ReplayPlayer replay={replay as Replay}/>;}
