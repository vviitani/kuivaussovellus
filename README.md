# Kuivaus- ja varastokirjanpito (PWA)

Mobiilisovellus viljankuivaamon kirjauksiin: kuorma pellolta → kuivurin täyttö (erä) → tyhjennys siiloihin → varastosaldo. Yksi kirjaaja, ei kirjautumista, toimii offline, suomeksi, tumma korkeakontrastinen teema ja isot napit.

## Rakenne
- `app/` – sovellus: `index.html`, `app.js` (näkymät), `store.js` (tietotaso), `sw.js` (offline-välimuisti), manifest ja ikonit, `data.js` (generoitu lohko-, siilo-, layout- ja hl-paino-data)
- `tools/build_data.py` – generoi `app/data.js`:n
- `tools/layout.json` – siilojen fyysinen sijainti ruudukossa
- `tools/hl_painot.json` – viljalajikohtaiset oletus-hl-painot
- `backend/` – valinnainen Google Apps Script -synkka (`Code.gs`, `OHJE.md`)
- `tests/e2e.mjs` – Playwright-päästä päähän -testi

## Data ja määrittelyt
`build_data.py` lukee (ei sisälly repoon):
- `data/lohkot.csv`: `wisu_nimi, viljalaji, kasvi, lajike, vuosi, farmtrx_alias`
- `data/siilot.csv`: `siilo, tilavuus_m3, …` (puuttuvat arvot sallitaan)
- `data/siilot_raaka.csv`: kirjanpidolliset varastot tuotteittain

Siilotunnus on muotoa rivikirjain + sarakenumero (esim. `A1`). `layout.json` määrittää rivien järjestyksen, sarakemäärän, tyhjät ruudut ja ruudukon ulkopuolella näytettävät siilot.

`hl_painot.json`: `painot` (kg/hl per viljalaji) ja `oletus` tuntemattomalle. Kapasiteetti = tilavuus m³ × 10 × hl-paino siilon nykyisen viljalajin mukaan. Täyttöaste on ohjeellinen eikä estä kirjausta; tyhjälle siilolle näytetään tilavuus.

Muutosten jälkeen: `python3 tools/build_data.py`.

## Näkymät
- **Koti**: Kuorma tuli / Täytä kuivuri / Tyhjennä / Varastot + tilarivi (puskuri, kuivurissa olevat erät).
- **Kuorma tuli**: lohkonapit (viimeisimmät ylhäällä), yksi napautus.
- **Täytä kuivuri**: puskurin saman viljalajin kuormat esivalittu, eri viljalaji estetty; märkämassa numpadilla; lähtökosteus 0,5 %-yks. askelin (arvio/mitattu). Uuden erän voi täyttää, vaikka edellinen on vielä kesken.
- **Tyhjennä**: erävalinta (oletus vanhin), kuivaus- ja poistolämpö (esitäytetty edellisestä saman lajin erästä), loppukosteus 0,1 %-yks., siilot fyysisenä ruudukkona, massa numpadilla, "Siilo täynnä – jatka seuraavaan" ja "Erä valmis" (näyttää hävikin).
- **Varastot**: siilokortit ruudukkona (laji, satovuosi, kg, täyttöaste, eränumero), yhteenveto, tapahtumat, kumoa viimeisin. Siilon napautus avaa siilon tiedot (`#siilo/D1`).
- **Siilon tiedot**: laji, satovuosi, saldo, ohjeellinen täyttöaste, lohkot (jäljitetään saapumisista erän kautta ja siirroista lähdesiilon kautta; vain nykyinen sisältö – lista nollautuu kun saldo käy nollassa), esinäyte-eränumero ja muistiinpano (tallennettavat), esinäyte-ryhmän yhteenveto (siilot joilla sama eränumero + yhteismassa), toiminnot ja siilon tapahtumat.
- **Myynti / lähtö** (`#myynti/D1`): siilo → massa → valinnainen selite. Ylimyynti estetty.
- **Siilosiirto** (`#siirto/D1`): lähde → kohde → massa. Kohteen pitää olla tyhjä tai samaa lajia.
- **Korjaa saldo** (`#korjaus/D1`): anna oikea saldo, sovellus näyttää erotuksen; syy pakollinen.
- Jokaisen tallennuksen jälkeen kuittaus + Kumoa. **⚙ Vienti & asetukset**: CSV-vienti ja synkan URL.

## Tietomalli
- **kuormat**: id, aika, lohko, viljalaji, kasvi, lajike, satovuosi (korjuupäivästä), era_id (tyhjä = puskurissa). Ei massaa.
- **erat**: id, viljalaji, satovuosi, lohkot, tayttoaika, markamassa_kg, lahtokosteus(+tapa), kuivauslampo, poistolampo, loppukosteus(+tapa), tila (kuivaus/valmis), valmis_aika, siirrot_kg, havikki_kg, havikki_pct. Vain yksi laji per erä (estetty UI:ssa ja tietotasossa).
- **siirrot**: id, era_id, siilo, massa_kg, aika (useita per erä).
- **tapahtumat**: id, aika, tyyppi, siilo, viljalaji, satovuosi, maara_kg (±), era_id, siirto_id, selite. Tyypit:
  - `saapuminen` (+) kuivurista siiloon; `siirto_id` viittaa kuivurisiirtoon.
  - `lahto` (−) myynti tai muu lähtö.
  - `siirto` siilosta toiseen: kaksi riviä (− lähde, + kohde) samalla `siirto_id`:llä (`SS-…`).
  - `korjaus` (±) erotus oikeaan saldoon; syy selitteessä.
- **siiloMeta** (vain paikallisesti): `{siilo: {eraNumero, muistiinpano}}`. Tyhjenee automaattisesti kun siilon saldo menee nollaan. Siirrossa tiedot kopioituvat kohteeseen; jos kohteella on eri tiedot, käyttäjä valitsee kumman tiedot jäävät.

**Laji**: vehnä erotellaan kasvin mukaan (Kevätvehnä / Syysvehnä, näytössä Kev.vehnä / Syysv.), muut viljalajin mukaan. Kuorman `viljalaji`-kenttään tallentuu tämä laji, joten kevät- ja syysvehnä eivät sekoitu erässä eivätkä siilossa.

Kaikki kirjaukset (myös siirto kokonaisuutena ja tietojen tallennus) voi kumota.
- Kuivaus- ja puhdistushävikki = märkämassa − siirtojen summa (tallennetaan erälle).

Data tallennetaan selaimen localStorageen; varmuuskopioi CSV-viennillä tai Sheets-synkalla.

## Asennus puhelimeen
Sovellus tarvitsee HTTPS-osoitteen (esim. GitHub Pages). Avaa osoite puhelimen Chromessa/Safarissa → "Lisää aloitusnäyttöön". Päivitykset tulevat, kun `sw.js`:n välimuistiversiota kasvatetaan; sovellus latautuu uudelleen automaattisesti.

## Sheets-synkka
Katso `backend/OHJE.md`. Synkka on valinnainen; ilman URL:ia sovellus toimii vain paikallisesti.

## Testaus
```
cd app && python3 -m http.server 8765
cd tests && npm i && npx playwright install chromium && node e2e.mjs && node varasto.mjs
```
Testi ajaa mobiilikoossa koko kulun (kuormat → täyttö → tyhjennys kahteen siiloon → saldot ja hävikki), viljalajieston, useat avoimet erät, kapasiteetin ylityksen, offline-tilan ja CSV-viennin. `varasto.mjs` testaa kevät-/syysvehnäeston, siilon tiedot, esinäyte-ryhmän, myynnin, siirron (tietojen siirto ja valinta), korjauksen ja kumoamisen. Kuvakaappaukset tallentuvat `screenshots/`-kansioon.

## Avoimet kohdat
- Myyntitilitysten automaattinen tuonti.
- Kytkentä kirjanpidollisiin varastoihin ja vienti viljelysuunnitteluohjelmaan.
- Satovuoden käsittely vuodenvaihteen yli.
