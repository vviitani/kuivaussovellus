import { chromium, devices } from 'playwright';
const URL='http://localhost:8765/index.html', SS=new globalThis.URL('../screenshots/',import.meta.url).pathname;
const b=await chromium.launch();const ctx=await b.newContext({...devices['Pixel 7']});const p=await ctx.newPage();
let answer=true;const dialogs=[];p.on('dialog',d=>{dialogs.push(d.message());d.type()==='confirm'&&!answer?d.dismiss():d.accept()});p.on('pageerror',e=>{console.log('PAGEERROR',e.message);fails++});
let fails=0;const N=s=>(s||'').replace(/[\u00a0\u202f]/g,' ');const T=async s=>N(await p.textContent(s));const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m);if(!c)fails++};
const shot=n=>p.screenshot({path:SS+n+'.png',fullPage:true});const num=async v=>{await p.click('#np [data-k="C"]');for(const k of String(v))await p.click(`#np [data-k="${k}"]`)};
await p.goto(URL);await p.evaluate(()=>S._reset());await p.reload();await p.waitForTimeout(300);
// Kevät-/syysvehnä: data-tason esto
const r=await p.evaluate(()=>{const L=KDATA.lohkot.filter(l=>l.vuosi===2026);const kv=L.find(l=>l.kasvi==='Kevätvehnä'),sv=L.find(l=>l.kasvi==='Syysvehnä');
 const a=S.lisaaKuorma(kv.nimi),c=S.lisaaKuorma(sv.nimi);let m;try{S.luoEra([a.id,c.id],{markamassa_kg:1000});m='ei estetty'}catch(e){m=e.message}
 const e1=S.luoEra([a.id],{markamassa_kg:10000});S.siirto(e1.id,'D1',6000);S.siirto(e1.id,'D2',3000);S.eraValmis(e1.id);
 const e2=S.luoEra([c.id],{markamassa_kg:5000});S.siirto(e2.id,'D3',4500);S.eraValmis(e2.id);
 let m2;try{S.siiloSiirto('D3','D1',100)}catch(e){m2=e.message}return {m,m2,a:a.viljalaji,kv:kv.nimi}});
ok(r.m.includes('sekoittaa'),'kevät/syysvehnä eivät sekoitu erässä: '+r.m);ok(r.a==='Kevätvehnä','kuorman laji = Kevätvehnä');ok((r.m2||'').includes('Kevätvehnä'),'syysvehnää ei voi siirtää kevätvehnäsiiloon: '+r.m2);
await p.click('text=Varastot');const d1=await T('[data-siilo="D1"]');ok(d1.includes('Kev.vehnä'),'siilokortti lyhenteellä: '+d1);ok((await T('[data-siilo="D3"]')).includes('Syysv.'),'D3 Syysv.');
// Siilon tiedot
await p.click('[data-siilo="D1"]');await p.waitForSelector('#sinfo');ok((await T('#slohkot')).includes(r.kv),'lohko näkyy siilon tiedoissa');
await p.fill('#eranro','E-14');await p.fill('#muist','siemeneksi');await p.click('#tallm');
await p.goto(URL+'#siilo/D2');await p.fill('#eranro','E-14');await p.click('#tallm');ok((await T('#ryhma')).includes('9 000'),'esinäyte-ryhmä D1+D2 = 9 000 kg: '+(await T('#ryhma')));
await shot('10_siilo_tiedot');
// Myynti
await p.click('text=Myynti');await num(1000);await p.fill('#sel','kuorma 1');await shot('11_myynti');await p.click('#tall');
ok(await p.evaluate(()=>S.siiloSaldo('D2').kg)===2000,'myynti D2 −1 000');
await p.goto(URL+'#myynti/D2');await num(9999);await p.click('#tall');ok(dialogs.at(-1).includes('vain'),'ylimyynti estetty');
// Siirto D1→D4 (tyhjä): meta siirtyy, lähde tyhjenee
await p.goto(URL+'#siirto/D1');await p.click('#sc [data-p="D4"]');await num(6000);await shot('12_siirto');await p.click('#tall');
let m=await p.evaluate(()=>[S.meta('D1'),S.meta('D4')])
ok(m[0].eraNumero===''&&m[1].eraNumero==='E-14'&&m[1].muistiinpano==='siemeneksi','meta siirtyi D1→D4, D1 tyhjennetty');
ok((await T('#slohkot')).includes(r.kv),'lohkot periytyvät siirrossa');
ok(await p.evaluate(()=>S.db().tapahtumat.filter(t=>t.tyyppi==='siirto').length)===2,'siirrosta 2 tapahtumaa');
// Ristiriita: D2 E-14 vs D5 E-20 → pidä kohde
await p.evaluate(()=>{S.siiloSiirto('D2','D5',500);S.asetaMeta('D5',{eraNumero:'E-20'})});
answer=false;await p.goto(URL+'#siirto/D2');await p.click('#sc [data-p="D5"]');await num(500);await p.click('#tall');answer=true;
ok(dialogs.at(-1).includes('Kohdesiilossa D5'),'ristiriitakysymys näytettiin');ok(await p.evaluate(()=>S.meta('D5').eraNumero)==='E-20','kohteen eränumero pidettiin');
// Kumoa siirto
await p.evaluate(()=>S.kumoa());ok(await p.evaluate(()=>S.siiloSaldo('D5').kg===500&&S.siiloSaldo('D2').kg===1500),'kumoa palauttaa siirron kokonaan');
// Korjaus
await p.goto(URL+'#korjaus/D2');await num(1200);ok((await T('#delta')).includes('−300')||(await T('#delta')).includes('-300'),'delta näkyy: '+(await T('#delta')));
await p.click('#tall');ok(dialogs.at(-1).includes('syy'),'syy pakollinen');await p.fill('#sel','vaakavirhe');await shot('13_korjaus');await p.click('#tall');
ok(await p.evaluate(()=>S.siiloSaldo('D2').kg)===1200,'korjaus → 1 200');
await p.goto(URL+'#korjaus/D2');await num(0);await p.fill('#sel','tyhjä');await p.click('#tall');ok(await p.evaluate(()=>S.meta('D2').eraNumero)==='','nollaus tyhjentää metan');
await p.goto(URL+'#varastot');await p.waitForSelector('[data-siilo="D4"]');ok((await T('[data-siilo="D4"]')).includes('E-14'),'eränumero näkyy kortilla');await shot('14_varastot');
console.log(fails?fails+' FAIL':'KAIKKI OK');await b.close();process.exit(fails?1:0);
