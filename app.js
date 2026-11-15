/* Restaurace Na Městečku – ukázková data a chování návrhu.
   V hotovém webu přijdou data z administrace (databáze), tady jsou v souboru
   a změny z admin.html se pro ukázku ukládají do localStorage prohlížeče. */

const ALERGENY = ['lepek', 'korýši', 'vejce', 'ryby', 'arašídy', 'sója', 'mléko', 'skořápkové plody', 'celer', 'hořčice', 'sezam', 'oxid siřičitý', 'vlčí bob', 'měkkýši'];
const DNY = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const DNY_KRATCE = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const KLIC_TYDNE = 'rnm-tyden-v1';

/* Pondělí je opsané ze současného webu, zbytek týdne a ceny jsou ukázka. */
const VYCHOZI_TYDEN = {
  od: '2026-11-16',
  cenaPoznamka: 'Polévka je v ceně menu. Menu podáváme 11:00–14:00, také s sebou.',
  dny: [
    { polevka: { nazev: 'Brokolicová', alergeny: [7] }, jidla: [
      { nazev: 'Vepřový guláš, houskový knedlík', alergeny: [1, 3, 7], cena: 145 },
      { nazev: 'Smažený květák, vařený brambor, tatarka', alergeny: [1, 3, 7], cena: 139, bezMasa: true },
      { nazev: 'Kuřecí kebab, hranolky, tatarka', alergeny: [1, 3], cena: 149 } ] },
    { polevka: { nazev: 'Hovězí vývar s nudlemi', alergeny: [1, 3, 9] }, jidla: [
      { nazev: 'Svíčková na smetaně, houskový knedlík, brusinky', alergeny: [1, 3, 7, 9, 10], cena: 159 },
      { nazev: 'Kuřecí nudličky na kari, dušená rýže', alergeny: [7], cena: 145 },
      { nazev: 'Bramboráky se zelím a uzeným masem', alergeny: [1, 3], cena: 139 } ] },
    { polevka: { nazev: 'Gulášová', alergeny: [1] }, jidla: [
      { nazev: 'Pečené kuřecí stehno, rýže, kompot', alergeny: [], cena: 145 },
      { nazev: 'Těstoviny se špenátem a balkánským sýrem', alergeny: [1, 3, 7], cena: 139, bezMasa: true },
      { nazev: 'Vepřový řízek, bramborový salát', alergeny: [1, 3, 9, 10], cena: 155 } ] },
    { polevka: { nazev: 'Česnečka se sýrem a krutony', alergeny: [1, 7] }, jidla: [
      { nazev: 'Plněné papriky, rajská omáčka, houskový knedlík', alergeny: [1, 3, 7], cena: 149 },
      { nazev: 'Smažený sýr, vařený brambor, tatarka', alergeny: [1, 3, 7], cena: 149, bezMasa: true },
      { nazev: 'Hovězí tokáň, těstoviny', alergeny: [1, 3], cena: 149 } ] },
    { polevka: { nazev: 'Zeleninová s kapáním', alergeny: [1, 3, 9] }, jidla: [
      { nazev: 'Vepřová krkovice na grilu, opékané brambory', alergeny: [10], cena: 155 },
      { nazev: 'Rybí filé, bramborová kaše', alergeny: [1, 3, 4, 7], cena: 149 },
      { nazev: 'Sladké buchtičky se šodó', alergeny: [1, 3, 7], cena: 129, bezMasa: true } ] }
  ]
};

/* Stálý jídelní lístek – přepsaný z naskenovaných stran současného webu. */
const LISTEK = [
  { id: 'speciality', nazev: 'Speciality podniku', polozky: [
    { g: '300 g', nazev: 'Grill mix', popis: 'marinovaný kuřecí a vepřový steak s opečenou slaninou', en: 'chicken + pork steak with bacon', a: [1, 10], cena: 180 },
    { g: '200 g', nazev: 'Kapsa paní Kristýnky', popis: 'smažený kuřecí řízek plněný šunkou a eidamem', en: 'chicken schnitzel filled with ham and cheese', a: [1, 3, 7], cena: 180 },
    { g: '200 g', nazev: 'Grilované kuřecí a vepřové medailonky', en: 'grilled chicken + pork fillet', a: [1], cena: 155 },
    { g: '200 g', nazev: 'Smažené DUO', popis: '100 g vepřový řízek + 100 g kuřecí řízek', en: 'pork schnitzel + chicken schnitzel', a: [1, 3], cena: 155 },
    { g: '150 g', nazev: 'Grilovaný vepřový steak se smaženými cibulovými kroužky (5 ks)', en: 'pork steak, onion rings', a: [1, 3], cena: 155 } ] },
  { id: 'vikend', nazev: 'Víkendová nabídka', pozn: 'Sobota a neděle', polozky: [
    { g: '', nazev: 'Hovězí vývar s játrovými knedlíčky a nudlemi', en: 'beef broth with liver dumplings and noodles', a: [], cena: 55, polevka: true },
    { g: '100 g', nazev: 'Vepřové výpečky, zelí, houskový knedlík', en: 'roasted pork, cabbage, dumplings', a: [1, 3, 7], cena: 170 },
    { g: '100 g', nazev: 'Vepřový guláš, houskový knedlík', en: 'pork goulash, dumplings', a: [1, 3, 7], cena: 170 },
    { g: '100 g', nazev: 'Labužnický guláš, bramboráčky', en: 'gourmet goulash, potato pancakes', a: [1, 3, 7], cena: 190 },
    { g: '200 g', nazev: 'Grilované kuřecí a vepřové medailonky, hranolky, salát coleslaw', en: 'grilled chicken + pork fillet, french fries, coleslaw', a: [1], cena: 210 },
    { g: '250 g', nazev: 'Pečené kachní stehno, zelí, houskový knedlík', en: 'roasted duck leg, cabbage, dumplings', a: [1, 3, 7], cena: 220 },
    { g: '250 g', nazev: 'Pečené kachní stehno na pomerančích, hranolky', en: 'roasted duck leg in orange, french fries', a: [1], cena: 220 } ] },
  { id: 'minutky', nazev: 'Minutková jídla', polozky: [
    { g: '150 g', nazev: 'Smažený kuřecí řízek', en: 'fried chicken breast', a: [1, 3], cena: 135 },
    { g: '150 g', nazev: 'Smažený řízek z vepřové kotlety', en: 'pork schnitzel', a: [1, 3], cena: 135 },
    { g: '150 g', nazev: 'Kuřecí medailonky na másle', en: 'chicken breast on butter', a: [1, 7], cena: 140 },
    { g: '150 g', nazev: 'Grilovaný kuřecí steak', en: 'chicken steak', a: [1], cena: 140 },
    { g: '150 g', nazev: 'Grilovaný vepřový steak na pepři', en: 'pork steak with pepper', a: [1], cena: 140 } ],
    pozn2: 'Ke steakům doporučujeme BBQ nebo sladkou chilli omáčku (30 Kč).' },
  { id: 'bezmasa', nazev: 'Bezmasá jídla', polozky: [
    { g: '130 g', nazev: 'Smažený sýr, tatarská omáčka', en: 'fried cheese, tartar sauce', a: [1, 3, 7], cena: 140, bezMasa: true },
    { g: '120 g', nazev: 'Smažený hermelín, tatarská omáčka', en: 'fried Hermelín cheese, tartar sauce', a: [1, 3, 7], cena: 140, bezMasa: true } ] },
  { id: 'pizza', nazev: 'Pizza', pozn: 'průměr 33 cm', polozky: [
    { g: '', nazev: 'Margarita', popis: 'tomato, sýr', a: [1, 7], cena: 165, bezMasa: true },
    { g: '', nazev: 'Šunková', popis: 'tomato, sýr, šunka', a: [1, 7], cena: 170 },
    { g: '', nazev: 'Salámová', popis: 'tomato, sýr, salám', a: [1, 7], cena: 170 },
    { g: '', nazev: 'Hawai', popis: 'tomato, sýr, šunka, ananas', a: [1, 7], cena: 180 },
    { g: '', nazev: 'Selská', popis: 'tomato, sýr, slanina, cibule', a: [1, 7], cena: 180 },
    { g: '', nazev: 'Picante', popis: 'tomato, sýr, salám, slanina, feferonky, cibule', a: [1, 7], cena: 180 },
    { g: '', nazev: 'Quattro formaggi', popis: 'tomato, 4 druhy sýrů', a: [1, 7], cena: 180, bezMasa: true } ],
    pozn2: 'Pizzu i jídla připravíme s sebou, krabička na pizzu 15 Kč. Objednávky na 516 472 188.' },
  { id: 'prilohy', nazev: 'Přílohy a omáčky', polozky: [
    { g: '200 g', nazev: 'Vařený brambor', en: 'boiled potatoes', a: [], cena: 45, bezMasa: true },
    { g: '200 g', nazev: 'Opékaný brambor', en: 'baked potatoes', a: [], cena: 45, bezMasa: true },
    { g: '200 g', nazev: 'Smažené hranolky', en: 'french fries', a: [], cena: 45, bezMasa: true },
    { g: '200 g', nazev: 'Bramborový salát', en: 'potato salad', a: [3, 9, 10], cena: 45, bezMasa: true },
    { g: '170 g', nazev: 'Houskový knedlík', en: 'dumplings', a: [1, 3, 7], cena: 35, bezMasa: true },
    { g: '200 g', nazev: 'Bramboráčky', en: 'potato pancakes', a: [1, 3, 7], cena: 50, bezMasa: true },
    { g: '10 ks', nazev: 'Smažené cibulové kroužky', en: 'fried onion rings', a: [1, 3], cena: 50, bezMasa: true },
    { g: '1 ks', nazev: 'Pečivo (rohlík, chléb)', en: 'bread', a: [1], cena: 5, bezMasa: true },
    { g: '', nazev: 'Zeleninová obloha', en: 'vegetable garnish', a: [], cena: 20, bezMasa: true },
    { g: '50 g', nazev: 'Tatarská omáčka, kečup', en: 'tartar sauce, ketchup', a: [3], cena: 25, bezMasa: true },
    { g: '50 g', nazev: 'BBQ omáčka, sladká chilli omáčka', a: [], cena: 30, bezMasa: true } ] },
  { id: 'salaty', nazev: 'Saláty', polozky: [
    { g: '200 g', nazev: 'Míchaný salát', popis: 'podle sezonní nabídky', en: 'mixed seasonal salad', a: [], cena: 60, bezMasa: true },
    { g: '200 g', nazev: 'Zelný salát s cibulí', en: 'cabbage salad with onion', a: [], cena: 40, bezMasa: true } ] },
  { id: 'dezerty', nazev: 'Dezerty', polozky: [
    { g: '', nazev: 'Zmrzlinový pohár s ovocem a šlehačkou', en: 'ice-cream sundae with fruit and cream', a: [7], cena: 60, bezMasa: true },
    { g: '', nazev: 'Zmrzlina se šlehačkou', en: 'ice-cream with cream', a: [7], cena: 50, bezMasa: true } ],
    pozn2: 'Za poloviční porce účtujeme 2/3 z ceny pokrmu.' }
];

/* Otevírací doba: index 0 = neděle (jako Date.getDay) */
const OTEVRENO = { 0: [10, 21], 1: [10, 22], 2: [10, 22], 3: [10, 22], 4: [10, 22], 5: [10, 22], 6: [10, 22] };

/* ---------- Pomocné funkce ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kc = (n) => (n || n === 0) && n !== '' ? `${n} Kč` : '';
function datumDne(od, i) { const d = new Date(od + 'T12:00:00'); d.setDate(d.getDate() + i); return d; }
function stejnyDen(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmt(d) { return `${d.getDate()}. ${d.getMonth() + 1}.`; }
function alergenyHtml(a) {
  if (!a || !a.length) return '';
  return `<span class="alg" title="Alergeny: ${a.map((n) => `${n} ${ALERGENY[n - 1]}`).join(', ')}">${a.map((n) => `<span>${n}</span>`).join('')}</span>`;
}
function nactiTyden() {
  try { const s = localStorage.getItem(KLIC_TYDNE); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště jedeme z výchozích dat */ }
  return VYCHOZI_TYDEN;
}

/* ---------- Karta denního menu ---------- */
function vykresliDenniMenu(root) {
  const tyden = nactiTyden();
  const dnes = new Date();
  let vybrany = tyden.dny.findIndex((_, i) => stejnyDen(datumDne(tyden.od, i), dnes));
  if (vybrany < 0) {
    // mimo týden (víkend): ukážeme nejbližší další den, jinak pondělí
    const dalsi = tyden.dny.findIndex((_, i) => datumDne(tyden.od, i) > dnes);
    vybrany = dalsi >= 0 ? dalsi : 0;
  }
  const zitra = new Date(dnes); zitra.setDate(zitra.getDate() + 1);
  const tabs = $('.day-tabs', root), body = $('.daily-body', root);
  tabs.innerHTML = tyden.dny.map((_, i) => {
    const d = datumDne(tyden.od, i);
    return `<button class="day-tab${stejnyDen(d, dnes) ? ' today' : ''}" role="tab" aria-selected="${i === vybrany}" data-i="${i}"><b>${DNY_KRATCE[i]}</b><span>${fmt(d)}</span></button>`;
  }).join('');
  const ukaz = (i) => {
    $$('.day-tab', tabs).forEach((t) => t.setAttribute('aria-selected', String(+t.dataset.i === i)));
    const d = datumDne(tyden.od, i), den = tyden.dny[i];
    const stitek = stejnyDen(d, dnes) ? '<span class="badge green">Dnes</span>' : stejnyDen(d, zitra) ? '<span class="badge gold">Zítra</span>' : '';
    if (!den || den.zavreno || !den.jidla || !den.jidla.length) {
      body.innerHTML = `<div class="daily-date">${DNY[i]} ${fmt(d)} ${stitek}</div><div class="daily-empty">${den && den.zavreno ? esc(den.poznamka || 'Tento den je zavřeno.') : 'Menu na tento den připravujeme.'}</div>`;
      return;
    }
    body.innerHTML = `
      <div class="daily-date">${DNY[i]} ${fmt(d)} ${stitek}</div>
      ${den.polevka && den.polevka.nazev ? `<div class="soup"><span class="k">Polévka</span><span class="v">${esc(den.polevka.nazev)}</span>${alergenyHtml(den.polevka.alergeny)}</div>` : ''}
      <ol class="meals">${den.jidla.map((j, n) => `
        <li class="meal"><span class="meal-no">${n + 1}</span>
          <div><div class="meal-name">${esc(j.nazev)}</div>
            <div class="meal-meta">${j.bezMasa ? '<span class="badge green">Bez masa</span>' : ''}${alergenyHtml(j.alergeny)}</div></div>
          <span class="meal-price num">${kc(j.cena)}</span></li>`).join('')}
      </ol>`;
  };
  tabs.addEventListener('click', (e) => { const b = e.target.closest('.day-tab'); if (b) ukaz(+b.dataset.i); });
  ukaz(vybrany);
  const pozn = $('.daily-note', root); if (pozn && tyden.cenaPoznamka) pozn.textContent = tyden.cenaPoznamka;
  const rozsah = $('.daily-range', root);
  if (rozsah) rozsah.textContent = `${fmt(datumDne(tyden.od, 0))} – ${fmt(datumDne(tyden.od, tyden.dny.length - 1))} ${datumDne(tyden.od, 0).getFullYear()}`;
}

/* ---------- Otevřeno / zavřeno ---------- */
function stavOtevreni() {
  const now = new Date(), [od, doo] = OTEVRENO[now.getDay()], h = now.getHours() + now.getMinutes() / 60;
  const otevreno = h >= od && h < doo;
  $$('.open-pill').forEach((p) => {
    p.classList.toggle('closed', !otevreno);
    $('span', p).textContent = otevreno ? `Teď otevřeno · do ${doo}:00` : `Teď zavřeno · otevíráme v ${od}:00`;
  });
  $$('.hours tr[data-d]').forEach((tr) => tr.classList.toggle('now', tr.dataset.d.split(',').includes(String(now.getDay()))));
}

/* ---------- Jídelní lístek ---------- */
function vykresliListek(root) {
  root.innerHTML = LISTEK.map((k) => `
    <section class="menu-cat${k.id === 'pizza' ? ' pizza' : ''}" id="${k.id}" data-cat>
      <div class="menu-cat-head"><h2>${esc(k.nazev)}</h2>${k.pozn ? `<small>${esc(k.pozn)}</small>` : ''}</div>
      <ul class="items">${k.polozky.map((p) => `
        <li class="item" data-veg="${p.bezMasa ? 1 : 0}" data-text="${esc((p.nazev + ' ' + (p.popis || '') + ' ' + (p.en || '')).toLowerCase())}">
          <div class="item-name">${esc(p.nazev)}</div>
          <div class="item-price num">${kc(p.cena)}</div>
          ${p.popis ? `<div class="item-desc">${esc(p.popis)}</div>` : ''}
          ${p.en ? `<div class="item-en" lang="en">${esc(p.en)}</div>` : ''}
          <div class="item-meta">${p.g ? `<span>${esc(p.g)}</span>` : ''}${p.bezMasa ? '<span class="badge green">Bez masa</span>' : ''}${alergenyHtml(p.a)}</div>
        </li>`).join('')}
      </ul>
      ${k.pozn2 ? `<p class="cat-note">${esc(k.pozn2)}</p>` : ''}
    </section>`).join('');

  const hledat = $('#hledat'), veg = $('#bezmasa');
  const filtr = () => {
    const q = (hledat.value || '').trim().toLowerCase(), v = veg.checked;
    $$('.item', root).forEach((li) => li.classList.toggle('hidden', (v && li.dataset.veg !== '1') || (q && !li.dataset.text.includes(q))));
    $$('[data-cat]', root).forEach((s) => s.classList.toggle('hidden', !$$('.item:not(.hidden)', s).length));
    $('#nic').classList.toggle('hidden', !!$$('.item:not(.hidden)', root).length);
  };
  hledat.addEventListener('input', filtr); veg.addEventListener('change', filtr);

  // zvýraznění kategorie v liště podle toho, kde uživatel je
  const chips = $$('.chips .chip');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting || window.scrollY < 40) return; // nahoře stránky zůstává zvýrazněná první kategorie
      chips.forEach((c) => {
        const on = c.getAttribute('href') === '#' + en.target.id;
        c.classList.toggle('active', on);
        if (on) c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-cat]', root).forEach((s) => io.observe(s));
}

/* ---------- Společné ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const t = $('.menu-toggle'), mn = $('.mobile-nav');
  if (t && mn) t.addEventListener('click', () => { const o = mn.classList.toggle('open'); t.setAttribute('aria-expanded', String(o)); });
  $$('[data-daily]').forEach(vykresliDenniMenu);
  const l = $('#listek'); if (l) vykresliListek(l);
  stavOtevreni();
  // Přepínač variant úvodu (jen v návrhu)
  const vb = $('.variant-bar');
  if (vb) {
    const oznac = () => $$('button', vb).forEach((b) => b.classList.toggle('on', b.dataset.v === document.documentElement.dataset.hero));
    vb.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      document.documentElement.dataset.hero = b.dataset.v; oznac();
      try { localStorage.setItem('rnm-uvod', b.dataset.v); } catch (er) { /* bez úložiště */ }
    });
    if (new URLSearchParams(location.search).has('bez-prepinace')) document.documentElement.classList.add('bez-prepinace');
    oznac();
  }
  const f = $('#poptavka');
  if (f) f.addEventListener('submit', (e) => { e.preventDefault(); $('.thanks').classList.add('show'); $('.thanks').scrollIntoView({ block: 'center', behavior: 'smooth' }); });
});

/* ---------- Mapa parkování (stránka pro zájezdy) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const el = $('#park-map');
  if (!el || typeof MAPA_OKOLI === 'undefined') return;
  const M = MAPA_OKOLI, seznam = $('#park-list');
  const polozky = [
    { typ: 'bus', ikona: 'B', nazev: `Zastávka ${M.zastavka.nazev}`, popis: 'vysazení skupiny před vchodem', poloha: M.zastavka.poloha, vzd: 30 },
    ...M.parkoviste.filter((p) => p.typ !== 'menší').map((p) => ({ typ: 'p', ikona: 'P', nazev: p.nazev, popis: `${p.pesky} min pěšky`, poloha: p.stred, vzd: p.vzdalenost, obrys: p.obrys })),
    { typ: 'p', ikona: 'P', nazev: `Další ${M.parkoviste.filter((p) => p.typ === 'menší').length} menší parkoviště`, popis: 'do 3 minut pěšky', poloha: null, vzd: null },
    { typ: 'castle', ikona: '♜', nazev: M.zamek.nazev, popis: `${M.zamek.pesky} min pěšky`, poloha: M.zamek.poloha, vzd: M.zamek.vzdalenost }
  ];
  if (seznam) seznam.innerHTML = polozky.map((p, i) => `<li data-i="${i}"><span class="ico ${p.typ === 'p' ? '' : p.typ}">${p.ikona}</span><div><b>${esc(p.nazev)}</b><small>${esc(p.popis)}</small></div><span class="dist">${p.vzd ? p.vzd + ' m' : ''}</span></li>`).join('');

  const start = () => {
    if (typeof L === 'undefined') { el.innerHTML = '<p style="padding:16px;color:var(--muted)">Mapu se nepodařilo načíst.</p>'; return; }
    const mapa = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapa);
    const pin = (cls, txt) => L.divIcon({ className: '', html: `<div class="pin ${cls}">${txt}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
    const vrstvy = [];
    M.parkoviste.forEach((p) => {
      L.polygon(p.obrys, { color: '#2563a8', weight: 2, fillColor: '#3b82f6', fillOpacity: p.typ === 'menší' ? .25 : .4 }).addTo(mapa).bindTooltip(`${p.nazev} · ${p.vzdalenost} m`);
      if (p.typ !== 'menší') vrstvy.push(L.marker(p.stred, { icon: pin('p', 'P') }).addTo(mapa).bindPopup(`<b>${esc(p.nazev)}</b><br>${p.vzdalenost} m · ${p.pesky} min pěšky`));
    });
    L.marker(M.zastavka.poloha, { icon: pin('bus', 'B') }).addTo(mapa).bindPopup(`<b>Zastávka ${esc(M.zastavka.nazev)}</b><br>vysazení skupiny`);
    L.marker(M.zamek.poloha, { icon: pin('castle', '♜') }).addTo(mapa).bindPopup(`<b>${esc(M.zamek.nazev)}</b><br>${M.zamek.vzdalenost} m · ${M.zamek.pesky} min pěšky`);
    L.marker(M.restaurace, { icon: pin('rest', '★'), zIndexOffset: 1000 }).addTo(mapa).bindPopup('<b>Restaurace Na Městečku</b><br>Komenského 589').openPopup();
    // restaurace a zámek s hlavními parkovišti; menší parkoviště dál od centra se dají odscrollovat
    mapa.fitBounds(L.latLngBounds([M.restaurace, M.zamek.poloha, M.zastavka.poloha, ...M.parkoviste.filter((p) => p.typ === 'hlavní').map((p) => p.stred)]), { padding: [36, 36], maxZoom: 18 });
    if (seznam) seznam.addEventListener('click', (e) => {
      const li = e.target.closest('li'); const p = li && polozky[+li.dataset.i];
      if (p && p.poloha) { mapa.setView(p.poloha, 18); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    });
  };
  if (typeof L !== 'undefined') start(); else window.addEventListener('load', start);
});
