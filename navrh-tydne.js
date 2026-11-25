/* Návrh denního menu na týden z historie (HISTORIE_MENU z historie-data.js).
   Žádná umělá inteligence ani externí služba: jednoduché bodování nad tím, co se v restauraci opravdu vařilo.

   Body jídla pro daný den a pozici =
     oblíbenost      log(1 + kolikrát se vařilo)
   + pozice          jak často bylo právě na této pozici (č. 2 = skoro vždy smažené bezmasé)
   + sezóna          podíl výskytů v okolí stejného měsíce
   + den v týdnu     drobný bonus, pokud se vaří typicky v tento den
   + odstup          vařeno před < 7 dny → vyřazeno, < 21 dny → minus, dlouho ne → plus
   + náhoda          aby „Jiný návrh“ dal jinou kombinaci
   Pravidla týdne: žádné jídlo ani polévka dvakrát, v jednom dni ne dvě jídla se stejnou přílohou. */

const NavrhTydne = (() => {
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // Klíč jídla = kořeny slov hlavní části názvu, takže „Smažené/Smažený sýrové DUO“
  // nebo „řízek na česneku / s česnekem“ jsou jedno jídlo
  const PREDLOZKY = new Set(['na', 's', 'se', 'v', 've', 'a', 'z', 'ze', 'po', 'do', 'niva']);
  const klic = (nazev) => norm(nazev.split(',')[0]).split(/[^a-z0-9]+/).filter((w) => w && !PREDLOZKY.has(w)).map((w) => w.slice(0, 5)).sort().join(' ');
  const DEN_MS = 864e5;
  const PRILOHY = [['knedlik', /knedl/], ['rýže', /ryz/], ['hranolky', /hranol/], ['kaše', /kase/], ['těstoviny', /testovin|spaget/], ['salát', /bramborov[yý] salat/]]; // obyčejný brambor se může v jednom dni opakovat
  const priloha = (n) => { const x = norm(n); const p = PRILOHY.find(([, r]) => r.test(x)); return p ? p[0] : ''; };
  const BEZ_MASA = /smazen[ya] (syr|hermelin|zampion|kvetak)|syrove duo|zampiony|kvetak|ovocne|buchticky|koprovka|omeleta(?!.*uzen)/;
  const MASO = /sunk|uzen|klobas|slanin|maso|kure|vepr/;
  const bezMasa = (n) => { const x = norm(n); return BEZ_MASA.test(x) && !MASO.test(x.replace(/sunkou a syrem/, 'X')); };

  // Pseudonáhoda se semínkem (stejné semínko = stejný návrh)
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }

  function statistiky(historie) {
    const jidla = new Map(), polevky = new Map();
    const pridej = (mapa, nazev, datum, pozice) => {
      if (!nazev) return;
      const k = klic(nazev);
      if (!mapa.has(k)) mapa.set(k, { klic: k, varianty: new Map(), data: [], pozice: [0, 0, 0, 0, 0], dny: [0, 0, 0, 0, 0, 0, 0], mesice: Array(12).fill(0) });
      const s = mapa.get(k);
      s.varianty.set(nazev, (s.varianty.get(nazev) || 0) + 1);
      s.data.push(datum); s.pozice[Math.min(pozice, 4)]++;
      s.dny[(datum.getDay() + 6) % 7]++; s.mesice[datum.getMonth()]++;
    };
    historie.forEach((d) => {
      const datum = new Date(d.datum + 'T12:00:00');
      pridej(polevky, d.polevka, datum, 0);
      d.jidla.forEach((j, i) => pridej(jidla, j, datum, i + 1));
    });
    for (const mapa of [jidla, polevky]) for (const s of mapa.values()) {
      s.pocet = s.data.length;
      s.posledne = new Date(Math.max(...s.data));
      // nejčastější podoba názvu, při shodě ta poslední
      s.nazev = [...s.varianty.entries()].sort((a, b) => b[1] - a[1])[0][0];
      s.bezMasa = bezMasa(s.nazev); s.priloha = priloha(s.nazev);
    }
    return { jidla: [...jidla.values()], polevky: [...polevky.values()], dni: historie.length };
  }

  function body(s, datum, pozice, nahoda) {
    const dniOd = (datum - s.posledne) / DEN_MS;
    if (dniOd >= 0 && dniOd < 7) return null;
    const m = datum.getMonth();
    const sezona = (s.mesice[m] + 0.6 * (s.mesice[(m + 11) % 12] + s.mesice[(m + 1) % 12])) / s.pocet;
    const naPozici = pozice ? (s.pozice[pozice] + 0.3) / (s.pocet + 1) : 1;
    const den = s.dny[(datum.getDay() + 6) % 7] / s.pocet;
    const odstup = dniOd < 0 ? 0 : dniOd < 21 ? -1 : dniOd > 60 ? 0.3 : 0;
    if (/\bletni\b/.test(norm(s.nazev)) && (m < 4 || m > 8)) return null; // „letní“ jídla jen květen–září
    const jistota = s.pocet / (s.pocet + 3); // u jídla vařeného 1× sezóně ani dni moc nevěříme
    const mimoSezonu = s.pocet >= 3 && sezona === 0 ? -0.5 : 0;
    const b = { oblibenost: 1.2 * Math.log1p(s.pocet), pozice: 2.2 * naPozici, sezona: 1.1 * sezona * jistota + mimoSezonu, den: 0.4 * den * jistota, odstup, nahoda: 0.9 * nahoda };
    return { celkem: Object.values(b).reduce((a, x) => a + x, 0), b, dniOd };
  }

  function duvod(s, v, datum) {
    const casti = [`vařeno ${s.pocet}×`];
    if (v.dniOd > 0) { const t = Math.round(v.dniOd / 7); casti.push(t >= 8 ? `naposledy ${s.posledne.getMonth() + 1}/${s.posledne.getFullYear()}` : t <= 1 ? 'naposledy minulý týden' : `naposledy před ${t} týdny`); }
    if (s.pocet >= 3 && v.b.sezona >= 0.35) casti.push(['v zimě', 'v zimě', 'na jaře', 'na jaře', 'na jaře', 'v létě', 'v létě', 'v létě', 'na podzim', 'na podzim', 'na podzim', 'v zimě'][datum.getMonth()] + ' časté');
    if (s.pocet >= 3 && v.b.den >= 0.15) casti.push('často v tento den');
    return casti.join(' · ');
  }

  /** Vrátí návrh: [{ datum, polevka: {nazev, duvod}, jidla: [{nazev, duvod, bezMasa}] }] pro 5 dní od `od`. */
  // vynech: jídla, která se nemají nabídnout (např. při výměně jednoho jídla to předchozí)
  function navrhni(historie, od, { seed = 1, zamcene = {}, pocetJidel = 3, vynech = [] } = {}) {
    const st = statistiky(historie), r = rng(seed);
    const pouzite = new Set([...Object.values(zamcene), ...vynech].map((n) => klic(n)));
    const tyden = [];
    for (let i = 0; i < 5; i++) {
      const datum = new Date(new Date(od + 'T12:00:00').getTime() + i * DEN_MS);
      const den = { datum, polevka: null, jidla: [] };
      const vcera = new Set(i ? [tyden[i - 1].polevka, ...tyden[i - 1].jidla].filter(Boolean).map((x) => klic(x.nazev)) : []);
      const vyber = (zdroj, pozice, filtr, zamekKlic, povolOpakovani = false) => {
        if (zamcene[zamekKlic]) { const n = zamcene[zamekKlic]; const s = zdroj.find((x) => x.klic === klic(n)); return { nazev: n, duvod: 'zamčeno', bezMasa: s ? s.bezMasa : bezMasa(n), priloha: priloha(n), zamceno: true }; }
        let nej = null;
        for (const s of zdroj) {
          if ((povolOpakovani ? vcera.has(s.klic) || den.jidla.some((j) => klic(j.nazev) === s.klic) : pouzite.has(s.klic)) || !filtr(s)) continue;
          const v = body(s, datum, pozice, r());
          if (!v) continue;
          // podobné jídlo už v týdnu je (např. „řízek“ a „řízek na česneku“) → znevýhodnit
          const slova = s.klic.split(' ');
          if ([...pouzite].some((k2) => { const a = new Set(k2.split(' ')); return slova.filter((w) => a.has(w)).length >= Math.min(a.size, slova.length); })) v.celkem -= 2.5;
          if (!nej || v.celkem > nej.v.celkem) nej = { s, v };
        }
        if (!nej) return null;
        pouzite.add(nej.s.klic);
        return { nazev: nej.s.nazev, duvod: duvod(nej.s, nej.v, datum), bezMasa: nej.s.bezMasa, priloha: nej.s.priloha };
      };
      den.polevka = vyber(st.polevky, 0, () => true, `${i}-s`);
      for (let p = 1; p <= pocetJidel; p++) {
        const prilohyDne = den.jidla.map((j) => j.priloha).filter(Boolean);
        const maBezmase = den.jidla.some((j) => j.bezMasa);
        const filtr = (s) => !(s.priloha && prilohyDne.includes(s.priloha)) && (p !== 2 || maBezmase || s.bezMasa);
        // bezmasých jídel je v historii málo – když dojdou, smí se v týdnu zopakovat (ne ale den po dni)
        const j = vyber(st.jidla, p, filtr, `${i}-${p}`) || vyber(st.jidla, p, filtr, `${i}-${p}`, true);
        if (j) den.jidla.push(j);
      }
      tyden.push(den);
    }
    return { tyden, dniHistorie: st.dni, od: historie.length ? historie[0].datum : null };
  }

  return { navrhni, statistiky, klic, bezMasa };
})();
