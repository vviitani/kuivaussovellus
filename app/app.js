// Näkymät
const $=s=>document.querySelector(s), V=$('#view');
const fmt=n=>(Math.round(n)||0).toLocaleString('fi-FI');
const fk=n=>String(n).replace('.',',');
const aika=iso=>{const d=new Date(iso);return d.toLocaleDateString('fi-FI',{day:'numeric',month:'numeric'})+' '+d.toLocaleTimeString('fi-FI',{hour:'2-digit',minute:'2-digit'})};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let toastT;
function toast(msg){$('#toastMsg').textContent=msg;$('#toast').hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>$('#toast').hidden=true,6000);trySync()}
$('#undoBtn').onclick=()=>{const l=S.kumoa();$('#toast').hidden=true;alert(l?'Kumottu: '+l:'Ei kumottavaa');route()};
function err(e){alert('⚠ '+(e.message||e))}
function go(h){location.hash=h}
$('#back').onclick=()=>go('#koti');
function head(t,showBack){$('#title').textContent=t;$('#back').style.visibility=showBack?'visible':'hidden'}
function net(){const n=$('#net');const q=S.db().jono.length;n.className=navigator.onLine?'on':'off';n.textContent=(navigator.onLine?'Online':'Offline')+(S.asetus('syncUrl')&&q?' · '+q+' jonossa':'')}
addEventListener('online',()=>{net();trySync()});addEventListener('offline',net);
async function trySync(){net();try{await S.sync()}catch(e){console.warn(e)}net()}

// Numpad
function numpad(el,init,onCh){let v=init?String(init):'';const d=el.querySelector('.disp');
 const draw=()=>{d.textContent=(v?Number(v).toLocaleString('fi-FI'):'0')+' kg';onCh(Number(v)||0)};
 el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==='C')v='';else if(k==='⌫')v=v.slice(0,-1);else if(v.length<6)v=(v+k).replace(/^0+/,'');draw()});draw();
 return {set(x){v=x?String(x):'';draw()}}}
const NP='<div class="disp">0 kg</div><div class="grid3">'+['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k=>`<button class="btn" data-k="${k}">${k}</button>`).join('')+'</div>';
function stepper(el,val,step,fmtf,onCh){const v=el.querySelector('.v');const draw=()=>{v.textContent=fmtf(val);onCh(val)};
 el.querySelector('.m').onclick=()=>{val=Math.round((val-step)*10)/10;draw()};el.querySelector('.p').onclick=()=>{val=Math.round((val+step)*10)/10;draw()};draw()}
const STEP='<div class="step"><button class="btn m">−</button><div class="v"></div><button class="btn p">+</button></div>';
function toggle(el,val,onCh){const bs=el.querySelectorAll('button');const draw=()=>{bs.forEach(b=>b.classList.toggle('sel',b.dataset.v===val));onCh(val)};bs.forEach(b=>b.onclick=()=>{val=b.dataset.v;draw()});draw()}
const TOG='<div class="tog"><button class="btn" data-v="arvio">Arvio</button><button class="btn" data-v="mitattu">Mitattu</button></div>';

// Siilot fyysisen sijainnin mukaan (layout: tools/layout.json)
function siiloGrid(cell){const L=KDATA.layout;let h='<div class="sgrid">';
 L.rivit.forEach((rv,ri)=>{for(let c=0;c<L.sarakkeet;c++){const id=rv+(c+1);const s=KDATA.siilot.find(x=>x.id===id);
  h+=s?cell(s):`<div class="scell empty" data-tyhja="${id}">${L.tyhjat[id]?'<span class="sub">'+esc(L.tyhjat[id])+'</span>':''}</div>`}});
 h+='</div><div class="sgrid2">'+KDATA.siilot.filter(s=>s.rivi==null).map(cell).join('')+'</div>';return h}
const hlOf=v=>KDATA.hl.painot[v]??KDATA.hl.oletus;
const kapOf=(s,v)=>s.m3&&v?s.m3*10*hlOf(v):null;
const pctOf=(s,kg,v)=>{const k=kapOf(s,v);return k&&kg>0?Math.round(kg/k*100):null};
const m3t=s=>s.m3?fk(s.m3)+' m³':'m³ ?';
function barH(p){return p!=null?`<div class="bar"><i class="${p>100?'over':p>85?'hi':''}" style="width:${Math.min(100,p)}%"></i></div>`:''}
const lyh=v=>({'Kevätvehnä':'Kev.vehnä','Syysvehnä':'Syysv.'}[v]||v);
let valittuEra='';
function koti(){head('Kuivaus',false);const db=S.db();const p=S.puskuri();const k=db.erat.filter(e=>e.tila==='kuivaus');
 const pv=[...new Set(p.map(x=>x.viljalaji))];
 V.innerHTML=`<div class="status" id="tila">Puskurissa: <b>${p.length} kuormaa</b>${pv.length?' ('+esc(pv.join(', '))+')':''}<br>Kuivurissa: <b>${k.length?esc(k.map(e=>e.viljalaji+' '+fmt(e.markamassa_kg)+' kg').join(', ')):'tyhjä'}</b></div>
 <button class="btn big y" onclick="go('#kuorma')">🚜 Kuorma tuli</button>
 <button class="btn big b" onclick="go('#tayta')" ${p.length?'':'disabled'}>⬇ Täytä kuivuri</button>
 <button class="btn big g" onclick="go('#tyhjenna')" ${k.length?'':'disabled'}>⬆ Tyhjennä</button>
 <button class="btn big" onclick="go('#varastot')">🏠 Varastot</button>
 <button class="btn ghost" onclick="go('#asetukset')">⚙ Vienti & asetukset</button>`}

function kuorma(){head('Kuorma tuli',true);const y=new Date().getFullYear();
 let ls=KDATA.lohkot.filter(l=>l.vuosi===y);if(!ls.length){const m=Math.max(...KDATA.lohkot.map(l=>l.vuosi));ls=KDATA.lohkot.filter(l=>l.vuosi===m)}
 const recent=[...new Set(S.db().kuormat.slice().reverse().map(k=>k.lohko))].slice(0,4).filter(n=>ls.some(l=>l.nimi===n));
 const btn=l=>`<button class="btn" data-l="${esc(l.nimi)}">${esc(l.nimi)}<span class="sub">${esc(l.viljalaji)} · ${esc(l.lajike)}</span></button>`;
 const groups={};ls.forEach(l=>(groups[l.viljalaji]=groups[l.viljalaji]||[]).push(l));
 V.innerHTML=(recent.length?'<div class="lbl">Viimeisimmät</div><div class="grid">'+recent.map(n=>btn(ls.find(l=>l.nimi===n))).join('')+'</div>':'')+
  Object.keys(groups).sort().map(g=>`<div class="lbl">${esc(g)}</div><div class="grid">${groups[g].map(btn).join('')}</div>`).join('');
 V.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{try{const k=S.lisaaKuorma(b.dataset.l);toast('Kuorma: '+k.lohko);go('#koti')}catch(e){err(e)}})}

function tayta(){head('Täytä kuivuri',true);const p=S.puskuri();if(!p.length){V.innerHTML='<div class="status">Puskuri on tyhjä.</div>';return}
 let vl=p[0].viljalaji;let sel=new Set(p.filter(k=>k.viljalaji===vl).map(k=>k.id));
 const ed=S.edellinenEra(vl)||{};const f={markamassa_kg:0,lahtokosteus:ed.lahtokosteus||20,lahtokosteus_tapa:'arvio',kuivauslampo:ed.kuivauslampo||70,poistolampo:ed.poistolampo||40};
 V.innerHTML=`<div class="lbl">Kuormat puskurista</div><div id="ks"></div><div class="lbl">Märkämassa (vaaka)</div><div id="np">${NP}</div>
 <div class="lbl">Lähtökosteus %</div><div id="lk">${STEP}</div><div id="lkt">${TOG}</div>
 <div class="lbl">Kuivauslämpö °C</div><div id="kl">${STEP}</div><div class="lbl">Poistolämpö °C</div><div id="pl">${STEP}</div>
 <p class="sub" id="edinfo">${ed.id?'Lämmöt ja kosteus esitäytetty edellisestä '+esc(vl)+'-erästä':'Oletusarvot – ei aiempaa '+esc(vl)+'-erää'}</p>
 <button class="btn big g" id="tall">✔ Tallenna täyttö</button>`;
 const drawK=()=>{$('#ks').innerHTML=p.map(k=>{const dis=k.viljalaji!==vl;return `<button class="btn ${sel.has(k.id)?'sel':''} ${dis?'dis':''}" data-k="${k.id}" ${dis?'disabled':''}>${esc(k.lohko)}<span class="sub">${esc(k.viljalaji)} · ${aika(k.aika)}${dis?' · eri viljalaji':''}</span></button>`}).join('');
  V.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{sel.has(b.dataset.k)?sel.delete(b.dataset.k):sel.add(b.dataset.k);drawK()})};drawK();
 numpad($('#np'),0,v=>f.markamassa_kg=v);
 stepper($('#lk'),f.lahtokosteus,0.5,v=>fk(v.toFixed(1))+' %',v=>f.lahtokosteus=v);toggle($('#lkt'),'arvio',v=>f.lahtokosteus_tapa=v);
 stepper($('#kl'),f.kuivauslampo,1,v=>v+' °C',v=>f.kuivauslampo=v);stepper($('#pl'),f.poistolampo,0.1,v=>fk(v.toFixed(1))+' °C',v=>f.poistolampo=v);
 $('#tall').onclick=()=>{try{const e=S.luoEra([...sel],f);toast('Erä täytetty: '+e.viljalaji+' '+fmt(e.markamassa_kg)+' kg');go('#koti')}catch(e){err(e)}}}

function tyhjenna(){head('Tyhjennä',true);const es=S.db().erat.filter(e=>e.tila==='kuivaus');if(!es.length){V.innerHTML='<div class="status">Kuivurissa ei ole erää.</div>';return}
 const e=es.find(x=>x.id===valittuEra)||es[0];valittuEra=e.id;const ed=S.db().erat.filter(x=>x.viljalaji===e.viljalaji&&x.loppukosteus!=='').pop();
 const lk={arvo:e.loppukosteus!==''?e.loppukosteus:(ed?ed.loppukosteus:14),tapa:e.loppukosteus_tapa||'mitattu'};let siilo='',kg=0;
 const y=S.siirrotYht(e.id);
 V.innerHTML=(es.length>1?'<div class="lbl">Valitse erä</div><div class="grid" id="erat">'+es.map((x,i)=>`<button class="btn ${x.id===e.id?'sel':''}" data-e="${x.id}">${esc(x.viljalaji)}<span class="sub">Erä ${S.db().erat.indexOf(x)+1} · ${aika(x.tayttoaika)}</span></button>`).join('')+'</div>':'')+`<div class="status">Erä ${S.db().erat.indexOf(e)+1}: <b>${esc(e.viljalaji)}</b> ${e.satovuosi} · märkä ${fmt(e.markamassa_kg)} kg<br>Siirretty: <b>${fmt(y)} kg</b>${S.db().siirrot.filter(s=>s.era_id===e.id).map(s=>' · '+s.siilo+' '+fmt(s.massa_kg)).join('')}</div>
 <div class="lbl">Loppukosteus %</div><div id="lk">${STEP}</div><div id="lkt">${TOG}</div>
 <div class="lbl">Siilo</div><div id="sl"></div><div class="lbl">Siiloon mennyt massa (vaaka)</div><div id="np">${NP}</div>
 <button class="btn big y" id="jatka">Siilo täynnä – jatka seuraavaan</button><button class="btn big g" id="valmis">✔ Erä valmis</button>`;
 V.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{valittuEra=b.dataset.e;tyhjenna()});
 stepper($('#lk'),Number(lk.arvo),0.1,v=>fk(v.toFixed(1))+' %',v=>lk.arvo=v);toggle($('#lkt'),lk.tapa,v=>lk.tapa=v);
 const drawS=()=>{$('#sl').innerHTML=siiloGrid(s=>{const b=S.siiloSaldo(s.id);const dis=b.kg>0&&b.viljalaji!==e.viljalaji;const p=pctOf(s,b.kg,b.viljalaji);
  return `<button class="scell ${siilo===s.id?'sel':''} ${dis?'dis':''}" data-s="${s.id}" ${dis?'disabled':''}><b>${s.id}</b><span class="sub">${b.kg>0?esc(lyh(b.viljalaji)):'tyhjä'}${p!=null?' '+p+'%':''}</span><span class="sub">${b.kg>0?'':m3t(s)}</span></button>`});
  V.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{siilo=b.dataset.s;drawS()})};drawS();
 numpad($('#np'),0,v=>kg=v);
 const siirra=()=>{if(!siilo)throw new Error('Valitse siilo');S.siirto(e.id,siilo,kg,lk)};
 $('#jatka').onclick=()=>{try{siirra();toast(fmt(kg)+' kg → '+siilo);tyhjenna()}catch(x){err(x)}};
 $('#valmis').onclick=()=>{try{if(kg>0||siilo)siirra();if(!S.siirrotYht(e.id))throw new Error('Ei yhtään siirtoa');const r=S.eraValmis(e.id,lk);valittuEra='';
  toast('Erä valmis');V.innerHTML=`<div class="status" id="tulos"><b>Erä valmis</b><br>Märkämassa: ${fmt(r.markamassa_kg)} kg<br>Siiloihin: ${fmt(r.siirrot_kg)} kg<br>Kuivaus- ja puhdistushävikki: <b class="warn">${fmt(r.havikki_kg)} kg (${fk(r.havikki_pct)} %)</b></div><button class="btn big" onclick="go('#koti')">Kotiin</button>`}catch(x){err(x)}}}

function varastot(){head('Varastot',true);const db=S.db();
 const cards=siiloGrid(s=>{const b=S.siiloSaldo(s.id);const p=pctOf(s,b.kg,b.viljalaji);const k=kapOf(s,b.viljalaji);
  return `<div class="scell card2" data-siilo="${s.id}"><b>${s.id}</b><span class="sub">${b.kg>0?esc(lyh(b.viljalaji))+' '+b.satovuosi:'tyhjä'}</span><span class="kg">${b.kg>0?fmt(b.kg):''}</span><span class="sub">${b.kg>0?(p!=null?p+' %':'kap. ?'):m3t(s)}${b.lajit.length>1?' ⚠':''}</span>${barH(p)}</div>`});
 const tot={};db.tapahtumat.forEach(t=>{const k=t.viljalaji+' '+t.satovuosi;tot[k]=(tot[k]||0)+t.maara_kg});
 V.innerHTML=`<div class="lbl">Yhteensä</div><div class="status">${Object.keys(tot).length?Object.entries(tot).map(([k,v])=>esc(k)+': <b>'+fmt(v)+' kg</b>').join('<br>'):'Ei varastotapahtumia'}</div>
 ${cards}<p class="sub">Täyttöaste on ohjeellinen (oletus-hl-paino kg/hl viljalajin mukaan: ${Object.entries(KDATA.hl.painot).map(([k,v])=>k+' '+v).join(', ')}; muu ${KDATA.hl.oletus}) – ei estä kirjausta. Ylhäällä D-rivi, alhaalla A.</p><div class="lbl">Tapahtumat</div>
 <table><tr><th>Aika</th><th>Siilo</th><th>Laji</th><th>kg</th></tr>${db.tapahtumat.slice().reverse().slice(0,30).map(t=>`<tr><td>${aika(t.aika)}</td><td>${t.siilo}</td><td>${esc(t.viljalaji)}</td><td>${t.maara_kg>0?'+':''}${fmt(t.maara_kg)}</td></tr>`).join('')}</table><br>
 <button class="btn r" id="kumoa" ${S.undoLabel()?'':'disabled'}>↶ Kumoa viimeisin${S.undoLabel()?': '+esc(S.undoLabel()):''}</button>`;
 $('#kumoa').onclick=()=>{if(confirm('Kumotaanko: '+S.undoLabel()+'?')){S.kumoa();varastot()}}}

function asetukset(){head('Vienti & asetukset',true);
 V.innerHTML=`<div class="lbl">CSV-vienti</div>${S.tables.map(t=>`<button class="btn" data-t="${t}">⬇ ${t}.csv (${S.db()[t].length})</button>`).join('')}<button class="btn y" id="all">⬇ Kaikki taulut</button>
 <div class="lbl">Sheets-synkka (Apps Script URL)</div><input type="text" id="url" placeholder="https://script.google.com/macros/s/.../exec" value="${esc(S.asetus('syncUrl'))}"><br><br>
 <button class="btn b" id="su">Tallenna ja synkkaa</button><p class="sub">Jonossa ${S.db().jono.length} muutosta.</p>`;
 const dl=t=>{const c=S.csv(t)||'\ufeff';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:'text/csv'}));a.download=t+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click()};
 V.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>dl(b.dataset.t));$('#all').onclick=()=>S.tables.forEach((t,i)=>setTimeout(()=>dl(t),i*400));
 $('#su').onclick=async()=>{S.asetus('syncUrl',$('#url').value.trim());try{const ok=await S.sync();alert(ok?'Synkattu':'Ei synkattavaa / offline / URL puuttuu')}catch(e){err(e)}net()}}

const R={'#koti':koti,'#kuorma':kuorma,'#tayta':tayta,'#tyhjenna':tyhjenna,'#varastot':varastot,'#asetukset':asetukset};
function route(){(R[location.hash]||koti)();scrollTo(0,0);net()}
addEventListener('hashchange',route);route();
if('serviceWorker' in navigator){const had=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)location.reload()});navigator.serviceWorker.register('sw.js')}
