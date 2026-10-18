// Dedos Mágicos — funciona offline. Versão 2.
const CACHE='dedos-magicos-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function store(req,res){
  if(res&&res.ok&&res.type!=='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));}
  return res;
}
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  const isFont=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(!isFont&&url.origin!==location.origin)return;
  // Abrir o app (inclusive pelo atalho): entrega a página guardada na hora e atualiza em segundo plano.
  if(req.mode==='navigate'){
    e.respondWith(caches.match('./index.html').then(hit=>{
      const net=fetch(req).then(r=>store('./index.html',r)).catch(()=>null);
      if(hit){e.waitUntil(net);return hit;}
      return net.then(r=>r||caches.match('./')||new Response('Sem conexão. Abra o Dedos Mágicos com internet uma vez.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}}));
    }));
    return;
  }
  // Demais arquivos (ícones, manifesto, fontes): cache primeiro, rede se não houver.
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>store(req,r)).catch(()=>new Response('',{status:504}))));
});
