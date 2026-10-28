/* Novel Forge Studio v10 — GitHub Pages prompt-first image workflow.
   Adds two explicit actions: Get Images (library + legal references) and Generate.
   Uses a hard-coded backend endpoint constant that the owner can point at their image server. */
(function(){
const NF10_TOTAL = 1000000;
const NF10_DEFAULT_API ='https://novel-forge-images.rohanseeram.workers.dev/api/generate-image';
window.NOVEL_FORGE_IMAGE_API = window.NOVEL_FORGE_IMAGE_API || NF10_DEFAULT_API;
let nf10Prompt = 'Adult woman, warm smile, brunette hair, casual cardigan, cozy bedroom, photorealistic portrait';
let nf10Outfit = 'Casual';
let nf10Expression = 'Smile';
let nf10Seed = 0;
let nf10Page = 0;
let nf10Busy = false;
let nf10Result = null;
let nf10Matches = [];
let nf10Refs = [];

const nf10Looks = ['Casual','Swimwear','Underwear'];
const nf10Moods = ['Smile','Serious','Surprised'];
const nf10Names = ['Maya','Elena','Sofia','Aria','Nora','Chloe','Iris','Jade','Selena','Amara','Vivian','Luna','Celia','Naomi','Zara','Riley'];
const nf10Hair = ['Brunette','Black hair','Blonde hair','Auburn hair','Dark brown hair','Chestnut hair'];
const nf10Scenes = ['cozy bedroom','sunlit café','city rooftop at sunset','modern apartment','university campus','soft studio background'];

function nf10Hash(s){let h=2166136261; for(const ch of String(s)){h^=ch.charCodeAt(0); h=Math.imul(h,16777619)} return (h>>>0);}
function nf10Esc(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function nf10Record(n){n=Math.max(0,Math.min(NF10_TOTAL-1,Number(n)||0)); return {seed:n,name:nf10Names[n%nf10Names.length],outfit:nf10Looks[Math.floor(n/17)%nf10Looks.length],expression:nf10Moods[Math.floor(n/47)%nf10Moods.length],hair:nf10Hair[Math.floor(n/13)%nf10Hair.length],scene:nf10Scenes[Math.floor(n/29)%nf10Scenes.length],age:21+(n%9),variant:1+Math.floor(n/144)};}
function nf10PromptFromRecord(r){return `${r.name}, adult woman age ${r.age}, ${r.hair.toLowerCase()}, ${r.outfit.toLowerCase()}, ${r.expression.toLowerCase()} expression, ${r.scene}, photorealistic portrait, natural skin texture, realistic lighting`;}
function nf10GuessSeeds(prompt){
  const base = nf10Hash(prompt);
  const out=[];
  for(let i=0;i<12;i++) out.push((base + i*7919) % NF10_TOTAL);
  return out;
}
function nf10Read(){
  nf10Prompt = document.getElementById('nf10prompt')?.value?.trim() || nf10Prompt;
  nf10Outfit = document.getElementById('nf10look')?.value || nf10Outfit;
  nf10Expression = document.getElementById('nf10mood')?.value || nf10Expression;
}
function nf10GetImages(){
  nf10Read();
  const seeds = nf10GuessSeeds(nf10Prompt);
  nf10Matches = seeds.map(nf10Record).map(r=>({...r,outfit:nf10Outfit||r.outfit,expression:nf10Expression||r.expression}));
  nf10Seed = nf10Matches[0]?.seed || 0;
  nf10Page = Math.floor(nf10Seed/12);
  nf10Result = null;
  render();
  nf10FetchRefs();
}
function nf10Pick(seed){nf10Seed=seed; nf10Result=null; const r=nf10Record(seed); nf10Prompt=nf10PromptFromRecord({...r,outfit:nf10Outfit||r.outfit,expression:nf10Expression||r.expression}); render();}
function nf10Go(value){nf10Seed=Math.max(0,Math.min(NF10_TOTAL-1,(Number(value)||1)-1)); nf10Page=Math.floor(nf10Seed/12); nf10Matches=Array.from({length:12},(_,i)=>nf10Record(nf10Page*12+i)); nf10Result=null; render();}
function nf10Turn(d){nf10Page=Math.max(0,Math.min(Math.ceil(NF10_TOTAL/12)-1,nf10Page+d)); nf10Matches=Array.from({length:12},(_,i)=>nf10Record(nf10Page*12+i)); nf10Seed=nf10Matches[0].seed; nf10Result=null; render();}
function nf10ApiUrl(){ return window.NOVEL_FORGE_IMAGE_API || NF10_DEFAULT_API; }
async function nf10Generate(){
  nf10Read();
  const api=nf10ApiUrl();
  if(!api || api.includes('YOUR-IMAGE-BACKEND.example')){ alert('The Generate button is wired to a hard-coded backend URL, but it is still the placeholder value. Edit studio-v10.js and replace NOVEL_FORGE_IMAGE_API with your real image API endpoint.'); return; }
  if(nf10Busy) return;
  nf10Busy=true;
  try{
    const body={
      prompt:`Photorealistic original adult person age 21 or older. ${nf10Prompt}. Outfit: ${nf10Outfit}. Expression: ${nf10Expression}. Natural skin texture, realistic hands and anatomy, physically plausible lighting, detailed eyes, realistic hair, photographic depth of field, not cartoon, not CGI, not illustration.`,
      outfit:nf10Outfit,
      expression:nf10Expression,
      character_id:nf10Record(nf10Seed).name,
      seed:nf10Seed,
      style:'photorealistic portrait photography'
    };
    const rsp=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!rsp.ok) throw new Error('Server returned '+rsp.status);
    const obj=await rsp.json();
    const data=obj.data_url || (obj.image_base64 ? `data:${obj.mime_type||'image/png'};base64,${obj.image_base64}` : '');
    if(!/^data:image\/(png|jpeg|webp);base64,/.test(data)) throw new Error('Backend response did not include a supported image.');
    nf10Result={name:`ai_${Date.now()}.png`,data,kind:'image',prompt:nf10Prompt};
    window.nf11LatestImage=nf10Result;
    render();
  }catch(err){ alert('Generate failed: '+err.message); }
  finally{ nf10Busy=false; }
}
function nf10Save(){
  if(!nf10Result) return alert('Generate an image first, then you can add it to your project.');
  state.assets.push({id:'image_'+uid(),name:nf10Result.name,kind:'image',data:nf10Result.data});
  try{store()}catch(e){}
  alert('Added generated image to your project assets.');
  render();
}
function nf10Download(){
  if(!nf10Result) return alert('Generate an image first.');
  const a=document.createElement('a'); a.href=nf10Result.data; a.download=nf10Result.name; document.body.appendChild(a); a.click(); a.remove();
}
async function nf10FetchRefs(){
  const q=(nf10Prompt||'').trim();
  if(!q) return;
  nf10Refs=[];
  const area=document.getElementById('nf10refs'); if(area) area.innerHTML='<p class="hint">Getting legal image references from Wikimedia Commons…</p>';
  const params = new URLSearchParams({action:'query',generator:'search',gsrsearch:q+' portrait',gsrnamespace:'6',gsrlimit:'6',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'320',format:'json',origin:'*'});
  try{
    const res=await fetch('https://commons.wikimedia.org/w/api.php?'+params.toString());
    if(!res.ok) throw new Error('Search service error');
    const json=await res.json();
    nf10Refs=Object.values(json.query?.pages||{}).map(p=>({title:(p.title||'').replace(/^File:/,''),page:p.imageinfo?.[0]?.descriptionurl||'https://commons.wikimedia.org',thumb:p.imageinfo?.[0]?.thumburl||''}));
    render();
  }catch(err){
    nf10Refs=[{title:'Open Wikimedia Commons search',page:'https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search='+encodeURIComponent(q),thumb:''}];
    render();
  }
}
function nf10CurrentCards(){
  if(nf10Matches.length) return nf10Matches;
  return Array.from({length:12},(_,i)=>nf10Record(nf10Page*12+i));
}
function nf10Render(){
  const cards=nf10CurrentCards();
  const active=nf10Record(nf10Seed);
  return `<div class="bar"><div><h2>✦ Image Generator</h2><p class="muted">Type a free-form description, then use <b>Get Images</b> to load library matches and legal references, or <b>Generate</b> to create a realistic image through your connected backend.</p></div><span class="pill">1,000,000+ virtual image recipes</span></div>
  <div class="nf10grid">
    <section class="card nf10left">
      <h2>Create from description</h2>
      <label>Description<textarea id="nf10prompt" placeholder="Adult woman with shoulder-length brunette hair, white cardigan, blue jeans, smiling, cozy bedroom, realistic portrait">${nf10Esc(nf10Prompt)}</textarea></label>
      <div class="flex"><label>Outfit<select id="nf10look">${nf10Looks.map(x=>`<option ${x===nf10Outfit?'selected':''}>${x}</option>`).join('')}</select></label><label>Expression<select id="nf10mood">${nf10Moods.map(x=>`<option ${x===nf10Expression?'selected':''}>${x}</option>`).join('')}</select></label></div>
      <div class="rowbtns"><button class="primary" onclick="nf10GetImages()">Get Images</button><button class="primary" onclick="nf10Generate()">Generate</button></div>
      <p class="hint">The description box accepts free-form character requests. <b>Get Images</b> loads matching library entries and legal reference search results. <b>Generate</b> sends the prompt to the hard-coded image backend URL.</p>
      <h3>Hard-coded backend</h3>
      <div class="nf10api"><code>${nf10Esc(nf10ApiUrl())}</code></div>
      <p class="hint">To use live generation on GitHub Pages, replace the placeholder backend URL in <code>studio-v10.js</code> with your real HTTPS image API endpoint. GitHub Pages cannot run the model itself.</p>
    </section>
    <section class="card">
      <h2>Preview</h2>
      <div class="nf10preview" id="nf10preview">${nf10Result?`<img src="${nf10Result.data}" alt="Generated image">`:`<img src="sample-maya.png" alt="Sample realistic character"><div class="nf10overlay">Sample realistic character preview</div>`}</div>
      <p class="tiny muted">${nf10Result?'Generated image ready to save.':'No live image yet. Use Generate after connecting your API.'}</p>
      <div class="rowbtns"><button onclick="nf10Download()">Download</button><button onclick="nf10Save()">Add to project</button></div>
    </section>
  </div>
  <section class="card"><div class="bar"><div><h2>Get Images results</h2><span class="muted tiny">Browse generated library matches from a virtual catalog larger than 1,000,000 image recipes.</span></div><div class="rowbtns"><button onclick="nf10Turn(-1)">← Previous</button><button onclick="nf10Turn(1)">Next →</button></div></div>
  <div class="flex"><label>Go to image # (1–1,000,000)<input type="number" min="1" max="1000000" value="${nf10Seed+1}" onchange="nf10Go(this.value)"></label><label>Library page <input disabled value="${nf10Page+1} / ${Math.ceil(NF10_TOTAL/12)}"></label></div>
  <div class="nf10cards">${cards.map(r=>`<button class="nf10card ${r.seed===nf10Seed?'chosen':''}" onclick="nf10Pick(${r.seed})"><div class="nf10photo">${nf10Esc(r.name).slice(0,1)}<span>REALISTIC RECIPE</span></div><strong>${nf10Esc(r.name)} · #${r.seed+1}</strong><small>${nf10Esc(r.outfit)} · ${nf10Esc(r.expression)} · ${nf10Esc(r.hair)}</small></button>`).join('')}</div>
  </section>
  <section class="card"><h2>Legal reference images</h2><p class="muted">Open-license search results from Wikimedia Commons. These are reference sources and links to the original file pages.</p><div id="nf10refs" class="nf10refs">${nf10Refs.length?nf10Refs.map(x=>`<div class="nf10ref">${x.thumb?`<img src="${nf10Esc(x.thumb)}" alt="Reference image" loading="lazy">`:''}<p><b>${nf10Esc(x.title)}</b><br><a href="${nf10Esc(x.page)}" target="_blank" rel="noopener noreferrer">Open original file / license ↗</a></p></div>`).join(''):'<p class="hint">Click <b>Get Images</b> to fill this section with legal reference image results.</p>'}</div></section>`;
}
function nf10Inspector(){
  const r=nf10Record(nf10Seed);
  return `<h2>Image panel</h2><div class="nf10inspector"><div class="nf10mini">${nf10Esc(r.name).slice(0,1)}<span>SEED</span></div><b>${nf10Esc(r.name)}</b><p class="tiny muted">Image #${r.seed+1}<br>${nf10Esc(r.outfit)} · ${nf10Esc(r.expression)}<br>${nf10Esc(r.hair)} · age ${r.age}+</p><button class="primary" onclick="nf10Generate()">Generate</button><button onclick="nf10GetImages()">Get Images</button><h3>Project</h3><p class="muted">${state.assets.filter(x=>x.kind==='image').length} saved image assets</p><button onclick="view('assets')">Open images & audio</button></div>`;
}
window.nf10GetImages=nf10GetImages; window.nf10Generate=nf10Generate; window.nf10Pick=nf10Pick; window.nf10Go=nf10Go; window.nf10Turn=nf10Turn; window.nf10Save=nf10Save; window.nf10Download=nf10Download;
const nf10RenderPrev=render;
render=function(){ if(tab==='generator'){ document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===tab)); $('content').innerHTML=nf10Render(); $('inspector').innerHTML=nf10Inspector(); return; } nf10RenderPrev(); };
const genBtn=[...document.querySelectorAll('#nav button')].find(b=>b.dataset.view==='generator'); if(genBtn) genBtn.textContent='✦ Image Generator';
const topBtns=document.querySelector('.top-actions'); if(topBtns && !document.getElementById('nf10TopGet')) topBtns.insertAdjacentHTML('afterbegin','<button id="nf10TopGet" onclick="view(\'generator\'); nf10GetImages();">Get Images</button>');
document.querySelector('.brand .pill').textContent='Studio v10';
const st=document.createElement('style'); st.textContent=`.nf10grid{display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,.95fr);gap:15px}.nf10preview{position:relative;min-height:420px;display:grid;place-items:center;background:linear-gradient(135deg,#252c47,#12172a);border-radius:14px;overflow:hidden}.nf10preview img{max-width:100%;max-height:520px;object-fit:contain}.nf10overlay{position:absolute;left:10px;bottom:10px;background:#060b17cc;padding:8px 10px;border-radius:10px;font-size:12px;color:#cdd7f6}.nf10api{padding:10px 12px;border-radius:10px;background:#12182b;border:1px solid #3a4766;overflow:auto}.nf10cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}.nf10card{text-align:left;padding:7px;min-width:0;background:#191f35}.nf10card.chosen{outline:2px solid #9a78ff}.nf10card strong,.nf10card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nf10card small{color:#a5b2d1}.nf10photo,.nf10mini{aspect-ratio:4/5;border-radius:12px;background:radial-gradient(circle at 50% 26%,#4a476d,#1a2036 72%);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:40px;color:#dfd8ff;font-weight:700;gap:8px}.nf10photo span,.nf10mini span{font-size:10px;letter-spacing:.15em;color:#9fa9c9}.nf10refs{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:8px}.nf10ref{padding:9px;background:#222b43;border-radius:10px;overflow:hidden}.nf10ref img{width:100%;max-height:160px;object-fit:contain}.nf10ref a{color:#b9a3ff}.nf10inspector{display:flex;flex-direction:column;gap:10px}.nf10inspector button{width:100%}@media(max-width:900px){.nf10grid{grid-template-columns:1fr}.nf10preview{min-height:280px}}`; document.head.appendChild(st);
render();
})();
