import {NextResponse} from 'next/server';
export function middleware(request){
 const {pathname,searchParams}=request.nextUrl;
 if(pathname==='/news' && searchParams.get('tab')==='social'){
   const url=request.nextUrl.clone();
   url.pathname='/social';
   url.search='';
   return NextResponse.redirect(url);
 }
 if(searchParams.get('raw')==='1') return NextResponse.next();
 const match=pathname.match(/^\/ritagli\/([^/]+)\.pdf$/);
 if(match){
   const url=request.nextUrl.clone();
   url.pathname=`/ritaglio/${match[1]}`;
   url.search='';
   return NextResponse.redirect(url);
 }
 return NextResponse.next();
}
export const config={matcher:['/news','/ritagli/:path*']};
