export const dynamic='force-dynamic';
export async function GET(){
 return Response.json({ok:true,source:'social-radar-v6'},{headers:{'Cache-Control':'no-store'}});
}
