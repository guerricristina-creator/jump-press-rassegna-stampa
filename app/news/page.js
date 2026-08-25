import NewsRefresh from './NewsRefresh';

export const dynamic='force-dynamic';

const FEED='https://news.google.com/rss/search?q=Juventus&hl=it&gl=IT&ceid=IT:it';

const SOCIAL_SOURCES=[
 {name:'Juventus',handle:'juventusfc',official:true},
 {name:'Gianluca Di Marzio',handle:'DiMarzio'},
 {name:'Fabrizio Romano',handle:'FabrizioRomano'},
 {name:'Nicolò Schira',handle:'NicoSchira'},
 {name:'Gianluigi Longari',handle:'Glongari'},
 {name:'Romeo Agresti',handle:'romeoagresti'},
 {name:'TUTTOmercatoWEB',handle:'TuttoMercatoWeb'},
 {name:'Cronache di Spogliatoio',handle:'CronacheTweet'}
];

const INSTAGRAM_SOURCES=[
 {name:'Calcio e Finanza',handles:['calcioefinanza']},
 {name:'Paolo Ardoino',handles:['paoloardoino','paoloardoino_prdn'],ardoino:true}
];

const RSSHUB_INSTANCES=[
 'https://rsshub.stsecurity.moe',
 'https://rsshub.mt.cd',
 'https://rsshub.yfi.moe'
];

function decodeXml(s=''){
 return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function text(block,tag){
 const m=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));
 return m?decodeXml(m[1].trim()):'';
}
function cleanHtml(value=''){
 return decodeXml(value)
  .replace(/<br\s*\/?\s*>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/https?:\/\/t\.co\/\S+/gi,'')
  .replace(/\s+/g,' ')
  .trim();
}
function relevantToJuve(body='',source={}){
 const base=/\b(juventus|juve|bianconer\w*|spalletti|yildiz|kolo\s*muani|sorloth|zirkzee|mateta|kessie|miretti|bremer|thuram|koopmeiners|cambiaso|vicario|perin|di\s*gregorio|chiellini|comolli)\b/i;
 if(base.test(body)) return true;
 if(source.ardoino&&/\b(zebra|zebre|jay)\b/i.test(body)) return true;
 return false;
}
function parseFeed(xml){
 const seen=new Set();
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  .map(m=>{
   const b=m[1];
   const date=text(b,'pubDate');
   return {title:text(b,'title'),link:text(b,'link'),date,source:text(b,'source'),ts:Date.parse(date)||0};
  })
  .filter(x=>x.title&&x.link)
  .sort((a,b)=>b.ts-a.ts)
  .filter(x=>{
   const key=x.title.toLowerCase().replace(/\s+/g,' ').trim();
   if(seen.has(key)) return false;
   seen.add(key);
   return true;
  })
  .slice(0,60);
}
function parseSocialFeed(xml,source){
 const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
 return items.map(m=>{
  const b=m[1];
  const date=text(b,'pubDate')||text(b,'dc:date');
  const title=cleanHtml(text(b,'title'));
  const desc=cleanHtml(text(b,'description'));
  const encoded=cleanHtml(text(b,'content:encoded'));
  let body=[encoded,desc,title].sort((a,b)=>b.length-a.length)[0]||'';
  body=body.replace(/^RT by @?[^:]+:\s*/i,'').replace(/^RT @?[^:]+:\s*/i,'').trim();
  const rawLink=text(b,'link')||text(b,'guid');
  const status=rawLink.match(/\/status\/(\d+)/)?.[1];
  const link=status?`https://x.com/${source.handle}/status/${status}`:`https://x.com/${source.handle}`;
  return {source:source.name,platform:'X',handle:source.handle,body,date,ts:Date.parse(date)||0,link};
 }).filter(p=>p.body&&(source.official||relevantToJuve(p.body,source))).slice(0,15);
}
function parseInstagramRss(xml,source,handle){
 const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
 return items.map(m=>{
  const b=m[1];
  const date=text(b,'pubDate')||text(b,'dc:date');
  const title=cleanHtml(text(b,'title'));
  const desc=cleanHtml(text(b,'description'));
  const encoded=cleanHtml(text(b,'content:encoded'));
  const body=[encoded,desc,title].sort((a,b)=>b.length-a.length)[0]||'';
  const rawLink=text(b,'link')||text(b,'guid')||`https://www.instagram.com/${handle}/`;
  return {source:source.name,platform:'Instagram',handle,body,date,ts:Date.parse(date)||0,link:rawLink};
 }).filter(p=>p.body&&relevantToJuve(p.body,source)).slice(0,12);
}
function formatDate(value){
 try{return new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return ''}
}
async function fetchText(url,timeout=5000,headers={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const r=await fetch(url,{cache:'no-store',signal:controller.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (compatible; JUMP-PRESS/1.0)','Accept':'application/rss+xml, application/xml, text/xml;q=0.9, text/html;q=0.7, */*;q=0.5',...headers}});
  if(!r.ok) throw new Error(`http ${r.status}`);
  return await r.text();
 }finally{clearTimeout(timer)}
}
async function firstUseful(tasks){
 try{return await Promise.any(tasks.map(async fn=>{
  const posts=await fn();
  if(!posts?.length) throw new Error('empty');
  return posts;
 }));}catch{return []}
}
async function getSocialForSource(source){
 const candidates=[
  ()=>fetchText(`https://rss.xcancel.com/${source.handle}/rss`,5200).then(xml=>parseSocialFeed(xml,source)),
  ()=>fetchText(`https://nitter.poast.org/${source.handle}/rss`,5200).then(xml=>parseSocialFeed(xml,source)),
  ()=>fetchText(`https://twiiit.com/${source.handle}/rss`,5200).then(xml=>parseSocialFeed(xml,source)),
  ...RSSHUB_INSTANCES.map(base=>()=>fetchText(`${base}/twitter/user/${source.handle}/exclude_replies`,5200).then(xml=>parseSocialFeed(xml,source)))
 ];
 return firstUseful(candidates);
}
async function getInstagramJson(source,handle){
 const urls=[
  `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
  `https://www.instagram.com/${encodeURIComponent(handle)}/?__a=1&__d=dis`
 ];
 for(const url of urls){
  try{
   const raw=await fetchText(url,5200,{'Accept':'application/json,text/plain,*/*','X-IG-App-ID':'936619743392459'});
   const data=JSON.parse(raw);
   const user=data?.data?.user||data?.graphql?.user||data?.user;
   const edges=user?.edge_owner_to_timeline_media?.edges||[];
   const posts=edges.map(({node})=>{
    const body=node?.edge_media_to_caption?.edges?.[0]?.node?.text?.trim()||'';
    const ts=(Number(node?.taken_at_timestamp)||0)*1000;
    const shortcode=node?.shortcode||'';
    return {source:source.name,platform:'Instagram',handle,body,date:ts?new Date(ts).toISOString():'',ts,link:shortcode?`https://www.instagram.com/p/${shortcode}/`:`https://www.instagram.com/${handle}/`};
   }).filter(p=>p.body&&relevantToJuve(p.body,source)).slice(0,12);
   if(posts.length) return posts;
  }catch{}
 }
 return [];
}
async function getInstagramForSource(source){
 const tasks=[];
 for(const handle of source.handles){
  tasks.push(()=>getInstagramJson(source,handle));
  for(const base of RSSHUB_INSTANCES){
   tasks.push(()=>fetchText(`${base}/instagram/user/${handle}`,5600).then(xml=>parseInstagramRss(xml,source,handle)));
  }
 }
 return firstUseful(tasks);
}
async function getSocialNews(){
 const groups=await Promise.all([
  ...SOCIAL_SOURCES.map(getSocialForSource),
  ...INSTAGRAM_SOURCES.map(getInstagramForSource)
 ]);
 const seen=new Set();
 return groups.flat()
  .sort((a,b)=>b.ts-a.ts)
  .filter(p=>{
   const clean=p.body.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
   const key=`${p.platform}-${clean}`;
   if(!clean||seen.has(key)) return false;
   seen.add(key);
   return true;
  })
  .slice(0,60);
}
async function getNews(){
 try{
  const r=await fetch(FEED,{cache:'no-store',headers:{'User-Agent':'Mozilla/5.0'}});
  if(!r.ok) throw new Error('feed');
  return parseFeed(await r.text());
 }catch{return []}
}

export default async function NewsPage({searchParams}){
 const params=await searchParams;
 const tab=params?.tab==='social'?'social':'web';
 const news=tab==='web'?await getNews():[];
 const social=tab==='social'?await getSocialNews():[];
 return <main className="newspage">
  <NewsRefresh/>
  <header className="newsheader">
   <div className="top"><div className="brand"><i>JUMP</i> PRESS</div><div className="edition">JUVENTUS · NEWS LIVE</div></div>
   <small>NEWS</small>
   <h1>Juventus <em>news</em></h1>
   <p className="lead">Radar dedicato esclusivamente a <b>Juventus</b>, con fonti web e social selezionate.</p>
   <div className="newstabs">
    <a className={tab==='web'?'active':''} href="/news">WEB</a>
    <a className={tab==='social'?'active':''} href="/news?tab=social">SOCIAL</a>
   </div>
   <div className="newsstatus"><span className="liveDot"/> Aggiornamento automatico · 20 min</div>
  </header>

  {tab==='web'?<section className="newslist">
   {news.length?news.map((n,i)=><a className="newscard" href={n.link} target="_blank" rel="noreferrer" key={`${n.link}-${i}`}>
    <div className="newsmeta"><b>{n.source||'Notizia'}</b><span>{formatDate(n.date)}</span></div>
    <h2>{n.title}</h2>
    <span className="newsopen">Apri notizia ↗</span>
   </a>):<div className="newsempty"><b>Nessuna notizia disponibile in questo momento.</b><span>Il feed verrà riprovato automaticamente.</span></div>}
  </section>:<>
   <section className="socialintro">
    <b>Social Juventus · ultimi aggiornamenti</b>
    <span>X e Instagram: fonti multiple, solo contenuti Juventus/Juve, ordinati dal più recente.</span>
   </section>
   <section className="socialfeed">
    {social.length?social.map((p,i)=><a className="socialpost" href={p.link} target="_blank" rel="noreferrer" key={`${p.platform}-${p.link}-${i}`}>
     <div className="newsmeta"><b>{p.platform} · {p.source}</b><span>{formatDate(p.date)}</span></div>
     <p className="socialtext">{p.body}</p>
     <span className="newsopen">Apri su {p.platform} ↗</span>
    </a>):<div className="newsempty"><b>Nessun post Juventus recuperato in questo momento.</b><span>Premi Aggiorna: il radar riprova tutte le fonti live.</span></div>}
   </section>
  </>}

  <footer><b>JUMP PRESS</b> · News Juventus · <span>refresh automatico ogni 20 minuti</span></footer>
 </main>;
}
