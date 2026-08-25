export const dynamic='force-dynamic';
const TESTS={
 syndication:'https://syndication.twitter.com/srv/timeline-profile/screen-name/FabrizioRomano',
 syndication2:'https://syndication.twitter.com/srv/timeline-profile/screen-name/DiMarzio'
};
async function probe(url){const r=await fetch(url,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,*/*'}});const body=await r.text();return {status:r.status,len:body.length,hasJuve:/juventus|juve|kessie|miretti/i.test(body),statusIds:[...new Set(body.match(/status\/\d+/g)||[])].slice(0,20),sample:body.slice(0,1200)};}
export async function GET(){const entries=await Promise.all(Object.entries(TESTS).map(async ([k,u])=>[k,await probe(u)]));return Response.json(Object.fromEntries(entries),{headers:{'Cache-Control':'no-store'}})}
