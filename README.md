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
- **Täytä kuivuri**: puskurin saman viljalajin kuormat esivalittu, eri viljalaji estetty; märkämassa numpadilla; lähtökosteus 0,5 %-yks. askelin (arvio/mitattu); kuivaus- ja poistolämpö (0,1 °C) esitäytetty edellisestä saman viljalajin erästä. Uuden erän voi täyttää, vaikka edellinen on vielä kesken.
- **Tyhjennä**: erävalinta (oletus vanhin), loppukosteus 0,1 %-yks., siilot fyysisenä ruudukkona, massa numpadilla, "Siilo täynnä – jatka seuraavaan" ja "Erä valmis" (näyttää hävikin).
- **Varastot**: siilokortit ruudukkona (viljalaji, satovuosi, kg, täyttöaste), yhteenveto, tapahtumat, kumoa viimeisin.
- Jokaisen tallennuksen jälkeen kuittaus + Kumoa. **⚙ Vienti & asetukset**: CSV-vienti ja synkan URL.

## Tietomalli
- **kuormat**: id, aika, lohko, viljalaji, kasvi, lajike, satovuosi (korjuupäivästä), era_id (tyhjä = puskurissa). Ei massaa.
- **erat**: id, viljalaji, satovuosi, lohkot, tayttoaika, markamassa_kg, lahtokosteus(+tapa), kuivauslampo, poistolampo, loppukosteus(+tapa), tila (kuivaus/valmis), valmis_aika, siirrot_kg, havikki_kg, havikki_pct. Vain yksi viljalaji per erä (estetty UI:ssa ja tietotasossa).
- **siirrot**: id, era_id, siilo, massa_kg, aika (useita per erä).
- **tapahtumat**: id, aika, tyyppi (saapuminen/lahto/korjaus), siilo, viljalaji, satovuosi, maara_kg (±), era_id, siirto_id, selite. Jokaisesta siirrosta syntyy saapuminen.
- Kuivaus- ja puhdistushävikki = märkämassa − siirtojen summa (tallennetaan erälle).

Data tallennetaan selaimen localStorageen; varmuuskopioi CSV-viennillä tai Sheets-synkalla.

## Asennus puhelimeen
Sovellus tarvitsee HTTPS-osoitteen (esim. GitHub Pages). Avaa osoite puhelimen Chromessa/Safarissa → "Lisää aloitusnäyttöön". Päivitykset tulevat, kun `sw.js`:n välimuistiversiota kasvatetaan; sovellus latautuu uudelleen automaattisesti.

## Sheets-synkka
Katso `backend/OHJE.md`. Synkka on valinnainen; ilman URL:ia sovellus toimii vain paikallisesti.

## Testaus
```
cd app && python3 -m http.server 8765
cd tests && npm i && npx playwright install chromium && node e2e.mjs
```
Testi ajaa mobiilikoossa koko kulun (kuormat → täyttö → tyhjennys kahteen siiloon → saldot ja hävikki), viljalajieston, useat avoimet erät, kapasiteetin ylityksen, offline-tilan ja CSV-viennin. Kuvakaappaukset tallentuvat `screenshots/`-kansioon.

## Avoimet kohdat
- Lähtöjen (myynnit) ja korjausten näkymät.
- Kytkentä kirjanpidollisiin varastoihin ja vienti viljelysuunnitteluohjelmaan.
- Satovuoden käsittely vuodenvaihteen yli.
