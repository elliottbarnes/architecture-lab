import { macintoshScene } from './macintosh-scene.js';
import { PARTS, JOURNEYS } from './macintosh-data.js';
import { FRAME_BYTES, getPixel, togglePixel, byteLocation, fillPattern, drawFramebuffer } from './framebuffer.js';
const $ = id => document.getElementById(id);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hex = (n,width=4)=>n.toString(16).toUpperCase().padStart(width,'0');
let selected=PARTS.some(p=>p.id===location.hash.slice(1))?location.hash.slice(1):'cpu';
let mode='explore',isOpen=true,screenOn=true,journey=JOURNEYS[0],step=0,timer=null;
let patchX=240,patchY=160,pixelX=0,pixelY=0;
let openTimer, resizeTimer;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ram=new Uint8Array(128*1024);
const screenBase=0x1A700;
const frame=ram.subarray(screenBase,screenBase+FRAME_BYTES);
fillPattern(frame,'desktop');
$('mac-scene').innerHTML=macintoshScene();
$('part-select').innerHTML=PARTS.map(p=>`<option value="${p.id}">${escapeHTML(p.title)}</option>`).join('');
$('component-rail').innerHTML=PARTS.map((p,i)=>`<button type="button" data-select="${p.id}" aria-pressed="false"><span>${String(i+1).padStart(2,'0')}</span>${escapeHTML(p.title)}</button>`).join('');
function selectPart(id,{updateHash=true}={}) {
  const part=PARTS.find(p=>p.id===id);if(!part)return;selected=id;
  if(!isOpen && !['display','floppy','keyboard','mouse'].includes(id)) setOpen(true);
  document.querySelectorAll('[data-part]').forEach(el=>{el.classList.toggle('selected',el.dataset.part===id);el.setAttribute('aria-pressed',String(el.dataset.part===id));});
  document.querySelectorAll('[data-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.select===id)));
  $('part-select').value=id;$('part-position').textContent=`${String(PARTS.indexOf(part)+1).padStart(2,'0')} / ${PARTS.length}`;
  $('part-detail').innerHTML=`<p class="eyebrow accent part-category">${escapeHTML(part.category)}</p><h2>${escapeHTML(part.title)}</h2><p class="part-subtitle">${escapeHTML(part.subtitle)}</p><p class="part-summary">${escapeHTML(part.summary)}</p><dl class="part-specs">${part.specs.map(s=>`<div><dt>${escapeHTML(s.label)}</dt><dd>${escapeHTML(s.value)}</dd></div>`).join('')}</dl><h3>Its job in the architecture</h3><p class="part-role">${escapeHTML(part.role)}</p><div class="part-fact"><span class="eyebrow">LOOK A LITTLE CLOSER</span><p>${escapeHTML(part.fact)}</p></div><h3 class="connections-title">Connected to</h3><div class="connections">${part.connections.map(id=>`<button type="button" data-connect="${id}">${escapeHTML(PARTS.find(p=>p.id===id)?.title||id)} <span>↗</span></button>`).join('')}</div><a class="source-link" href="${escapeHTML(part.source)}" target="_blank" rel="noopener">Original technical reference ↗</a>`;
  $('part-detail').querySelectorAll('[data-connect]').forEach(button=>button.addEventListener('click',()=>selectPart(button.dataset.connect)));
  if(updateHash)history.replaceState(null,'','#'+id);
}
$('mac-scene').querySelectorAll('[data-part]').forEach(el=>{
  el.addEventListener('click',e=>{e.stopPropagation();selectPart(el.dataset.part);});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();selectPart(el.dataset.part);}});
});
$('component-rail').querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>selectPart(button.dataset.select)));
$('part-select').addEventListener('change',e=>selectPart(e.target.value));
function setOpen(open){isOpen=open;$('mac-scene').classList.toggle('is-open',open);$('case-open').setAttribute('aria-pressed',String(open));$('case-closed').setAttribute('aria-pressed',String(!open));$('mac-scene').querySelector('svg').setAttribute('viewBox','0 0 900 690');clearTimeout(openTimer);openTimer=setTimeout(()=>{if(mode==='signals')renderStory();},reducedMotion?0:850);}
$('case-open').addEventListener('click',()=>setOpen(true));$('case-closed').addEventListener('click',()=>setOpen(false));
$('labels-toggle').addEventListener('click',()=>{const hidden=$('mac-scene').classList.toggle('hide-labels');$('labels-toggle').setAttribute('aria-pressed',String(!hidden));$('labels-toggle').querySelector('span').textContent=hidden?'off':'on';});
$('power-toggle').addEventListener('click',()=>{screenOn=!screenOn;$('power-toggle').setAttribute('aria-pressed',String(screenOn));$('power-toggle').innerHTML=`<span class="status-dot"></span> Screen ${screenOn?'on':'off'}`;drawScreen();});
function drawScreen(){for(const id of ['mac-screen','mac-screen-open']){const canvas=$(id);if(!canvas)continue;if(screenOn)drawFramebuffer(canvas,frame);else{const ctx=canvas.getContext('2d');ctx.fillStyle='#18201d';ctx.fillRect(0,0,canvas.width,canvas.height);}}}
function zoomPart(){
  const svg=$('mac-scene').querySelector('svg');
  const matches=[...svg.querySelectorAll(`[data-part="${selected}"]`)];
  const el=(isOpen?matches:matches.filter(e=>!e.closest('.mac-crt,.mac-drive,.mac-logic,.mac-analog')))[0];
  if(!el)return;
  svg.setAttribute('viewBox','0 0 900 690');
  const r=el.getBoundingClientRect(),inverse=svg.getScreenCTM().inverse();
  const a=new DOMPoint(r.left,r.top).matrixTransform(inverse),b=new DOMPoint(r.right,r.bottom).matrixTransform(inverse);
  const w=Math.max(250,b.x-a.x+100),h=Math.max(192,b.y-a.y+100),fitW=Math.max(w,h*900/690),fitH=fitW*690/900;
  svg.setAttribute('viewBox',`${(a.x+b.x-fitW)/2} ${(a.y+b.y-fitH)/2} ${fitW} ${fitH}`);
  if(mode==='signals')renderStory();
}
$('zoom-part').addEventListener('click',zoomPart);
$('zoom-reset').addEventListener('click',()=>{$('mac-scene').querySelector('svg').setAttribute('viewBox','0 0 900 690');if(mode==='signals')renderStory();});
function stop(){clearInterval(timer);timer=null;}
function setMode(next){stop();mode=next;$('case-closed').disabled=mode==='signals';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('signal-story').hidden=mode!=='signals';$('pixel-lab').hidden=mode!=='pixels';$('mode-note').textContent={explore:'SELECT ANY HIGHLIGHTED PART',signals:'FOLLOW THE WORK, ONE STEP AT A TIME',pixels:'CHANGE A BIT. CHANGE THE PICTURE.'}[mode];$('scene-caption').textContent={explore:'An architectural cutaway. Select a component to look closer.',signals:'Highlighted components take part in the current step. Timing is illustrative.',pixels:'The CRT displays the actual 512 × 342 bitmap edited below.'}[mode];clearActivity();if(mode==='signals'){setOpen(true);renderStory();}if(mode==='pixels'){selectPart('display');renderPatch();}}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
function clearActivity(){document.querySelectorAll('[data-part]').forEach(el=>el.classList.remove('path-active'));$('mac-scene').querySelector('.signal-overlay')?.remove();}
function renderStory(){
  const current=journey.steps[step];
  $('signal-story').innerHTML=`<div class="journey-options" aria-label="Choose a signal story">${JOURNEYS.map(j=>`<button type="button" data-journey="${j.id}" aria-pressed="${j.id===journey.id}">${escapeHTML(j.title)}</button>`).join('')}</div><div class="story-card"><div class="story-number">${String(step+1).padStart(2,'0')}<span>/ ${String(journey.steps.length).padStart(2,'0')}</span></div><div><span class="eyebrow">${escapeHTML(current.signal)}</span><h3>${escapeHTML(current.title)}</h3><p>${escapeHTML(current.detail)}</p></div></div><div class="story-bottom"><div class="story-steps" aria-label="Signal story steps">${journey.steps.map((s,i)=>`<button type="button" data-step="${i}" class="${i===step?'active':''}" aria-label="Step ${i+1}: ${escapeHTML(s.title)}" aria-pressed="${i===step}">${i+1}</button>`).join('')}</div><div class="story-controls"><button class="button" type="button" id="story-prev" ${step===0?'disabled':''}>← Back</button><button class="button primary" type="button" id="story-play">${timer?'Ⅱ Pause':'▶ Play'}</button><button class="button" type="button" id="story-next" ${step===journey.steps.length-1?'disabled':''}>Next →</button></div></div><p class="story-caveat">A conceptual walkthrough, not a bus-cycle trace or boot simulation.</p>`;
  $('signal-story').querySelectorAll('[data-journey]').forEach(b=>b.addEventListener('click',()=>{stop();journey=JOURNEYS.find(j=>j.id===b.dataset.journey);step=0;renderStory();}));
  $('signal-story').querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{stop();step=Number(b.dataset.step);renderStory();}));
  $('story-prev').addEventListener('click',()=>{stop();step--;renderStory();});$('story-next').addEventListener('click',()=>{stop();step++;renderStory();});
  $('story-play').addEventListener('click',()=>{if(timer){stop();renderStory();return;}if(step===journey.steps.length-1)step=0;timer=setInterval(()=>{if(step<journey.steps.length-1)step++;if(step===journey.steps.length-1)stop();renderStory();},2600);renderStory();});
  clearActivity();current.active.forEach(id=>$('mac-scene').querySelectorAll(`[data-part="${id}"]`).forEach(el=>el.classList.add('path-active')));selectPart(current.part,{updateHash:false});
  // Dashes express a logical transfer; they do not claim board trace locations.
  const svg=$('mac-scene').querySelector('svg');
  const overlay=document.createElementNS('http://www.w3.org/2000/svg','g');overlay.setAttribute('class','signal-overlay');overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<defs><marker id="signal-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#dbf2a5"/></marker></defs>';
  const center=id=>{const el=$('mac-scene').querySelector(`[data-part="${id}"]`);if(!el)return null;const b=el.getBoundingClientRect();return new DOMPoint(b.x+b.width/2,b.y+b.height/2).matrixTransform(svg.getScreenCTM().inverse());};
  if(current.links?.length){
    for(const [from,to] of current.links){const a=center(from),b=center(to);if(!a||!b)continue;const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${a.x},${a.y} Q${(a.x+b.x)/2},${Math.min(a.y,b.y)-35} ${b.x},${b.y}`);path.setAttribute('marker-end','url(#signal-arrow)');overlay.append(path);}
    svg.append(overlay);
  }
}
function renderPatch(){
  const canvas=$('pixel-editor'),ctx=canvas.getContext('2d'),size=20;ctx.clearRect(0,0,640,320);
  for(let y=0;y<16;y++)for(let x=0;x<32;x++){ctx.fillStyle=getPixel(frame,patchX+x,patchY+y)?'#252a27':'#e3e4d7';ctx.fillRect(x*size,y*size,size-1,size-1);}
  ctx.strokeStyle='#c07037';ctx.lineWidth=3;ctx.strokeRect(pixelX*size+1.5,pixelY*size+1.5,size-4,size-4);
  const px=patchX+pixelX,py=patchY+pixelY,{offset,bit}=byteLocation(px,py),value=frame[offset];
  $('patch-caption').textContent=`X ${patchX}–${patchX+31} / Y ${patchY}–${patchY+15}`;
  $('pixel-position').textContent=`PIXEL (${px}, ${py})`;$('byte-offset').textContent=`RAM $${hex(screenBase+offset,5)}`;
  $('byte-buttons').innerHTML=Array.from({length:8},(_,i)=>7-i).map(b=>`<button type="button" data-bit="${b}" aria-label="Screen byte bit ${b}" aria-pressed="${Boolean(value&(1<<b))}" class="${b===bit?'selected':''}"><span>b${b}</span><strong>${Number(Boolean(value&(1<<b)))}</strong></button>`).join('');
  $('byte-value').textContent=`${value.toString(2).padStart(8,'0')} = $${hex(value,2)}`;
  $('byte-buttons').querySelectorAll('[data-bit]').forEach(b=>b.addEventListener('click',()=>{frame[offset]^=1<<Number(b.dataset.bit);renderPatch();drawScreen();}));
}
$('pixel-editor').addEventListener('click',e=>{const rect=e.currentTarget.getBoundingClientRect();pixelX=Math.max(0,Math.min(31,Math.floor((e.clientX-rect.left)/rect.width*32)));pixelY=Math.max(0,Math.min(15,Math.floor((e.clientY-rect.top)/rect.height*16)));togglePixel(frame,patchX+pixelX,patchY+pixelY);renderPatch();drawScreen();});
$('pixel-editor').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')pixelX=Math.max(0,pixelX-1);if(e.key==='ArrowRight')pixelX=Math.min(31,pixelX+1);if(e.key==='ArrowUp')pixelY=Math.max(0,pixelY-1);if(e.key==='ArrowDown')pixelY=Math.min(15,pixelY+1);if(e.key===' ')togglePixel(frame,patchX+pixelX,patchY+pixelY);renderPatch();drawScreen();});
$('move-patch').addEventListener('click',()=>{const x=$('patch-x').valueAsNumber,y=$('patch-y').valueAsNumber;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>480||y<0||y>326||x%8!==0){$('patch-error').textContent='Use X from 0 to 480 in steps of 8, and a whole Y from 0 to 326.';return;}patchX=x;patchY=y;$('patch-error').textContent='';renderPatch();});
$('screen-pattern').addEventListener('change',e=>{fillPattern(frame,e.target.value);renderPatch();drawScreen();});
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(PARTS.some(p=>p.id===id))selectPart(id,{updateHash:false});});
window.addEventListener('pagehide',stop);
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(mode==='signals')renderStory();},150);});
selectPart(selected,{updateHash:false});drawScreen();renderPatch();
