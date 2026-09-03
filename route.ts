import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://www.addisonautomatics.com/wp-content/uploads/manuals/';
const FALLBACK = ['BEA','Besam','Detex','DOM','Dorma','Gildor','Horton','Hunter-Entrematic','KM','LCN','Motion Access','Nabco_GyroTech','Norton','Optex','Record','Stanley','TJ084','Tormax','Tucker'];

function parseListing(html:string, base:string){
  const out:{name:string;url:string;type:'folder'|'pdf'}[]=[];
  const re=/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(html))){
    const href=m[1];
    const text=m[2].replace(/<[^>]+>/g,'').trim();
    if(!href || href.startsWith('../') || href.startsWith('?') || href==='#') continue;
    const url=new URL(href,base).toString();
    const name=text || decodeURIComponent(href.split('/').filter(Boolean).pop()||href);
    if(url.toLowerCase().endsWith('.pdf')) out.push({name,url,type:'pdf'});
    else if(href.endsWith('/')) out.push({name:name.replace(/\/$/,''),url,type:'folder'});
  }
  return out;
}

export async function GET(req:NextRequest){
  const path=req.nextUrl.searchParams.get('path')||'';
  const clean=path.replace(/^\/+|\.+/g,'');
  const url=clean ? new URL(clean.endsWith('/')?clean+'':clean,BASE).toString() : BASE;
  try{
    const r=await fetch(url,{next:{revalidate:3600},headers:{'User-Agent':'ROWE-Tech-Support-Reference/1.0'}});
    if(!r.ok) throw new Error('Source unavailable');
    const html=await r.text();
    return NextResponse.json({source:url,items:parseListing(html,url)});
  }catch(e){
    if(!clean) return NextResponse.json({source:BASE,items:FALLBACK.map(name=>({name,url:BASE+encodeURIComponent(name)+'/',type:'folder'})),offline:true});
    return NextResponse.json({source:url,items:[],offline:true},{status:200});
  }
}
