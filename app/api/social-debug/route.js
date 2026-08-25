export const dynamic='force-dynamic';
const TESTS=[
 ['Calcio e Finanza','calcioefinanza'],
 ['Paolo Ardoino','paoloardoino_prdn']
];
async function probe([name,handle]){
 const urls=[
  `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
  `https://www.instagram.com/${encodeURIComponent(handle)}/?__a=1&__d=dis`
 ];
 const out=[];
 for(const url of urls){
  const c=new AbortController();const t=setTimeout(()=>c.abort(),8000);
  try{
   const r=await fetch(url,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36','Accept':'application/json,text/plain,*/*','X-IG-App-ID':'936619743392459'}});
   const body=await r.text();
   let edges=0;let hasJuve=false;
   try{const d=JSON.parse(body);const user=d?.data?.user||d?.graphql?.user||d?.user;edges=user?.edge_owner_to_timeline_media?.edges?.length||0;hasJuve=/juventus|juve|spalletti|yildiz|kessie/i.test(JSON.stringify(user||{}));}catch{}
   out.push({url,status:r.status,len:body.length,edges,hasJuve,sample:body.slice(0,250)});
  }catch(e){out.push({url,error:String(e)})}finally{clearTimeout(t)}
 }
 return {name,handle,out};
}
export async function GET(){return Response.json(await Promise.all(TESTS.map(probe)),{headers:{'Cache-Control':'no-store'}})}
