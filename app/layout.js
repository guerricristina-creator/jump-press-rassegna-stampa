import './globals.css';
import PdfLinkHandler from './PdfLinkHandler';
import AppControls from './components/AppControls';
export const metadata={title:'JUMP PRESS Juventus',description:'Rassegna stampa Juventus — ultima edizione e archivio',manifest:'/manifest.webmanifest',applicationName:'JUMP PRESS Juventus',appleWebApp:{capable:true,title:'JUMP PRESS',statusBarStyle:'black'},formatDetection:{telephone:false},themeColor:'#0b0d0f'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0b0d0f'};
export default function RootLayout({children}){return <html lang="it"><body><PdfLinkHandler/><AppControls/>{children}</body></html>}