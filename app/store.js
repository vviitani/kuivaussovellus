// Tietotaso: localStorage, validointi, CSV-vienti, synkkajono.
(function(){
const KEY='kuivaus_v1';
const empty=()=>({kuormat:[],erat:[],siirrot:[],tapahtumat:[],jono:[],undo:[],asetukset:{syncUrl:''},seq:0});
let db; try{db=JSON.parse(localStorage.getItem(KEY))||empty()}catch(e){db=empty()}
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const now=()=>new Date().toISOString();
const id=p=>p+'-'+Date.now().toString(36)+'-'+(++db.seq);
const tables=['kuormat','erat','siirrot','tapahtumat'];
function snapshot(label){const s={label};tables.forEach(t=>s[t]=JSON.parse(JSON.stringify(db[t])));db.undo.push(s);if(db.undo.length>20)db.undo.shift()}
function q(op,table,row){db.jono.push({op,table,row,t:now()})}
const S={
 db:()=>db,
 lohko:n=>KDATA.lohkot.find(l=>l.nimi===n),
 puskuri:()=>db.kuormat.filter(k=>!k.era_id),
 lisaaKuorma(lohkoNimi,aika){
  const l=S.lohko(lohkoNimi); if(!l) throw new Error('Tuntematon lohko');
  aika=aika||now(); snapshot('Kuorma '+lohkoNimi);
  const k={id:id('K'),aika,lohko:l.nimi,viljalaji:l.viljalaji,kasvi:l.kasvi,lajike:l.lajike,satovuosi:new Date(aika).getFullYear(),era_id:''};
  db.kuormat.push(k);q('insert','kuormat',k);save();return k;
 },
 // Datatason esto: erässä vain yksi viljalaji
 luoEra(kuormaIdt,f){
  const ks=kuormaIdt.map(i=>db.kuormat.find(k=>k.id===i));
  if(!ks.length||ks.some(k=>!k)) throw new Error('Valitse vähintään yksi kuorma');
  if(ks.some(k=>k.era_id)) throw new Error('Kuorma on jo erässä');
  const vl=new Set(ks.map(k=>k.viljalaji)); if(vl.size>1) throw new Error('Erässä ei voi sekoittaa viljalajeja: '+[...vl].join(', '));
  if(!(f.markamassa_kg>0)) throw new Error('Anna märkämassa');
  snapshot('Täyttö'); const vuodet=ks.map(k=>k.satovuosi);
  const e={id:id('E'),viljalaji:ks[0].viljalaji,satovuosi:Math.max(...vuodet),lohkot:[...new Set(ks.map(k=>k.lohko))].join('; '),
   tayttoaika:now(),markamassa_kg:f.markamassa_kg,lahtokosteus:f.lahtokosteus,lahtokosteus_tapa:f.lahtokosteus_tapa,
   kuivauslampo:f.kuivauslampo,poistolampo:f.poistolampo,loppukosteus:'',loppukosteus_tapa:'',tila:'kuivaus',valmis_aika:'',siirrot_kg:0,havikki_kg:'',havikki_pct:''};
  db.erat.push(e); ks.forEach(k=>{k.era_id=e.id;q('update','kuormat',k)}); q('insert','erat',e); save(); return e;
 },
 siiloSaldo(sid){
  const t=db.tapahtumat.filter(x=>x.siilo===sid); const kg=t.reduce((a,x)=>a+x.maara_kg,0);
  const last=[...t].reverse().find(x=>x.maara_kg>0);
  return {kg,viljalaji:kg>0&&last?last.viljalaji:'',satovuosi:kg>0&&last?last.satovuosi:'',lajit:[...new Set(t.filter(x=>x.maara_kg>0).map(x=>x.viljalaji))]};
 },
 siirto(eraId,siilo,kg,loppu){
  const e=db.erat.find(x=>x.id===eraId); if(!e||e.tila!=='kuivaus') throw new Error('Erä ei ole tyhjennettävissä');
  if(!(kg>0)) throw new Error('Anna massa');
  const s=S.siiloSaldo(siilo); if(s.kg>0&&s.viljalaji&&s.viljalaji!==e.viljalaji) throw new Error('Siilossa '+siilo+' on '+s.viljalaji);
  snapshot('Siirto '+siilo);
  if(loppu){e.loppukosteus=loppu.arvo;e.loppukosteus_tapa=loppu.tapa}
  const r={id:id('S'),era_id:e.id,siilo,massa_kg:kg,aika:now()}; db.siirrot.push(r);
  const t={id:id('T'),aika:r.aika,tyyppi:'saapuminen',siilo,viljalaji:e.viljalaji,satovuosi:e.satovuosi,maara_kg:kg,era_id:e.id,siirto_id:r.id,selite:'Kuivurista erä '+e.id};
  db.tapahtumat.push(t); e.siirrot_kg=S.siirrotYht(e.id);
  q('insert','siirrot',r);q('insert','tapahtumat',t);q('update','erat',e);save();return r;
 },
 siirrotYht:eid=>db.siirrot.filter(s=>s.era_id===eid).reduce((a,s)=>a+s.massa_kg,0),
 eraValmis(eraId,loppu){
  const e=db.erat.find(x=>x.id===eraId); if(!e) throw new Error('Erää ei löydy');
  snapshot('Erä valmis');
  if(loppu){e.loppukosteus=loppu.arvo;e.loppukosteus_tapa=loppu.tapa}
  e.siirrot_kg=S.siirrotYht(e.id); e.havikki_kg=e.markamassa_kg-e.siirrot_kg;
  e.havikki_pct=Math.round(e.havikki_kg/e.markamassa_kg*1000)/10; e.tila='valmis'; e.valmis_aika=now();
  q('update','erat',e);save();return e;
 },
 // Valmis rakenne lähdöille ja korjauksille
 tapahtuma(tyyppi,siilo,maara_kg,selite){
  if(!['lahto','korjaus'].includes(tyyppi)) throw new Error('tyyppi');
  const s=S.siiloSaldo(siilo); snapshot(tyyppi+' '+siilo);
  const t={id:id('T'),aika:now(),tyyppi,siilo,viljalaji:s.viljalaji,satovuosi:s.satovuosi,maara_kg:tyyppi==='lahto'?-Math.abs(maara_kg):maara_kg,era_id:'',siirto_id:'',selite:selite||''};
  db.tapahtumat.push(t);q('insert','tapahtumat',t);save();return t;
 },
 edellinenEra(vl){return [...db.erat].reverse().find(e=>e.viljalaji===vl)},
 kumoa(){const s=db.undo.pop(); if(!s) return null; tables.forEach(t=>db[t]=s[t]); q('restore','*',{label:s.label}); save(); return s.label},
 undoLabel:()=>db.undo.length?db.undo[db.undo.length-1].label:'',
 csv(t){const rows=db[t];if(!rows.length)return'';const cols=[...new Set(rows.flatMap(Object.keys))];
  const esc=v=>{v=v==null?'':String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  return '\ufeff'+cols.join(';')+'\n'+rows.map(r=>cols.map(c=>esc(r[c])).join(';')).join('\n')+'\n'},
 tables,
 asetus(k,v){if(v!==undefined){db.asetukset[k]=v;save()}return db.asetukset[k]},
 // Synkka Apps Scriptiin: lähetetään koko taulut (idempotentti upsert), jono tyhjennetään onnistuessa
 async sync(){
  const url=db.asetukset.syncUrl; if(!url||!navigator.onLine||!db.jono.length) return false;
  const body=JSON.stringify({tables:Object.fromEntries(tables.map(t=>[t,db[t]])),ops:db.jono.length});
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body});
  const j=await r.json(); if(j.ok){db.jono=[];save();return true} throw new Error(j.error||'sync');
 },
 _reset(){db=empty();save()}
};
window.S=S;
})();
