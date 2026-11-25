/* Ukázka administrace denního menu.
   V hotovém webu se data ukládají do databáze, tady do localStorage, aby šlo vyzkoušet,
   že po „Uložit a zveřejnit“ se změna ukáže na uvod.html. */

const KLIC_ADMIN = 'rnm-admin-tydny-v1';
const clone = (o) => JSON.parse(JSON.stringify(o));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ---------- Historie jídel pro našeptávač ---------- */
const HISTORIE = (() => {
  const h = new Map();
  const add = (nazev, alergeny, cena, bezMasa, typ, kdy) => {
    const k = norm(nazev); if (!k) return;
    const o = h.get(k);
    if (o) { if (!o.alergeny.length && alergeny && alergeny.length) o.alergeny = [...alergeny]; if (!o.cena && cena) o.cena = cena; return; }
    h.set(k, { nazev, alergeny: alergeny ? [...alergeny] : [], cena, bezMasa: !!bezMasa, typ, kdy });
  };
  // Nejdřív skutečná historie ze současného webu (nejnovější první), ostatní jen doplní alergeny a ceny
  if (typeof HISTORIE_MENU !== 'undefined') [...HISTORIE_MENU].reverse().forEach((d) => {
    const dt = new Date(d.datum + 'T12:00:00'), kdy = `${dt.getDate()}. ${dt.getMonth() + 1}. ${dt.getFullYear()}`;
    if (d.polevka) add(d.polevka, [], '', false, 'polevka', kdy);
    d.jidla.forEach((j) => add(j, [], d.cena || '', NavrhTydne.bezMasa(j), 'jidlo', kdy));
  });
  VYCHOZI_TYDEN.dny.forEach((d, i) => {
    const kdy = fmt(datumDne('2026-11-09', i));
    add(d.polevka.nazev, d.polevka.alergeny, '', false, 'polevka', kdy);
    d.jidla.forEach((j) => add(j.nazev, j.alergeny, j.cena, j.bezMasa, 'jidlo', kdy));
  });
  [['Kulajda', [1, 3, 7], '2. 11.'], ['Frankfurtská', [1, 7, 9, 10], '4. 11.'], ['Hrachová s uzeným masem', [1, 9], '28. 10.'], ['Bramboračka s houbami', [1, 9], '22. 10.'], ['Dršťková', [1], '15. 10.'], ['Rajská s rýží', [1, 9], '9. 10.'], ['Fazolová', [1, 9], '1. 10.']]
    .forEach(([n, a, k]) => add(n, a, '', false, 'polevka', k));
  [['Segedínský guláš, houskový knedlík', [1, 3, 7], 145, '3. 11.'], ['Španělský ptáček, dušená rýže', [1, 3, 10], 149, '30. 10.'], ['Rajská omáčka s hovězím masem, houskový knedlík', [1, 3, 7, 9], 155, '29. 10.'],
   ['Koprovka s vejcem, vařený brambor', [1, 3, 7], 135, '27. 10.', true], ['Smažený kuřecí řízek, bramborová kaše', [1, 3, 7], 145, '23. 10.'], ['Vepřový řízek, bramborová kaše', [1, 3, 7], 145, '21. 10.'],
   ['Kuřecí přírodní řízek, dušená rýže', [7], 145, '20. 10.'], ['Hovězí guláš, houskový knedlík', [1, 3, 7], 149, '16. 10.'], ['Ovocné knedlíky s tvarohem', [1, 3, 7], 129, '10. 10.', true]]
    .forEach(([n, a, c, k, v]) => add(n, a, c, v, 'jidlo', k));
  LISTEK.forEach((kat) => kat.polozky.forEach((p) => { if (kat.id !== 'prilohy' && kat.id !== 'salaty' && kat.id !== 'dezerty' && !p.polevka) add(p.nazev, p.a, p.cena, p.bezMasa, 'jidlo', 'z lístku'); }));
  return [...h.values()];
})();

/* ---------- Stav ---------- */
const prazdnyDen = () => ({ polevka: { nazev: '', alergeny: [] }, jidla: [{ nazev: '', alergeny: [], cena: '' }, { nazev: '', alergeny: [], cena: '' }, { nazev: '', alergeny: [], cena: '' }] });
const posunDatum = (od, dny) => { const d = datumDne(od, dny); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let tydny, aktualni, den = 0, otevrenyPicker = null, zmeneno = false;
const novyTyden = (od) => ({ od, cenaPoznamka: VYCHOZI_TYDEN.cenaPoznamka, dny: [0, 1, 2, 3, 4].map(prazdnyDen) });

/* Ostrý web: týdny se načítají ze serveru, rozpracované změny se průběžně ukládají jako koncept
   a na web jdou až tlačítkem „Uložit a zveřejnit“. */
let stavy = {};                       // od -> { zverejneno, rozpracovano, zverejnenoKdy, upravil }
const spinave = new Set();            // týdny se změnami, které ještě nejsou uložené jako koncept
let konceptCasovac = null;
async function nactiZeServeru() {
  const r = await rnmApi('/api/admin/tydny');
  tydny = {}; stavy = {};
  r.tydny.forEach((t) => { tydny[t.od] = t.tyden; stavy[t.od] = t; });
  const dnes = new Date(r.dnes + 'T12:00:00'), dt = dnes.getDay();
  aktualni = posunDatum(r.dnes, -((dt + 6) % 7));
  if (dt === 0 || dt === 6) aktualni = posunDatum(aktualni, 7);   // o víkendu se chystá příští týden
  if (!tydny[aktualni]) tydny[aktualni] = novyTyden(aktualni);
}
async function ulozKonceptyNaServer() {
  for (const od of Array.from(spinave)) {
    spinave.delete(od);
    try {
      await rnmApi('/api/admin/tydny/' + od, { tyden: tydny[od] }, 'PUT');
      stavy[od] = Object.assign({}, stavy[od] || {}, { rozpracovano: true });
    } catch (e) { spinave.add(od); toast('Koncept se nepodařilo uložit: ' + e.message); return; }
  }
}
const fmtKdy = (s) => { const d = new Date(s + (s.length <= 16 ? ':00Z' : '')); return `${d.getDate()}. ${d.getMonth() + 1}. v ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
function vykresliStavTydne() {
  if (!RNM_SERVER) return;
  const s = $('#status'), st = stavy[aktualni] || {};
  const rozpr = zmeneno || st.rozpracovano;
  s.textContent = rozpr ? (st.zverejneno ? 'Změny nejsou zveřejněné' : 'Koncept, zatím není na webu') : st.zverejneno ? `Zveřejněno${st.zverejnenoKdy ? ' ' + fmtKdy(st.zverejnenoKdy) : ''}` : 'Zatím není na webu';
  s.classList.toggle('draft', !!rozpr || !st.zverejneno);
}

async function nactiPoptavky() {
  if (!RNM_SERVER) return;
  const pane = $('#v-poptavky'), seznam = $('.list-ed', pane), stav = $('.status', pane);
  let r;
  try { r = await rnmApi('/api/admin/poptavky'); } catch (e) { seznam.innerHTML = `<p class="tip">${esc(e.message)}</p>`; return; }
  const nove = r.poptavky.filter((p) => p.stav === 'nova').length;
  stav.textContent = nove ? `${nove} nov${nove === 1 ? 'á' : nove < 5 ? 'é' : 'ých'}` : 'Nic nového';
  stav.classList.toggle('draft', !!nove);
  $$('[data-view="poptavky"] .cnt').forEach((c) => { c.textContent = nove; c.hidden = !nove; });
  const datumCz = (s) => { if (!s) return ''; const d = new Date(s + 'T12:00:00'); return `${DNY_KRATCE[(d.getDay() + 6) % 7]} ${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`; };
  const telOdkaz = (t) => t.replace(/[^0-9+]/g, '');
  seznam.innerHTML = r.poptavky.length ? r.poptavky.map((p) => `
    <div class="inq" data-id="${p.id}"${p.stav === 'vyrizena' ? ' style="opacity:.7"' : ''}>
      <div class="inq-top"><h2>${esc(p.typ || 'Poptávka')}${p.osob ? ' · ' + esc(p.osob) + ' osob' : ''}</h2><span class="badge ${p.stav === 'nova' ? 'gold' : 'green'}">${p.stav === 'nova' ? 'Nová' : 'Vyřízeno'}</span></div>
      <div class="meta">${p.datum ? `<span class="badge">${datumCz(p.datum)}</span>` : ''}${p.cas ? `<span class="badge">příjezd ${esc(p.cas)}</span>` : ''}<span class="badge">přišlo ${fmtKdy(p.prijato)}</span></div>
      <p><b>${esc(p.jmeno)}</b>${p.tel ? ' · ' + esc(p.tel) : ''}${p.mail ? ' · ' + esc(p.mail) : ''}</p>
      ${p.zprava ? `<p>„${esc(p.zprava)}“</p>` : ''}
      <div class="quick" style="margin-top:6px">${p.tel ? `<a class="btn btn-ghost btn-sm" href="tel:${esc(telOdkaz(p.tel))}">Zavolat</a>` : ''}${p.mail ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(p.mail)}">Odpovědět e-mailem</a>` : ''}<button class="btn btn-ghost btn-sm" data-stav="${p.stav === 'nova' ? 'vyrizena' : 'nova'}">${p.stav === 'nova' ? 'Označit jako vyřízenou' : 'Vrátit mezi nové'}</button></div>
    </div>`).join('') : '<p class="tip"><span>📭</span><span>Zatím žádné poptávky. Jakmile někdo vyplní formulář na stránce Zájezdy a oslavy, objeví se tady.</span></p>';
}

function nacti() {
  try { const s = localStorage.getItem(KLIC_ADMIN); if (s) { const o = JSON.parse(s); tydny = o.tydny; aktualni = o.aktualni; return; } } catch (e) { /* bez úložiště */ }
  const t = clone(nactiTyden()); tydny = { [t.od]: t }; aktualni = t.od;
}
function ulozKoncept() {
  if (RNM_SERVER) { clearTimeout(konceptCasovac); if (spinave.size) konceptCasovac = setTimeout(ulozKonceptyNaServer, 1200); return; }
  try { localStorage.setItem(KLIC_ADMIN, JSON.stringify({ tydny, aktualni })); } catch (e) { /* ignorujeme */ }
}
const tyden = () => tydny[aktualni];
const denData = () => tyden().dny[den];
function oznacZmenu() { zmeneno = true; spinave.add(aktualni); const s = $('#status'); s.textContent = 'Neuložené změny'; s.classList.add('draft'); ulozKoncept(); vykresliStavTydne(); }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2600); }
const vyplnenyDen = (d) => d.zavreno || (d.jidla || []).some((j) => j.nazev.trim());

/* ---------- Vykreslení editoru ---------- */
function algBtn(a) { return `<button type="button" class="alg-btn" data-k="algbtn">Alergeny ${a && a.length ? alergenyHtml(a) : '<span style="font-weight:600">+ přidat</span>'}</button>`; }
function algPick(a, key) {
  return `<div class="alg-pick${otevrenyPicker === key ? ' open' : ''}">${ALERGENY.map((n, i) => `<button type="button" class="${a.includes(i + 1) ? 'on' : ''}" data-k="alg" data-n="${i + 1}" title="${n}">${i + 1}<small>${n}</small></button>`).join('')}</div>`;
}
function vykresliTaby() {
  const t = tyden();
  $('#ed-tabs').innerHTML = t.dny.map((d, i) => `<button class="day-tab${vyplnenyDen(d) ? ' filled' : ''}" role="tab" aria-selected="${i === den}" data-i="${i}"><b>${DNY_KRATCE[i]}</b><span>${fmt(datumDne(t.od, i))}</span></button>`).join('');
  const a = datumDne(t.od, 0), b = datumDne(t.od, t.dny.length - 1);
  $('#week-label').textContent = `${a.getDate()}.–${fmt(b)} ${b.getFullYear()}`;
}
function vykresliEditor() {
  vykresliTaby();
  const d = denData(), t = tyden();
  const body = $('#ed-body');
  body.classList.toggle('is-closed', !!d.zavreno);
  body.innerHTML = `
    <div class="row-head"><h2>${DNY[den]} ${fmt(datumDne(t.od, den))}</h2><label class="sw"><input type="checkbox" data-k="zavreno" ${d.zavreno ? 'checked' : ''}>Zavřeno</label></div>
    <div class="closed-note field"><label for="pozn">Co uvidí hosté</label><input id="pozn" data-k="poznamka" value="${esc(d.poznamka || '')}" placeholder="Např. Státní svátek – zavřeno"></div>
    <div class="open-only soup-ed" data-m="s">
      <span class="lbl2">Polévka</span>
      <div class="ac"><input data-k="name" data-typ="polevka" value="${esc(d.polevka.nazev)}" placeholder="Začněte psát, např. kulajda" autocomplete="off"><ul class="ac-list"></ul></div>
      <div class="meal-line2">${algBtn(d.polevka.alergeny)}</div>
      ${algPick(d.polevka.alergeny, 's')}
    </div>
    <span class="lbl2 open-only">Hlavní jídla</span>
    ${d.jidla.map((j, i) => `
      <div class="meal-ed open-only" data-m="${i}">
        <span class="meal-no">${i + 1}</span>
        <div class="meal-fields">
          <div class="ac"><input data-k="name" data-typ="jidlo" value="${esc(j.nazev)}" placeholder="Název jídla a přílohy" autocomplete="off"><ul class="ac-list"></ul></div>
          <div class="meal-line2">
            <label class="price"><span class="sr">Cena</span><input data-k="cena" inputmode="numeric" value="${esc(j.cena)}" placeholder="0"></label>
            ${algBtn(j.alergeny)}
            <label class="veg"><input type="checkbox" data-k="veg" ${j.bezMasa ? 'checked' : ''}>Bez masa</label>
            <button type="button" class="del" data-k="del" title="Odebrat jídlo" aria-label="Odebrat jídlo">×</button>
          </div>
          ${algPick(j.alergeny, String(i))}
        </div>
      </div>`).join('')}
    <button type="button" class="add-meal open-only" data-k="add">+ Přidat jídlo</button>`;
  vykresliNahled();
}
/* Náhled = skutečná úvodní stránka webu v rámečku telefonu, s rozpracovaným týdnem a časem 11:00 vybraného dne */
let nahledCasovac = null;
function vykresliNahled() {
  const t = clone(tyden());
  t.dny.forEach((d) => { d.jidla = (d.jidla || []).filter((j) => j.nazev.trim()); });
  try { localStorage.setItem('rnm-tyden-nahled', JSON.stringify(t)); } catch (e) { /* bez úložiště náhled ukáže výchozí data */ }
  clearTimeout(nahledCasovac);
  nahledCasovac = setTimeout(() => {
    const f = $('#pv-frame');
    if (f) f.src = `uvod.html?nahled=1&cas=${posunDatum(t.od, den)}T11:00&r=${Date.now()}`;
  }, 350);
}

/* ---------- Našeptávač ---------- */
let acIndex = -1;
function ukazNavrhy(input) {
  const list = input.nextElementSibling, q = norm(input.value), typ = input.dataset.typ;
  const zdroj = HISTORIE.filter((h) => h.typ === typ);
  const shoda = q ? zdroj.filter((h) => norm(h.nazev).includes(q)) : zdroj.slice(0, 6);
  if (!shoda.length || (shoda.length === 1 && norm(shoda[0].nazev) === q)) { list.classList.remove('open'); return; }
  const zvyrazni = (s) => { if (!q) return esc(s); const i = norm(s).indexOf(q); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
  acIndex = -1;
  list.innerHTML = `<li class="ac-head">${q ? 'Už jste vařili' : 'Naposledy jste vařili'}</li>` + shoda.slice(0, 7).map((h, i) => `<li data-i="${HISTORIE.indexOf(h)}"><b>${zvyrazni(h.nazev)}</b><small>${h.kdy ? (h.kdy === 'z lístku' ? 'z jídelního lístku' : 'naposledy ' + h.kdy) : ''}${h.alergeny.length ? ' · alergeny ' + h.alergeny.join(', ') : ''}${h.cena ? ' · ' + h.cena + ' Kč' : ''}</small></li>`).join('');
  list.classList.add('open');
}
function vyberNavrh(input, h) {
  const m = input.closest('[data-m]').dataset.m, d = denData();
  if (m === 's') { d.polevka.nazev = h.nazev; d.polevka.alergeny = [...h.alergeny]; }
  else { const j = d.jidla[+m]; j.nazev = h.nazev; j.alergeny = [...h.alergeny]; if (h.cena) j.cena = h.cena; j.bezMasa = h.bezMasa; }
  oznacZmenu(); vykresliEditor();
  toast(h.alergeny.length ? `Doplněno včetně alergenů ${h.alergeny.join(', ')}` : 'Doplněno');
}

/* ---------- Vložení textu ---------- */
const UKAZKA_TEXTU = `Pondělí
Polévka: Kulajda (1,3,7)
1. Segedínský guláš, houskový knedlík  145 Kč
2. Koprovka s vejcem, vařený brambor  135,-
3. Smažený kuřecí řízek, bramborová kaše  145,-

Úterý
Polévka: Frankfurtská
1. Španělský ptáček, dušená rýže 149,-
2. Ovocné knedlíky s tvarohem 129,-
3. Kuřecí přírodní řízek, dušená rýže 145,-

Středa
Polévka: Hrachová s uzeným masem
1. Hovězí guláš, houskový knedlík 149,-
2. Smažený sýr, vařený brambor, tatarka (1,3,7) 149,-
3. Pečené kuřecí stehno, rýže, kompot 145,-`;
const DNY_KLICE = ['pond', 'uter', 'stred', 'ctvrt', 'pat'];
function rozpoznej(text) {
  const out = []; let cur = null;
  text.split(/\r?\n/).forEach((radek) => {
    const r = radek.trim(); if (!r) return;
    const n = norm(r);
    const di = DNY_KLICE.findIndex((k) => n.startsWith(k));
    if (di >= 0 && r.length < 40) { cur = { i: di, polevka: { nazev: '', alergeny: [] }, jidla: [] }; out.push(cur); return; }
    if (!cur) return;
    let s = r, alergeny = [], cena = '';
    const ma = s.match(/\(\s*(?:a(?:lerg\w*)?[.:]?\s*)?(\d{1,2}(?:\s*,\s*\d{1,2})*)\s*\)/i);
    if (ma) { alergeny = ma[1].split(',').map((x) => +x.trim()).filter((x) => x >= 1 && x <= 14); s = s.replace(ma[0], ' '); }
    const mc = s.match(/(\d{2,4})\s*(?:,-|,–|,\s*-|kč|kc|czk)?\s*$/i);
    if (mc && /\D/.test(s.slice(0, mc.index))) { cena = +mc[1]; s = s.slice(0, mc.index); }
    s = s.replace(/[.…\s\-–]+$/, '').trim();
    const mp = s.match(/^pol[eé]vka\s*[:\-–]?\s*(.*)$/i);
    const doplnZHistorie = (nazev, typ) => HISTORIE.find((h) => h.typ === typ && norm(h.nazev) === norm(nazev));
    if (mp) { const h = doplnZHistorie(mp[1], 'polevka'); cur.polevka = { nazev: mp[1].trim(), alergeny: alergeny.length ? alergeny : h ? [...h.alergeny] : [] }; return; }
    const mj = s.match(/^(?:\d+\s*[.)]|[-•*])\s*(.+)$/);
    const nazev = (mj ? mj[1] : s).trim(); if (!nazev) return;
    const h = doplnZHistorie(nazev, 'jidlo');
    cur.jidla.push({ nazev, alergeny: alergeny.length ? alergeny : h ? [...h.alergeny] : [], cena: cena || (h && h.cena) || '', bezMasa: h ? h.bezMasa : false, zHistorie: !!h && !alergeny.length });
  });
  return out;
}
function ukazRozpoznane() {
  const r = rozpoznej($('#paste-text').value);
  $('#parsed').innerHTML = r.length ? r.map((d) => `<div><b>${DNY[d.i]} · ${d.jidla.length} jídla${d.polevka.nazev ? ' + polévka' : ''}</b>${d.polevka.nazev ? `Polévka: ${esc(d.polevka.nazev)}<br>` : ''}${d.jidla.map((j, n) => `${n + 1}. ${esc(j.nazev)}${j.cena ? ` · ${j.cena} Kč` : ''}${j.alergeny.length ? ` · alergeny ${j.alergeny.join(', ')}${j.zHistorie ? ' (doplněno)' : ''}` : ''}`).join('<br>')}</div>`).join('') : '<div>Zatím jsme nenašli žádný den. Každý den začněte jeho názvem, např. „Pondělí“.</div>';
  $('#paste-ok').disabled = !r.length;
}

/* ---------- Návrh menu z historie ---------- */
let nvSeed = 1, nvZamky = {}, nvNavrh = null;
const znamy = (nazev) => HISTORIE.find((h) => norm(h.nazev) === norm(nazev));
function vykresliNavrh() {
  const t = tyden();
  nvNavrh = NavrhTydne.navrhni(HISTORIE_MENU, t.od, { seed: nvSeed, zamcene: nvZamky });
  const a = datumDne(t.od, 0), b = datumDne(t.od, 4);
  $('#nv-title').textContent = `Návrh menu na ${a.getDate()}.–${fmt(b)}`;
  $('#nv-sub').textContent = 'Návrh vychází z toho, co se u vás opravdu vařilo: oblíbená jídla, roční období, co dlouho nebylo a pestrost týdne. Zamkněte, co se vám líbí, a zbytek nechte navrhnout znovu.';
  const prvni = new Date(HISTORIE_MENU[0].datum + 'T12:00:00');
  $('#nv-info').innerHTML = `<span class="badge">${nvNavrh.dniHistorie} dní historie od ${prvni.getMonth() + 1}/${prvni.getFullYear()}</span><span class="badge green">jídlo č. 2 vždy bez masa</span><span class="badge gold">nic se v týdnu neopakuje</span>`;
  const radek = (k, polozka, klic) => polozka ? `<div class="nv-row"><span class="k">${k}</span><div><b>${esc(polozka.nazev)}</b><small>${polozka.bezMasa ? '<span class="bm">bez masa · </span>' : ''}${esc(polozka.duvod)}</small></div><button type="button" class="lock${nvZamky[klic] ? ' on' : ''}" data-klic="${klic}" data-nazev="${esc(polozka.nazev)}" title="${nvZamky[klic] ? 'Odemknout' : 'Zamknout – při dalším návrhu zůstane'}">${nvZamky[klic] ? '🔒' : '🔓'}</button></div>` : '';
  $('#nv-days').innerHTML = nvNavrh.tyden.map((d, i) => `<div class="nv-day"><h3>${DNY[i]} ${fmt(d.datum)}</h3>${radek('P', d.polevka, `${i}-s`)}${d.jidla.map((j, n) => radek(n + 1, j, `${i}-${n + 1}`)).join('')}</div>`).join('');
}
function pouzijNavrh() {
  let bezAlergenu = 0;
  nvNavrh.tyden.forEach((d, i) => {
    const z = (n) => znamy(n) || {};
    const pol = z(d.polevka.nazev);
    tyden().dny[i] = {
      polevka: { nazev: d.polevka.nazev, alergeny: [...(pol.alergeny || [])] },
      jidla: d.jidla.map((j) => { const h = z(j.nazev); if (!(h.alergeny || []).length) bezAlergenu++; return { nazev: j.nazev, alergeny: [...(h.alergeny || [])], cena: h.cena || '', bezMasa: j.bezMasa }; })
    };
  });
  den = 0; otevrenyPicker = null; oznacZmenu(); vykresliEditor(); $('#dlg-navrh').close();
  toast(bezAlergenu ? `Návrh vložen. U ${bezAlergenu} jídel doplňte alergeny a cenu.` : 'Návrh vložen. Zkontrolujte a uložte.');
}

/* ---------- Tisk ---------- */
function tisk() {
  const t = tyden();
  $('#tisk').innerHTML = `<h1>Denní menu</h1><p class="sub">Restaurace Na Městečku · ${$('#week-label').textContent} · objednávky s sebou 516 472 188</p>` +
    t.dny.map((d, i) => `<div class="pday"><h2>${DNY[i]} ${fmt(datumDne(t.od, i))}</h2>${d.zavreno ? `<p>${esc(d.poznamka || 'Zavřeno')}</p>` : `${d.polevka.nazev ? `<p><span>Polévka: ${esc(d.polevka.nazev)} ${d.polevka.alergeny.length ? '(' + d.polevka.alergeny.join(', ') + ')' : ''}</span></p>` : ''}${d.jidla.filter((j) => j.nazev).map((j, n) => `<p><span>${n + 1}. ${esc(j.nazev)} ${j.alergeny.length ? '(' + j.alergeny.join(', ') + ')' : ''}</span><b>${kc(j.cena)}</b></p>`).join('')}`}</div>`).join('') +
    `<p class="foot">${esc(t.cenaPoznamka || '')} Alergeny: 1 lepek, 3 vejce, 4 ryby, 7 mléko, 9 celer, 10 hořčice …</p>`;
  window.print();
}

/* ---------- Jídelní lístek (zjednodušená ukázka) ---------- */
function vykresliListekAdmin() {
  $('#list-ed').innerHTML = LISTEK.map((k) => `<div class="list-cat"><h2>${esc(k.nazev)} <span class="badge">${k.polozky.length} položek</span></h2>${k.polozky.map((p) => `<div class="list-row"><span class="grip">⋮⋮</span><span>${esc(p.nazev)}</span><label class="price"><input value="${p.cena}" inputmode="numeric"></label></div>`).join('')}</div>`).join('');
}

/* ---------- Události ---------- */
function prepniPohled(v) {
  $$('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
  $$('.view-pane').forEach((p) => p.classList.toggle('on', p.id === 'v-' + v));
  $('.save-bar').style.display = v === 'menu' ? '' : 'none';
  window.scrollTo(0, 0);
}
document.addEventListener('DOMContentLoaded', async () => {
  if (RNM_SERVER) {
    try { await nactiZeServeru(); } catch (e) { $('#ed-body').innerHTML = `<p class="tip"><span>⚠️</span><span>${esc(e.message)}</span></p>`; return; }
    $('#b-reset').hidden = true;
    nactiPoptavky();
    $('#v-poptavky').addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-stav]'); if (!b) return;
      b.disabled = true;
      try { await rnmApi('/api/admin/poptavky/' + b.closest('[data-id]').dataset.id, { stav: b.dataset.stav }, 'PATCH'); } catch (err) { toast(err.message); }
      nactiPoptavky();
    });
    window.addEventListener('beforeunload', (e) => { if (spinave.size) { ulozKonceptyNaServer(); e.preventDefault(); } });
  } else nacti();
  vykresliEditor(); vykresliStavTydne(); vykresliListekAdmin();
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => prepniPohled(b.dataset.view)));

  $('#ed-tabs').addEventListener('click', (e) => { const b = e.target.closest('.day-tab'); if (!b) return; den = +b.dataset.i; otevrenyPicker = null; vykresliEditor(); });

  const body = $('#ed-body');
  body.addEventListener('input', (e) => {
    const el = e.target, k = el.dataset.k, box = el.closest('[data-m]'), d = denData();
    if (k === 'poznamka') { d.poznamka = el.value; }
    else if (k === 'name') { if (box.dataset.m === 's') d.polevka.nazev = el.value; else d.jidla[+box.dataset.m].nazev = el.value; ukazNavrhy(el); }
    else if (k === 'cena') { el.value = el.value.replace(/\D/g, ''); d.jidla[+box.dataset.m].cena = el.value ? +el.value : ''; }
    else return;
    oznacZmenu(); vykresliNahled(); vykresliTaby();
  });
  body.addEventListener('change', (e) => {
    const el = e.target, k = el.dataset.k, d = denData();
    if (k === 'zavreno') { d.zavreno = el.checked; oznacZmenu(); vykresliEditor(); }
    if (k === 'veg') { d.jidla[+el.closest('[data-m]').dataset.m].bezMasa = el.checked; oznacZmenu(); vykresliNahled(); }
  });
  body.addEventListener('focusin', (e) => { if (e.target.dataset.k === 'name') ukazNavrhy(e.target); });
  body.addEventListener('focusout', (e) => { if (e.target.dataset.k === 'name') { const l = e.target.nextElementSibling; setTimeout(() => l.classList.remove('open'), 160); } });
  body.addEventListener('keydown', (e) => {
    if (e.target.dataset.k !== 'name') return;
    const list = e.target.nextElementSibling, items = $$('li[data-i]', list);
    if (!list.classList.contains('open') || !items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); acIndex = (acIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((li, i) => li.classList.toggle('hl', i === acIndex)); }
    else if (e.key === 'Enter' && acIndex >= 0) { e.preventDefault(); vyberNavrh(e.target, HISTORIE[+items[acIndex].dataset.i]); }
    else if (e.key === 'Escape') list.classList.remove('open');
  });
  body.addEventListener('mousedown', (e) => {
    const li = e.target.closest('.ac-list li[data-i]'); if (!li) return;
    e.preventDefault(); vyberNavrh(li.closest('.ac').querySelector('input'), HISTORIE[+li.dataset.i]);
  });
  body.addEventListener('click', (e) => {
    const el = e.target.closest('[data-k]'); if (!el) return;
    const k = el.dataset.k, box = el.closest('[data-m]'), d = denData();
    if (k === 'add') { d.jidla.push({ nazev: '', alergeny: [], cena: '' }); oznacZmenu(); vykresliEditor(); $$('#ed-body .meal-ed input[data-k="name"]').pop().focus(); }
    if (k === 'del') { d.jidla.splice(+box.dataset.m, 1); otevrenyPicker = null; oznacZmenu(); vykresliEditor(); }
    if (k === 'algbtn') { otevrenyPicker = otevrenyPicker === box.dataset.m ? null : box.dataset.m; vykresliEditor(); }
    if (k === 'alg') {
      const a = box.dataset.m === 's' ? d.polevka.alergeny : d.jidla[+box.dataset.m].alergeny, n = +el.dataset.n, i = a.indexOf(n);
      if (i >= 0) a.splice(i, 1); else { a.push(n); a.sort((x, y) => x - y); }
      oznacZmenu(); vykresliEditor();
    }
  });

  const zmenTyden = (o) => {
    aktualni = posunDatum(aktualni, o * 7);
    if (!tydny[aktualni]) tydny[aktualni] = novyTyden(aktualni);
    den = 0; otevrenyPicker = null; zmeneno = false; ulozKoncept(); vykresliEditor(); vykresliStavTydne();
  };
  $('#prev').addEventListener('click', () => zmenTyden(-1));
  $('#next').addEventListener('click', () => zmenTyden(1));

  $('#b-copy').addEventListener('click', () => {
    const zdrojOd = posunDatum(aktualni, -7), zdroj = tydny[zdrojOd] || VYCHOZI_TYDEN;
    tydny[aktualni].dny = clone(zdroj.dny); tydny[aktualni].cenaPoznamka = zdroj.cenaPoznamka;
    oznacZmenu(); vykresliEditor(); toast(`Zkopírováno z týdne od ${fmt(datumDne(zdrojOd, 0))} – upravte, co se mění`);
  });
  $('#b-paste').addEventListener('click', () => { const t = $('#paste-text'); if (!t.value) t.value = UKAZKA_TEXTU; ukazRozpoznane(); $('#dlg-paste').showModal(); });
  $('#paste-text').addEventListener('input', ukazRozpoznane);
  $('#paste-cancel').addEventListener('click', () => $('#dlg-paste').close());
  $('#paste-ok').addEventListener('click', () => {
    const r = rozpoznej($('#paste-text').value);
    r.forEach((d) => { tyden().dny[d.i] = { polevka: d.polevka, jidla: d.jidla.map(({ zHistorie, ...j }) => j) }; });
    $('#dlg-paste').close(); den = r.length ? r[0].i : den; oznacZmenu(); vykresliEditor();
    toast(`Vloženo: ${r.map((d) => DNY_KRATCE[d.i]).join(', ')}. Zkontrolujte a uložte.`);
  });
  $('#b-print').addEventListener('click', tisk);
  $('#b-navrh').addEventListener('click', () => { nvZamky = {}; nvSeed = 1; vykresliNavrh(); $('#dlg-navrh').showModal(); });
  $('#nv-again').addEventListener('click', () => { nvSeed++; vykresliNavrh(); });
  $('#nv-cancel').addEventListener('click', () => $('#dlg-navrh').close());
  $('#nv-ok').addEventListener('click', pouzijNavrh);
  $('#nv-days').addEventListener('click', (e) => {
    const b = e.target.closest('.lock'); if (!b) return;
    if (nvZamky[b.dataset.klic]) delete nvZamky[b.dataset.klic]; else nvZamky[b.dataset.klic] = b.dataset.nazev;
    vykresliNavrh();
  });
  $('#b-reset').addEventListener('click', () => { try { localStorage.removeItem(KLIC_ADMIN); localStorage.removeItem(KLIC_TYDNE); } catch (e) { /* nic */ } location.reload(); });
  $('#b-save').addEventListener('click', async () => {
    const t = clone(tyden());
    t.dny.forEach((d) => { d.jidla = d.jidla.filter((j) => j.nazev.trim()); });
    if (RNM_SERVER) {
      const b = $('#b-save'); b.disabled = true;
      try {
        const r = await rnmApi(`/api/admin/tydny/${aktualni}/zverejnit`, { tyden: t });
        spinave.delete(aktualni); clearTimeout(konceptCasovac); if (spinave.size) ulozKonceptyNaServer();
        stavy[aktualni] = Object.assign({}, stavy[aktualni] || {}, { zverejneno: true, rozpracovano: false, zverejnenoKdy: r.zverejnenoKdy });
        zmeneno = false; vykresliStavTydne(); toast('✓ Uloženo. Menu je na webu.');
      } catch (e) { toast('Nepodařilo se zveřejnit: ' + e.message); }
      b.disabled = false;
      return;
    }
    try { localStorage.setItem(KLIC_TYDNE, JSON.stringify(t)); } catch (e) { /* nic */ }
    zmeneno = false; const s = $('#status'); s.textContent = 'Zveřejněno právě teď'; s.classList.remove('draft'); ulozKoncept();
    if (typeof Ucty !== 'undefined') Ucty.zapis(`Zveřejnění denního menu na ${$('#week-label').textContent}`);
    toast('✓ Uloženo. Menu je na webu.');
  });

  // Jen pro screenshoty návrhu: admin.html#naseptavac / #vlozit / #poptavky
  if (location.hash === '#naseptavac') {
    const i = $('#ed-body .meal-ed input[data-k="name"]'); i.value = 'guláš'; i.focus(); ukazNavrhy(i);
    if (innerWidth < 1000) i.closest('.meal-ed').scrollIntoView({ block: 'center' });
  }
  if (location.hash === '#vlozit') $('#b-paste').click();
  if (location.hash === '#navrh') { zmenTyden(1); $('#b-navrh').click(); }
  if (location.hash === '#poptavky') prepniPohled('poptavky');
});
