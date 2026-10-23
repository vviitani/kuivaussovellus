# Apps Script -backendin käyttöönotto

1. Luo omaan Google Driveen uusi tyhjä Google Sheets -taulukko sovelluksen dataa varten.
2. Taulukossa: Laajennukset → Apps Script. Liitä `Code.gs`:n sisältö ja tallenna.
3. Ota käyttöön → Uusi käyttöönotto → tyyppi *Verkkosovellus*. Suorita käyttäjänä: *minä*. Käyttöoikeus: *Kuka tahansa* (sovelluksessa ei ole kirjautumista; URL toimii salasanana – älä jaa sitä).
4. Kopioi /exec-päättyvä URL → sovelluksessa ⚙ Vienti & asetukset → Sheets-synkka → Tallenna ja synkkaa.
5. Sovellus lähettää kaikki taulut jokaisen tallennuksen jälkeen, kun verkko on päällä; offline-tilassa muutokset jäävät jonoon ja lähtevät, kun yhteys palaa.

Upsert tehdään id:n mukaan; kumotut rivit merkitään `poistettu=TRUE`. Lisäsuojaksi voi lisätä jaetun avaimen tarkistuksen doPostiin.
