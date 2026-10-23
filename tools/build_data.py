# Generoi app/data.js lähde-CSV:istä (data/ luetaan vain).
import csv, json, os
d = os.path.join(os.path.dirname(__file__), '..', 'data')
def rd(n): return list(csv.DictReader(open(os.path.join(d, n), encoding='utf-8')))
def num(x):
    try: return float(x.replace(',', '.'))
    except: return None
lohkot = [dict(nimi=r['wisu_nimi'], viljalaji=r['viljalaji'], kasvi=r['kasvi'], lajike=r['lajike'], vuosi=int(r['vuosi']), alias=r['farmtrx_alias']) for r in rd('lohkot.csv')]
siilot = [dict(id=r['siilo'], m3=num(r.get('tilavuus_m3') or ''), kap_kg=(num(r.get('kapasiteetti_t_hlp55') or '') or 0)*1000 or None) for r in rd('siilot.csv')]
raaka = [{k: r[k] for k in ('wisu_nimi','tuote','satovuosi','kapasiteetti_kg') if k in r} for r in rd('siilot_raaka.csv')]
layout = json.load(open(os.path.join(os.path.dirname(__file__), 'layout.json'), encoding='utf-8'))
for x in siilot:
    sid = x['id']
    if sid[0] in layout['rivit'] and sid[1:].isdigit():
        x['rivi'] = layout['rivit'].index(sid[0]); x['sarake'] = int(sid[1:]) - 1
out = os.path.join(os.path.dirname(__file__), '..', 'app', 'data.js')
nocom = lambda d: {k: v for k, v in d.items() if not k.startswith('_')}
layout = nocom(layout)
open(out, 'w', encoding='utf-8').write('window.KDATA=' + json.dumps(dict(lohkot=lohkot, siilot=siilot, wisuSiilot=raaka, layout=layout, hl=nocom(json.load(open(os.path.join(os.path.dirname(__file__), 'hl_painot.json'), encoding='utf-8')))), ensure_ascii=False) + ';\n')
hlp=json.load(open(os.path.join(os.path.dirname(__file__), 'hl_painot.json'), encoding='utf-8'))['painot']
for v in sorted({l['viljalaji'] for l in lohkot}): print(v, hlp.get(v, 'OLETUS'))
print(len(lohkot), 'lohkoa,', len(siilot), 'siiloa')
