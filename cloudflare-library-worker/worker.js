// Novel Forge cloud image library — deploy as a separate Cloudflare Worker.
// Bind an R2 bucket as IMAGES and set LIBRARY_TOKEN as a secret.
const ORIGIN = 'https://jumbie9.github.io';
const cors={ 'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization','Vary':'Origin'};
function reply(x,status=200){return new Response(JSON.stringify(x),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})}
function authorized(req,env){const expected=env.LIBRARY_TOKEN;return !!expected && req.headers.get('Authorization')===`Bearer ${expected}`}
function name(s){return String(s||'Image').replace(/[^\w .()-]/g,'_').slice(0,110)}
export default {async fetch(req,env){
 const url=new URL(req.url),route=url.pathname;
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(route==='/api/health')return reply({ok:true,storage:!!env.IMAGES,authConfigured:!!env.LIBRARY_TOKEN});
 if(!authorized(req,env))return reply({error:'Incorrect library passphrase'},401);
 if(!env.IMAGES)return reply({error:'R2 binding IMAGES is missing'},503);
 try{
  if(route==='/api/library' && req.method==='GET'){
   let cursor=url.searchParams.get('cursor')||undefined;
   const list=await env.IMAGES.list({prefix:'assets/',limit:50,cursor});
   return reply({items:list.objects.map(o=>({id:o.key.slice(7),name:o.customMetadata?.name||o.key.split('/').pop(),created:o.uploaded?.toISOString(),size:o.size,type:o.httpMetadata?.contentType||'image/png'})),cursor:list.truncated?list.cursor:null});
  }
  if(route==='/api/library' && req.method==='POST'){
   const body=await req.json(),data=String(body.data||'');
   const m=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(data);
   if(!m)return reply({error:'Only base64 PNG, JPEG or WebP images are allowed'},400);
   if(m[2].length>10_000_000)return reply({error:'Image exceeds upload limit'},413);
   const raw=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));
   const id=crypto.randomUUID(),type='image/'+m[1],key='assets/'+id;
   await env.IMAGES.put(key,raw,{httpMetadata:{contentType:type},customMetadata:{name:name(body.name),source:name(body.source||'User uploaded')}});
   return reply({id,name:name(body.name)},201);
  }
  const match=/^\/api\/library\/([\w-]+)$/.exec(route);
  if(match){let key='assets/'+match[1];
   if(req.method==='GET'){const obj=await env.IMAGES.get(key);if(!obj)return reply({error:'Image not found'},404);return new Response(obj.body,{headers:{...cors,'Content-Type':obj.httpMetadata?.contentType||'image/png','Cache-Control':'private, max-age=120'}})}
   if(req.method==='DELETE'){await env.IMAGES.delete(key);return reply({deleted:true})}
  }
  return reply({error:'Not found'},404)
 }catch(err){console.error(err);return reply({error:'Storage operation failed'},500)}
 }};
