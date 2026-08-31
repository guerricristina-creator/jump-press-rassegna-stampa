import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

const MAX_AGE=48*60*60*1000;
const X_EPOCH=1288834974657n;
const SOURCES={
 juventusfc:'Juventus',tuttosport:'Tuttosport',gazzetta_it:'La Gazzetta dello Sport',corsport:'Corriere dello Sport',
 skysport:'Sky Sport',sportmediaset:'Sport Mediaset',dimarzio:'Gianluca Di Marzio',fabrizioromano:'Fabrizio Romano',
 nicoschira:'Nicolò Schira',romeoagresti:'Romeo Agresti',giovaalbanese:'Giovanni Albanese',alfredopedulla:'Alfredo Pedullà',
 cmdotcom:'Calciomercato.com',tuttomercatoweb:'Tuttomercatoweb',goalitalia:'Goal Italia',footballitalia:'Football Italia',
 glongari:'Gianluigi Longari',cronachetweet:'Cronache di Spogliatoio',calciofinanza:'Calcio e Finanza',
 mattemoretto:'Matteo Moretto',fbians:'Fabrizio Biasin',fbiasin:'Fabrizio Biasin',marcoconterio:'Marco Conterio',
 '86_longo':'Daniele Longo',nicolabalice:'Nicola Balice',filippocornacchia:'Filippo Cornacchia',fabdellavalle:'Fabiana Della Valle',
 juventusnews24:'JuventusNews24',tuttojuve:'TuttoJuve',ilbianconerocom:'IlBianconero',
 ocwsport:'OCW Sport',mcriscitiello:'Michele Criscitiello'
};
const HANDLES=[...new Set(Object.keys(SOURCES))];
const RELEVANT=/(?:\bjuventus\b|\bjuve\b|\bbianconer\w*\b|\bcontinassa\b|@juventusfc\b|\bvecchia signora\b)/i;

function cleanText(v=''){return String(v).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/https?:\/\/t\.co\/\S+/gi,'').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_`]+/g,' ').replace(/\s+/g,' ').trim();}
function tweetTs(id){try{return Number((BigInt(id)>>22n)+X_EPOCH);}catch{return 0}}
function makeCandidate(handle,id){const h=handle.toLowerCase();const source=SOURCES[h];if(!source)return null;const ts=tweetTs(id);if(!ts||Date.now()-ts>MAX_AGE||ts>Date.now()+60000)return null;return {handle:h,id,source,ts,date:new Date(ts).toISOString(),link:`https://x.com/${handle}/status/${id}`};}
function extractCandidates(text=''){const out=[];const rx=/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d{15,22})/gi;for(const m of text.matchAll(rx)){const c=makeCandidate(m[1],m[2]);if(c)out.push(c)}return out}
function dedupeCandidates(items){const seen=new Set();return items.sort((a,b)=>b.ts-a.ts).filter(x=>{if(seen.has(x.link))return false;seen.add(x.link);return true})}
function dedupePosts(a){const seen=new Set();return a.sort((x,y)=>y.ts-x.ts).filter(p=>{const k=p.link;if(!k||seen.has(k))return false;seen.add(k);return true})}

async function fetchText(url,timeout=5000,headers={}){const c=new AbortController(),t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.5',...headers}});if(!r.ok)throw new Error(String(r.status));return await r.text()}finally{clearTimeout(t)}}

async function discoverBing(handle){const q=`site:x.com/${handle}/status (Juventus OR Juve OR bianconeri OR Continassa)`;try{return extractCandidates(await fetchText(`https://www.bing.com/search?format=rss&setlang=it-IT&cc=IT&q=${encodeURIComponent(q)}`,5500,{'Accept':'application/rss+xml,text/xml;q=0.9,*/*;q=0.5'}))}catch{return []}}
async function discoverDdg(handle){const q=`site:x.com/${handle}/status Juventus Juve`;try{return extractCandidates(await fetchText(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,5500))}catch{return []}}
async function discoverGoogleViaJina(handle){const q=`site:x.com/${handle}/status Juventus OR Juve`;try{return extractCandidates(await fetchText(`https://r.jina.ai/https://www.google.com/search?q=${encodeURIComponent(q)}`,6500,{'Accept':'text/plain'}))}catch{return []}}

function parseProfileText(text,handle){
 const out=[];
 const rx=new RegExp(`https?:\\/\\/(?:x|twitter)\\.com\\/${handle}\\/status\\/(\\d{15,22})`,'gi');
 const hits=[...text.matchAll(rx)];
 for(let i=0;i<hits.length;i++){
  const id=hits[i][1],c=makeCandidate(handle,id);if(!c)continue;
  const pos=hits[i].index||0;
  const prev=i?((hits[i-1].index||0)+hits[i-1][0].length):Math.max(0,pos-900);
  const next=i+1?(hits[i+1].index||text.length):Math.min(text.length,pos+1400);
  const chunk=text.slice(Math.max(prev,pos-900),Math.min(next,pos+1400));
  const body=cleanText(chunk).replace(/Log in|Sign up|See new posts/gi,' ').replace(/\s+/g,' ').trim().slice(0,1800);
  if(!body)continue;
  if(handle!=='juventusfc'&&!RELEVANT.test(body))continue;
  out.push({...c,body});
 }
 return dedupePosts(out).slice(0,12);
}

async function fetchDirectProfile(handle){
 const urls=[`https://r.jina.ai/https://x.com/${handle}`,`https://r.jina.ai/https://twitter.com/${handle}`];
 for(const u of urls){try{const text=await fetchText(u,7000,{'Accept':'text/plain'});const posts=parseProfileText(text,handle);if(posts.length)return posts}catch{}}
 return [];
}

async function fetchOembed(c){const urls=[
 `https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(c.link)}`,
 `https://publish.twitter.com/oembed?omit_script=true&dnt=true&url=${encodeURIComponent(c.link.replace('x.com','twitter.com'))}`
];
 for(const u of urls){try{const txt=await fetchText(u,4500,{'Accept':'application/json'});const data=JSON.parse(txt);const body=cleanText(data?.html||'');if(body)return {...c,body}}catch{}}
 return null;
}

async function fetchOfficialX(){const token=process.env.X_BEARER_TOKEN||process.env.TWITTER_BEARER_TOKEN;if(!token)return [];const groups=[];for(let i=0;i<HANDLES.length;i+=8)groups.push(HANDLES.slice(i,i+8));const jobs=groups.map(async g=>{const authors=g.map(h=>`from:${h}`).join(' OR '),q=`(Juventus OR Juve OR bianconeri OR Continassa) (${authors}) -is:retweet`;const url='https://api.x.com/2/tweets/search/recent?max_results=100&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username&query='+encodeURIComponent(q);const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});if(!r.ok)return [];const data=await r.json(),users=new Map((data.includes?.users||[]).map(u=>[u.id,u]));return (data.data||[]).map(tweet=>{const u=users.get(tweet.author_id);if(!u)return null;const handle=String(u.username||'').toLowerCase(),source=SOURCES[handle],body=cleanText(tweet.text||''),date=tweet.created_at,ts=Date.parse(date)||0;if(!source||!body||!ts||Date.now()-ts>MAX_AGE)return null;return {source,body,date,ts,link:`https://x.com/${u.username}/status/${tweet.id}`};}).filter(Boolean);}catch{return []}finally{clearTimeout(t)}});const settled=await Promise.allSettled(jobs);return settled.flatMap(r=>r.status==='fulfilled'?r.value:[])}

export async function GET(){
 try{
  const officialPromise=fetchOfficialX();
  const directJobs=HANDLES.map(fetchDirectProfile);
  const discoveryJobs=[];
  for(const h of HANDLES){discoveryJobs.push(discoverBing(h),discoverDdg(h));}
  for(const h of ['skysport','tuttosport','gazzetta_it','corsport','dimarzio','fabrizioromano','nicoschira','romeoagresti','giovaalbanese','alfredopedulla','tuttomercatoweb','cmdotcom','glongari','ocwsport','mcriscitiello']) discoveryJobs.push(discoverGoogleViaJina(h));

  const [directSettled,discoveredSettled]=await Promise.all([Promise.allSettled(directJobs),Promise.allSettled(discoveryJobs)]);
  const directPosts=dedupePosts(directSettled.flatMap(r=>r.status==='fulfilled'?r.value:[]));
  const discovered=dedupeCandidates(discoveredSettled.flatMap(r=>r.status==='fulfilled'?r.value:[])).slice(0,90);

  const enriched=[];
  for(let i=0;i<discovered.length;i+=10){
   const batch=await Promise.allSettled(discovered.slice(i,i+10).map(fetchOembed));
   enriched.push(...batch.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]));
   if(enriched.length>=60)break;
  }
  const publicPosts=enriched.filter(p=>p.source==='Juventus'||RELEVANT.test(p.body));
  const official=await officialPromise;
  const posts=dedupePosts([...official,...directPosts,...publicPosts]).slice(0,220);
  const sources=[...new Set(posts.map(p=>p.source))];
  return NextResponse.json({posts,generatedAt:new Date().toISOString(),officialX:Boolean(process.env.X_BEARER_TOKEN||process.env.TWITTER_BEARER_TOKEN),sourceCount:sources.length,discovered:discovered.length,directCount:directPosts.length,mode:'free-first'},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=180'}})
 }catch{
  return NextResponse.json({posts:[],degraded:true,mode:'free-first'},{headers:{'Cache-Control':'no-store'}})
 }
}
