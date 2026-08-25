'use client';

import {useEffect} from 'react';

const SOURCES=[
 {name:'Juventus',url:'https://twitter.com/juventusfc'},
 {name:'Gianluca Di Marzio',url:'https://twitter.com/DiMarzio'},
 {name:'Fabrizio Romano',url:'https://twitter.com/FabrizioRomano'},
 {name:'Nicolò Schira',url:'https://twitter.com/NicoSchira'},
 {name:'Gianluigi Longari',url:'https://twitter.com/Glongari'},
 {name:'Romeo Agresti',url:'https://twitter.com/romeoagresti'},
 {name:'TUTTOmercatoWEB',url:'https://twitter.com/TuttoMercatoWeb'},
 {name:'Cronache di Spogliatoio',url:'https://twitter.com/CronacheTweet'}
];

export default function SocialTimelines(){
 useEffect(()=>{
  const render=()=>window.twttr?.widgets?.load?.();
  const existing=document.querySelector('script[data-jump-x-widget]');
  if(existing){render();return;}
  const script=document.createElement('script');
  script.src='https://platform.twitter.com/widgets.js';
  script.async=true;
  script.charset='utf-8';
  script.dataset.jumpXWidget='1';
  script.onload=render;
  document.body.appendChild(script);
 },[]);

 return <>
  <section className="socialintro">
   <b>Ultimi post dalle fonti Juventus</b>
   <span>Qui sotto vedi direttamente le timeline X delle fonti monitorate, non una semplice lista di collegamenti.</span>
  </section>
  <section className="xtimelinegrid">
   {SOURCES.map(source=><article className="xtimelinecard" key={source.name}>
    <div className="xtimelinehead"><b>{source.name}</b><span>LIVE X</span></div>
    <div className="xtimelinebody">
     <a className="twitter-timeline" data-theme="light" data-height="330" data-chrome="noheader nofooter noborders transparent" data-dnt="true" href={source.url}>Post di {source.name}</a>
    </div>
   </article>)}
  </section>
 </>;
}
