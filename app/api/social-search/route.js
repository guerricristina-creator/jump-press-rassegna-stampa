import {NextResponse} from 'next/server';

export const dynamic='force-dynamic';

const MAX_AGE=36*60*60*1000;
const NITTER_BASES=['https://nitter.cf','https://xcancel.com'];
const SOURCES={
 juventusfc:'Juventus',tuttosport:'Tuttosport',gazzetta_it:'La Gazzetta dello Sport',corsport:'Corriere dello Sport',
 skysport:'Sky Sport',sportmediaset:'Sport Mediaset',dimarzio:'Gianluca Di Marzio',fabrizioromano:'Fabrizio Romano',
 nicoschira:'Nicolò Schira',romeoagresti:'Romeo Agresti',giovaalbanese:'Giovanni Albanese',alfredopedulla:'Alfredo Pedullà',
 cmdotcom:'Calciomercato.com',tuttomercatoweb:'Tuttomercatoweb',goalitalia:'Goal Italia',footballitalia:'Football Italia',
 glongari:'Gianluigi Longari',cronachetweet:'Cronache di Spogliatoio',calciofinanza:'Calcio e Finanza',
 mattemoretto:'Matteo Moretto',fbians:'Fabrizio Biasin',fbiasin:'Fabrizio Biasin',marcoconterio:'Marco Conterio',
 '86_longo':'Daniele Longo',nicolabalice:'Nicola Balice',filippocornacchia:'Filippo Cornacchia',fabdellavalle:'Fabiana Della Valle'
};

function decodeXml(s=''){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));}
function xmlText(block,tag){const m=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?decodeXml(m[1].trim()):'';}
function clean(v=''){return decodeXml(v).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/https?:\/\/(?:www\.)?(?:nitter\.cf|xcancel\.com)(?::\d+)?\/t\.co\/\S+/gi,'').replace(/https?:\/\/t\.co\/\S+/gi,'').replace(/\s+/g,' ').trim();}
function relevant(body=''){return /(?:\bjuventus\b|\bjuve\b|\bbianconer\w*\b|\bcontinassa\b|@juventusfc\b)/i.test(body)}
function parse(xml){const out=[];for(const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){const b=m[1];const raw=xmlText(b,'link')||xmlText(b,'guid');const hit=raw.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i)||raw.match(/\/([A-Za-z0-9_]+)\/status\/(\d+)/i);if(!hit)continue;const handle=hit[1].toLowerCase(),source=SOURCES[handle];if(!source)continue;const date=xmlText(b,'pubDate')||xmlText(b,'dc:date'),ts=Date.parse(date)||0;if(!ts||Date.now()-ts>MAX_AGE)continue;const title=clean(xmlText(b,'title')),desc=clean(xmlText(b,'description')),body=[desc,title].sort((a,b)=>b.length-a.length)[0]||'';if(!body||!(handle==='juventusfc'||relevant(body)))continue;out.push({source,body,date,ts,link:`https://x.com/${hit[1]}/status/${hit[2]}`});}return out;}
async function fetchNitter(base,q){const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);try{const r=await fetch(`${base}/search/rss?f=tweets&q=${encodeURIComponent(q)}`,{cache:'no-store',signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.5'}});if(!r.ok)throw new Error(String(r.status));const xml=await r.text();if(!/<item>/i.test(xml))throw new Error('empty');return parse(xml);}finally{clearTimeout(t)}}
async function fetchBing(q){const c=new AbortController(),t=setTimeout(()=>c.abort(),5500);try{const r=await fetch(`https://www.bing.com/search?format=rss&setlang=it-IT&cc=IT&q=${encodeURIComponent(`site:x.com ${q}`)}`,{cache:'no-store',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept':'application/rss+xml,text/xml;q=0.9,*/*;q=0.5'}});if(!r.ok)throw new Error(String(r.status));return parse(await r.text());}finally{clearTimeout(t)}}
function dedupe(a){const seen=new Set();return a.sort((x,y)=>y.ts-x.ts).filter(p=>{if(seen.has(p.link))return false;seen.add(p.link);return true})}
export async function GET(){try{const queries=['Juventus','Juve','bianconeri Juventus','Continassa Juventus'];const jobs=[];for(const q of queries){for(const base of NITTER_BASES)jobs.push(fetchNitter(base,q));jobs.push(fetchBing(`(${q})`));}const settled=await Promise.allSettled(jobs);const posts=dedupe(settled.flatMap(r=>r.status==='fulfilled'?r.value:[])).slice(0,180);return NextResponse.json({posts,generatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, s-maxage=60, stale-while-revalidate=180'}})}catch{return NextResponse.json({posts:[],degraded:true},{headers:{'Cache-Control':'no-store'}})}}
