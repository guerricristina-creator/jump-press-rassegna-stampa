export const dynamic='force-dynamic';

export async function GET(){
  const url='https://r.jina.ai/https://twstalker.com/FabrizioRomano';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(url,{cache:'no-store',signal:controller.signal,headers:{'Accept':'text/plain','X-Respond-With':'html','X-Engine':'browser','X-No-Cache':'true'}});
    const body=await r.text();
    return Response.json({ok:r.ok,status:r.status,length:body.length,hasActivity:body.includes('activity-posts'),hasJuventus:/juventus|juve/i.test(body),sample:body.slice(0,600)});
  }catch(e){
    return Response.json({ok:false,error:String(e)});
  }finally{clearTimeout(timer)}
}
