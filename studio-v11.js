/* Novel Forge Studio v11: persistent image library; no remote scraping or implied image rights. */
(function(){
'use strict';
const DB='novel-forge-image-library', STORE='images';
let dbPromise, filter='', items=[], active=null, busy=false;
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
async function tx(mode, action){const conn=await db();return new Promise((resolve,reject)=>{const t=conn.transaction(STORE,mode),s=t.objectStore(STORE),r=action(s);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
const getAll=()=>tx('readonly',s=>s.getAll());
const put=obj=>tx('readwrite',s=>s.put(obj));
const del=id=>tx('readwrite',s=>s.delete(id));
function id(){return 'pic_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
const IMAGE_LIMIT=12*1024*1024;
function fileAsData(f){return new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(reader.error);reader.readAsDataURL(f)});}
function smallInfo(){return `<p class="hint">Your library saves actual images in this browser using IndexedDB. It is not a million downloaded photographs and does not automatically sync between devices. Export your project or save images separately for backups.</p>`}
async function addImage({data,name,source='Imported',license='',page='',prompt=''}){
 if(!/^data:image\/(png|jpeg|webp);base64,/i.test(data||''))throw Error('Only PNG, JPEG, and WebP images are supported');
 if(data.length > IMAGE_LIMIT*1.37)throw Error('Image is too large (12 MB maximum)');
 const pic={id:id(),data,name:name||'Character image',source,license,page,prompt,created:Date.now()};await put(pic);await load();return pic;
}
async function load(){try{items=(await getAll()).sort((a,b)=>b.created-a.created);if(tab==='imageLibrary')render()}catch(e){console.error(e);}}
function renderLibrary(){const filtered=items.filter(i=>(i.name+' '+i.source+' '+i.prompt).toLowerCase().includes(filter.toLowerCase()));const count=items.length;return `<div class="bar"><div><h2>▧ Connected image library</h2><p class="muted">Generated, imported, and saved character artwork in one reusable gallery.</p></div><span class="pill">${count} stored image${count===1?'':'s'}</span></div>
<section class="card"><div class="rowbtns"><button class="primary" onclick="nf11UploadClick()">⬆ Import images</button><button onclick="view('generator')">✦ Generate</button><button onclick="nf11GetImages()">⌕ Get Images</button></div><input id="nf11files" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="nf11Files(event)"><label>Search saved images<input id="nf11search" placeholder="Name, prompt, source..." value="${h(filter)}" oninput="nf11Filter(this.value)"></label>${smallInfo()}</section>
<section class="card"><h2>My saved images</h2>${filtered.length?`<div class="nf11grid">${filtered.map(i=>`<button class="nf11tile ${active===i.id?'chosen':''}" onclick="nf11Select('${i.id}')"><img alt="${h(i.name)}" loading="lazy" src="${i.data}"><b>${h(i.name)}</b><small>${h(i.source)}</small></button>`).join('')}</div>`:'<p class="hint">No matching saved images yet. Import a picture, or generate one and select “Save to library.”</p>'}</section>
<section class="card"><h2>Included artwork</h2><div class="nf11grid"><div class="nf11tile"><img src="sample-maya.png" alt="Maya, photorealistic adult character"><b>Maya — sample</b><small>Bundled with the editor</small><button onclick="nf11ImportSample()">Add to my library</button></div></div></section>`;}
function inspector(){const i=items.find(i=>i.id===active);if(!i)return `<h2>Image library</h2><p class="hint">Select an image to preview it and add it to your Ren’Py project.</p><p>${items.length} stored image(s)</p>`;return `<h2>Image details</h2><img class="nf11ins" src="${i.data}" alt="${h(i.name)}"><label>Name<input id="nf11name" value="${h(i.name)}"></label><p class="tiny muted">${h(i.source)} ${i.license?' · '+h(i.license):''}</p>${i.page?`<p><a target="_blank" rel="noopener noreferrer" href="${h(i.page)}">Source and license ↗</a></p>`:''}<div class="nf11action"><button onclick="nf11Rename()">Rename</button><button class="primary" onclick="nf11Use()">Add to Ren'Py game</button><button onclick="nf11Download()">Download</button><button onclick="nf11Remove()">Remove</button></div>`;}
function selected(){return items.find(i=>i.id===active)}
window.nf11Filter=s=>{filter=s;const c=document.getElementById('content');if(c){const focus=document.activeElement;const start=focus?.selectionStart;const end=focus?.selectionEnd;c.innerHTML=renderLibrary();const inp=document.getElementById('nf11search');inp?.focus();if(typeof start==='number')inp.setSelectionRange(start,end)}};
window.nf11Select=key=>{active=key;render()};
window.nf11UploadClick=()=>document.getElementById('nf11files')?.click();
window.nf11Files=async e=>{try{for(const f of Array.from(e.target.files||[])){if(!['image/png','image/jpeg','image/webp'].includes(f.type))continue;const data=await fileAsData(f);await addImage({data,name:f.name})}render()}catch(err){alert(err.message)}};
window.nf11ImportSample=async()=>{try{const blob=await (await fetch('sample-maya.png')).blob();const data=await fileAsData(blob);const pic=await addImage({data,name:'Maya — realistic sample',source:'Bundled sample'});active=pic.id;render()}catch(e){alert('Could not import sample: '+e.message)}};
window.nf11Rename=async()=>{const i=selected();if(!i)return;i.name=document.getElementById('nf11name')?.value.trim()||i.name;await put(i);await load();render()};
window.nf11Use=()=>{const i=selected();if(!i)return;state.assets.push({id:'image_'+uid(),name:i.name.replace(/[^\w. -]/g,'_').replace(/\.(png|jpg|jpeg|webp)$/i,'')+(i.data.startsWith('data:image/jpeg')?'.jpg':i.data.startsWith('data:image/webp')?'.webp':'.png'),kind:'image',data:i.data});try{store()}catch{}alert('Added to project assets. It will be included in Ren’Py export.');render()};
window.nf11Download=()=>{const i=selected();if(!i)return;const a=document.createElement('a');a.href=i.data;a.download=i.name.replace(/[^\w. -]/g,'_')+'.png';a.click()};
window.nf11Remove=async()=>{if(!active||!confirm('Remove this image from this browser’s library?'))return;await del(active);active=null;await load();render()};
window.nf11GetImages=()=>{view('generator');setTimeout(()=>{const button=document.querySelector('#content button[onclick="nf10GetImages()"]');button?.focus()},0)};
window.nf11SaveGenerated=async()=>{try{if(window.nf11LatestImage?.data){const result=window.nf11LatestImage;const pic=await addImage({data:result.data,name:result.name,source:'AI generated',prompt:result.prompt||''});active=pic.id;view('imageLibrary');return}alert('Generate a picture first.')}catch(e){alert(e.message)}};
// Patch the render function once, keeping the established three-column layout and image generator intact.
const previousRender=render;
render=function(){if(tab==='imageLibrary'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===tab));$('content').innerHTML=renderLibrary();$('inspector').innerHTML=inspector();return}previousRender();if(tab==='generator'){const tools=document.querySelector('#content .nf10left .rowbtns');if(tools&&!document.getElementById('nf11SaveBtn'))tools.insertAdjacentHTML('afterend','<button id="nf11SaveBtn" onclick="nf11SaveGenerated()">▧ Save generated image to library</button>')}};
const nav=document.querySelector('#nav');nav?.insertAdjacentHTML('afterbegin',`<button data-view="imageLibrary" onclick="view('imageLibrary')">▧ Image Library</button>`);
const style=document.createElement('style');style.textContent=`.nf11grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}.nf11tile{background:#1b2541;border:1px solid #394361;border-radius:12px;padding:10px;text-align:left;display:flex;flex-direction:column;gap:6px}.nf11tile.chosen{border-color:#ac90ff}.nf11tile img{width:100%;height:180px;object-fit:contain;background:#111725;border-radius:8px}.nf11tile b,.nf11tile small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nf11tile small{color:#b9c3da}.nf11ins{max-width:100%;max-height:300px;object-fit:contain;border-radius:10px}.nf11action{display:grid;gap:8px}.nf11action button{width:100%}`;document.head.appendChild(style);
load();
})();
