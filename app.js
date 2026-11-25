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
  cenaPoznamka: 'Polévka je v ceně, výdej 10–15 h, i s sebou.',
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
    { g: '100 g', nazev: 'Moravský vrabec, zelí, houskový knedlík', en: 'Moravian roast pork, cabbage, dumplings', a: [1, 3, 7], cena: 170 },
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
/* Ostrý web (Cloudflare): stránky mají <html data-server>, data jdou přes /api/*.
   Ukázka na GitHub Pages: všechno v prohlížeči (localStorage). */
const RNM_SERVER = document.documentElement.hasAttribute('data-server');
async function rnmApi(cesta, data, metoda) {
  const m = metoda || (data === undefined ? 'GET' : 'POST');
  let r;
  try {
    r = await fetch(cesta, { method: m, credentials: 'same-origin', headers: m === 'GET' ? {} : { 'content-type': 'application/json', 'x-rnm': '1' }, body: m === 'GET' ? undefined : JSON.stringify(data || {}) });
  } catch (e) { throw new Error('Nepodařilo se spojit se serverem. Zkontrolujte připojení k internetu.'); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && location.pathname.indexOf('admin') >= 0) location.replace('prihlaseni.html?zpet=admin.html');
  if (!r.ok) throw new Error(j.chyba || 'Něco se nepovedlo. Zkuste to prosím znovu.');
  return j;
}
function nactiTyden() {
  // ?nahled=1: živý náhled z administrace (rozpracovaný, ještě neuložený týden)
  const nahled = new URLSearchParams(location.search).has('nahled');
  // Ostrý web: zveřejněné menu vloží server rovnou do stránky
  if (!nahled && window.RNM_TYDEN) return window.RNM_TYDEN;
  const klic = nahled ? 'rnm-tyden-nahled' : KLIC_TYDNE;
  try { const s = localStorage.getItem(klic); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště jedeme z výchozích dat */ }
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
/* Jídelní lístek: v ostrém webu ho vloží server (window.RNM_LISTEK), v ukázce může být upravený v administraci (localStorage). */
const KLIC_LISTEK = 'rnm-listek-v1';
function aktualniListek() {
  if (window.RNM_LISTEK) return window.RNM_LISTEK;
  if (!RNM_SERVER) { try { const s = localStorage.getItem(KLIC_LISTEK); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště */ } }
  return LISTEK;
}
function vykresliListek(root) {
  // Skrytá jídla (dočasně se nevaří) se nezobrazují, prázdná kategorie taky ne
  const listek = aktualniListek().map((k) => ({ ...k, polozky: k.polozky.filter((p) => !p.skryto) })).filter((k) => k.polozky.length);
  root.innerHTML = listek.map((k) => `
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
  // Odkaz na kategorii, která teď nic nenabízí, se schová
  $$('.chips .chip').forEach((c) => { c.style.display = document.getElementById((c.getAttribute('href') || '').slice(1)) ? '' : 'none'; });

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

  // Klik na kategorii: nadpis kategorie zastaví těsně pod hlavičkou a lištou kategorií (nezajede pod ně)
  const skocNa = (id, plynule) => {
    const cil = document.getElementById(id); if (!cil) return;
    const prekryv = ($('.hlavicka') ? $('.hlavicka').offsetHeight : 0) + ($('.nastroje') ? $('.nastroje').offsetHeight : 0) + 12;
    window.scrollTo({ top: cil.getBoundingClientRect().top + window.scrollY - prekryv, behavior: plynule ? 'smooth' : 'auto' });
  };
  chips.forEach((c) => c.addEventListener('click', (e) => {
    e.preventDefault();
    const id = c.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id);
    chips.forEach((x) => x.classList.toggle('active', x === c));
    skocNa(id, !matchMedia('(prefers-reduced-motion: reduce)').matches);
  }));
  if (location.hash) requestAnimationFrame(() => skocNa(location.hash.slice(1), false));
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
  const f = $('#poptavka'), th = $('.thanks');
  if (f && th) f.addEventListener('submit', (e) => { e.preventDefault(); th.classList.add('show'); th.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
});

/* ---------- Mapa parkování (stránka pro zájezdy) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const el = $('#park-map');
  if (!el || typeof MAPA_OKOLI === 'undefined') return;
  const M = MAPA_OKOLI, seznam = $('#park-list');
  const polozky = [
    { typ: 'bus', ikona: 'B', nazev: `Zastávka ${M.zastavka.nazev}`, popis: 'vysazení skupiny před vchodem', poloha: M.zastavka.poloha, vzd: 30 },
    ...M.parkoviste.filter((p) => p.typ !== 'menší').sort((a, b) => a.vzdalenost - b.vzdalenost).map((p) => ({ typ: 'p', ikona: 'P', nazev: p.nazev, popis: p.vzdalenost <= 20 ? 'pár kroků od vchodu' : `${p.pesky} min pěšky`, poloha: p.stred, vzd: p.vzdalenost, obrys: p.obrys })),
    ...(() => { const n = M.parkoviste.filter((p) => p.typ === 'menší').length; return n ? [{ typ: 'p', ikona: 'P', nazev: n === 1 ? 'Další menší parkoviště' : `Další ${n} menší parkoviště`, popis: 'do 3 minut pěšky', poloha: null, vzd: null }] : []; })(),
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

/* =========================================================================
   Nový vzhled (web.css): tabule dnešního menu, stav podle času, recenze, mapka
   ========================================================================= */
const MESICE_2P = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const DNY_MALE = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const V_DEN = ['v neděli', 'v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu'];
const TEL_MENU = '516 472 188';
// ?cas=2026-11-16T11:30 nastaví čas pro ukázku (jinak skutečný čas)
function ted() { const q = new URLSearchParams(location.search).get('cas'); const d = q ? new Date(q) : new Date(); return isNaN(d) ? new Date() : d; }
const algText = (a) => (a && a.length ? 'A ' + a.join(', ') : '');
const ikonaTel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';

function vykresliTabuli(root) {
  const tyden = nactiTyden(), now = ted();
  const dnes = new Date(now); dnes.setHours(12, 0, 0, 0);
  const vsedni = (d) => d.getDay() >= 1 && d.getDay() <= 5;
  // Do 15:00 ve všední den dnešek, jinak nejbližší další všední den
  const cil = new Date(dnes);
  if (now.getHours() >= 15 || !vsedni(cil)) { do { cil.setDate(cil.getDate() + 1); } while (!vsedni(cil)); }
  const zitra = new Date(dnes); zitra.setDate(zitra.getDate() + 1);
  const kdy = stejnyDen(cil, dnes) ? 'Dnes' : stejnyDen(cil, zitra) ? 'Zítra' : V_DEN[cil.getDay()][0].toUpperCase() + V_DEN[cil.getDay()].slice(1);
  const datumText = `${cil.getDate()}. ${MESICE_2P[cil.getMonth()]}`;
  const titul = kdy === "Dnes" || kdy === "Zítra" ? `${kdy} – ${DNY_MALE[cil.getDay()]} ${datumText}` : `${kdy} ${datumText}`;
  const idx = tyden.dny.findIndex((_, i) => stejnyDen(datumDne(tyden.od, i), cil));
  const den = tyden.dny[idx];
  let obsah;
  if (!den || !den.jidla || !den.jidla.length || den.zavreno) {
    obsah = `<p class="tabule-prazdna">${den && den.zavreno ? esc(den.poznamka || 'Tento den máme zavřeno.') : 'Menu na tento den ještě připravujeme. Zavolejte nám, rádi poradíme.'}</p>`;
  } else {
    obsah = `<ol>
      ${den.polevka && den.polevka.nazev ? `<li class="polevka"><span class="jidlo">Polévka: <b>${esc(den.polevka.nazev)}</b></span><span class="cena"></span>${den.polevka.alergeny && den.polevka.alergeny.length ? `<span class="drobne">${algText(den.polevka.alergeny)}</span>` : ''}</li>` : ''}
      ${den.jidla.map((j, n) => `<li><span class="jidlo"><span class="poradi">${n + 1}</span>${esc(j.nazev)}</span><span class="cena">${kc(j.cena)}</span><span class="drobne">${j.bezMasa ? '<span class="bezmasa">bez masa</span>' : ''}${j.alergeny && j.alergeny.length ? `<span>${algText(j.alergeny)}</span>` : ''}</span></li>`).join('')}
    </ol>`;
  }
  // Na úvodu je nadpis velký nad menu („Dnes vaříme“) a tlačítko u nadpisu; jinde (lístek) má tabule vlastní hlavičku
  const hNadpis = root.closest('.uvod') && $('[data-nadpis]');
  if (hNadpis) {
    hNadpis.textContent = `${kdy} vaříme`;
    const pod = $('[data-podnadpis]');
    if (pod) pod.textContent = `${DNY_MALE[cil.getDay()][0].toUpperCase() + DNY_MALE[cil.getDay()].slice(1)} ${datumText}. ${tyden.cenaPoznamka || ''}`.trim();
    root.innerHTML = obsah;
  } else {
    root.innerHTML = `
    <div class="tabule-hlava"><h2>${titul}</h2>${tyden.cenaPoznamka ? `<p>${esc(tyden.cenaPoznamka)}</p>` : ''}</div>
    ${obsah}
    <a class="btn btn-plna" href="tel:+420516472188">${ikonaTel}Objednat · ${TEL_MENU}</a>`;
  }

  // Zbytek týdne jako rozbalovací seznam
  const tyd = $('[data-tyden]');
  if (tyd) {
    const ostatni = tyden.dny.map((d, i) => ({ d, i, datum: datumDne(tyden.od, i) })).filter((x) => x.i !== idx && x.d && x.d.jidla && x.d.jidla.length);
    const a = datumDne(tyden.od, 0), b = datumDne(tyden.od, tyden.dny.length - 1);
    tyd.innerHTML = ostatni.length ? `<summary>Celý týden ${a.getDate()}.–${fmt(b)}</summary><div class="tyden-dny">${ostatni.map(({ d, datum }) => `
      <div class="tyden-den"><h3>${DNY[(datum.getDay() + 6) % 7]} ${fmt(datum)}</h3><ul>
        ${d.polevka && d.polevka.nazev ? `<li><span>Polévka: ${esc(d.polevka.nazev)}</span><span></span></li>` : ''}
        ${d.jidla.map((j, n) => `<li><span>${n + 1}. ${esc(j.nazev)}</span><span class="cena">${kc(j.cena)}</span></li>`).join('')}
      </ul></div>`).join('')}</div>` : '';
    tyd.hidden = !ostatni.length;
  }
}

/* ---------- Provoz: otevírací doba, výjimky (svátky, dovolená) a oznámení ----------
   Ostrý web: data vloží server (window.RNM_PROVOZ). Ukázka: z administrace přes localStorage. Jinak výchozí doba. */
const KLIC_PROVOZ = 'rnm-provoz-v1';
const hhmm = (h) => `${String(h).padStart(2, '0')}:00`;
const VYCHOZI_PROVOZ = { doba: Object.fromEntries(Object.entries(OTEVRENO).map(([d, [a, b]]) => [d, { od: hhmm(a), do: hhmm(b) }])), vyjimky: [], oznameni: { text: '', od: '', do: '' } };
function aktualniProvoz() {
  if (window.RNM_PROVOZ) return window.RNM_PROVOZ;
  if (!RNM_SERVER) { try { const s = localStorage.getItem(KLIC_PROVOZ); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště */ } }
  return VYCHOZI_PROVOZ;
}
const isoDen = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const naHodiny = (s) => { const [a, b] = s.split(':'); return +a + +b / 60; };
const casText = (s) => s.replace(/^0/, '').replace(/:00$/, '');          // "10:00" → "10", "09:30" → "9:30"
// Otevírací doba v konkrétní den: { od, do, text? } nebo null (zavřeno), výjimka má přednost
function dobaDne(d, provoz = aktualniProvoz()) {
  const v = (provoz.vyjimky || []).find((x) => x.datum === isoDen(d));
  if (v) return v.zavreno ? null : { od: v.od, do: v.do, text: v.text, vyjimka: true };
  return provoz.doba[d.getDay()] || null;
}
const casDlouze = (s) => s.replace(/^0/, '');                            // "09:30" → "9:30", "10:00" → "10:00"
function vykresliStav() {
  const now = ted(), h = now.getHours() + now.getMinutes() / 60, dnes = dobaDne(now);
  const vDnes = (aktualniProvoz().vyjimky || []).find((x) => x.datum === isoDen(now));
  const otevreno = !!dnes && h >= naHodiny(dnes.od) && h < naHodiny(dnes.do);
  const obedy = otevreno && !vDnes && now.getDay() >= 1 && now.getDay() <= 5 && h >= 10 && h < 15;
  // nejbližší otevření: dnes později, nebo některý z dalších 14 dní
  let dalsi = '';
  if (!otevreno) {
    for (let i = 0; i <= 14 && !dalsi; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i);
      const x = dobaDne(d);
      if (!x || (i === 0 && h >= naHodiny(x.od))) continue;
      dalsi = i === 0 ? `otevíráme v ${casDlouze(x.od)}` : i === 1 ? `otevíráme zítra v ${casDlouze(x.od)}` : `otevíráme ${V_DEN[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}. v ${casDlouze(x.od)}`;
    }
  }
  $$('[data-stav]').forEach((el) => {
    el.classList.toggle('zavreno', !otevreno);
    el.textContent = !otevreno ? `Teď zavřeno${vDnes && vDnes.text ? ` (${vDnes.text})` : ''}${dalsi ? ' · ' + dalsi : ''}`
      : obedy ? 'Teď vaříme obědy, menu do 15:00' : `Otevřeno, dnes do ${casDlouze(dnes.do)}`;
  });
  vykresliDobu(now);
  vykresliOznameni(now);
}
// Tabulka otevírací doby (sloučí po sobě jdoucí dny se stejnou dobou) a nejbližší výjimky
function vykresliDobu(now) {
  const provoz = aktualniProvoz(), poradi = [1, 2, 3, 4, 5, 6, 0];
  const klic = (d) => (provoz.doba[d] ? provoz.doba[d].od + '–' + provoz.doba[d].do : 'zavřeno');
  const skupiny = [];
  poradi.forEach((d) => { const s = skupiny[skupiny.length - 1]; if (s && s.klic === klic(d)) s.dny.push(d); else skupiny.push({ klic: klic(d), dny: [d] }); });
  const nazev = (dny) => (dny.length === 1 ? DNY[(dny[0] + 6) % 7] : `${DNY[(dny[0] + 6) % 7]} – ${DNY[(dny[dny.length - 1] + 6) % 7].toLowerCase()}`);
  const radek = (s) => { const x = provoz.doba[s.dny[0]]; return x ? `${x.od} – ${x.do}` : 'zavřeno'; };
  const zKratce = (dny) => (dny.length === 1 ? DNY_KRATCE[(dny[0] + 6) % 7] : `${DNY_KRATCE[(dny[0] + 6) % 7]}–${DNY_KRATCE[(dny[dny.length - 1] + 6) % 7]}`);
  const dnesD = String(now.getDay());
  $$('table.doba').forEach((t) => {
    const dnesek = isoDen(now), za30 = isoDen(new Date(now.getTime() + 30 * 864e5));
    const vyj = (provoz.vyjimky || []).filter((v) => v.datum >= dnesek && v.datum <= za30);
    t.innerHTML = '<caption class="sr">Otevírací doba</caption>' + skupiny.map((s) => `<tr data-d="${s.dny.join(',')}"${s.dny.map(String).includes(dnesD) ? ' class="dnes"' : ''}><td>${nazev(s.dny)}</td><td>${radek(s)}</td></tr>`).join('')
      + vyj.map((v) => { const d = new Date(v.datum + 'T12:00:00'); return `<tr class="vyjimka${v.datum === dnesek ? ' dnes' : ''}"><td>${d.getDate()}. ${d.getMonth() + 1}.${v.text ? ' ' + esc(v.text) : ''}</td><td>${v.zavreno ? 'zavřeno' : `${v.od} – ${v.do}`}</td></tr>`; }).join('');
  });
  $$('[data-doba-kratce]').forEach((el) => {
    el.textContent = skupiny.map((s) => `${zKratce(s.dny)} ${s.klic === 'zavřeno' ? 'zavřeno' : `${casText(provoz.doba[s.dny[0]].od)}–${casText(provoz.doba[s.dny[0]].do)}`}`).join(', ');
  });
}
// Oznámení nahoře na stránce (např. „24. 12. zavřeno“, „Dovolená 1.–7. 8.“), platí v zadaném rozsahu dnů
function vykresliOznameni(now) {
  const o = aktualniProvoz().oznameni || {}, dnes = isoDen(now);
  const plati = o.text && (!o.od || o.od <= dnes) && (!o.do || o.do >= dnes);
  let el = $('.oznameni');
  if (!plati) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.className = 'oznameni'; el.setAttribute('role', 'status'); const h = $('.hlavicka'); if (h) h.after(el); else document.body.prepend(el); }
  el.innerHTML = `<div class="wrap">${esc(o.text)}</div>`;
}

/* ---------- Galerie na úvodu (fotky z administrace) ---------- */
function vykresliGalerii() {
  const g = window.RNM_GALERIE || (!RNM_SERVER ? (() => { try { return JSON.parse(localStorage.getItem('rnm-galerie-v1')); } catch (e) { return null; } })() : null);
  const box = $('.fotky[data-galerie]');
  if (!g || !box) return;
  box.innerHTML = g.map((f) => `<img src="${esc(f.src || '/foto/' + f.id + '.jpg')}" alt="${esc(f.alt || '')}" loading="lazy">`).join('');
}

/* ---------- Nabídka rautů s sebou (stránka Rauty, upravuje se v administraci) ---------- */
const KLIC_RAUTY = 'rnm-rauty-v1';
const VYCHOZI_RAUTY = {
  nadpis: 'Nabídka rautů s sebou',
  polozky: ['Kuřecí a vepřové rautové řízečky', 'Sýrové smažáčky', 'Pečené kuřecí malé špízy', 'Pečené kuřecí paličky', 'Grilovaný kuřecí kebab',
    'Guláš (vepřový/hovězí)', 'Pečená vepřová žebra na medu', 'Pečené vepřové maso na česneku', 'Hovězí tatarák + topinky',
    'Studené obložené mísy (uzeninová, sýrová, zeleninová)', 'Saláty – šopský, coleslaw, bramborový atd.'],
  cenaOd: 120, cenaDo: 400, poznamka: 'Rádi poradíme a vypracujeme individuální cenovou nabídku.',
};
function aktualniRauty() {
  if (window.RNM_RAUTY) return window.RNM_RAUTY;
  if (!RNM_SERVER) { try { const s = localStorage.getItem(KLIC_RAUTY); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště */ } }
  return VYCHOZI_RAUTY;
}
function vykresliRauty() {
  const box = $('[data-rauty]');
  if (!box || (!window.RNM_RAUTY && RNM_SERVER)) return;   // bez dat zůstává text ze stránky
  const n = aktualniRauty();
  const cena = n.cenaOd && n.cenaDo ? `Cena od <b>${kc(n.cenaOd)}</b> do <b>${kc(n.cenaDo)}</b> na osobu podle velikosti rautu`
    : n.cenaOd ? `Cena od <b>${kc(n.cenaOd)}</b> na osobu` : '';
  $('h2', box).textContent = n.nadpis;
  $('.nabidka-karta', box).innerHTML = `<ul class="rauty-seznam">${n.polozky.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${cena ? `<p class="nabidka-cena"><span>${cena}</span></p>` : ''}`;
  $('.nabidka-pozn', box).textContent = n.poznamka || '';
}

/* ---------- Nabídka pro skupinové zájezdy (stránka Zájezdy a oslavy, upravuje se v administraci) ---------- */
const KLIC_SKUPINY = 'rnm-skupiny-v1';
const VYCHOZI_SKUPINY = {
  nadpis: 'Naše nabídka pro skupinové zájezdy',
  polevka: 'Hovězí vývar s játrovými knedlíčky a nudlemi',
  jidla: ['Moravský vrabec, zelí, houskový knedlík', 'Kuřecí steak z grilu, šťouchaný brambor, zeleninová obloha', 'Smažený vepřový řízek, bramborový salát'],
  cenaBez: 180, cenaS: 200, poznamka: 'Menu upravíme podle vás, i pro vegetariány a děti.',
};
function aktualniSkupiny() {
  if (window.RNM_SKUPINY) return window.RNM_SKUPINY;
  if (!RNM_SERVER) { try { const s = localStorage.getItem(KLIC_SKUPINY); if (s) return JSON.parse(s); } catch (e) { /* bez úložiště */ } }
  return VYCHOZI_SKUPINY;
}
function vykresliSkupinyMenu() {
  const box = $('[data-skupiny-menu]');
  if (!box || (!window.RNM_SKUPINY && RNM_SERVER)) return;   // bez dat zůstává text ze stránky
  const n = aktualniSkupiny(), ceny = [];
  if (n.cenaBez) ceny.push(`<span><b>${kc(n.cenaBez)}</b> za porci${n.polevka ? ' bez polévky' : ''}</span>`);
  if (n.cenaS && n.polevka) ceny.push(`<span><b>${kc(n.cenaS)}</b> za porci s polévkou</span>`);
  $('h2, h3', box).textContent = n.nadpis;
  $('.nabidka-karta', box).innerHTML = `
    ${n.polevka ? `<div class="polevka-radek"><span class="k">Polévka</span><b>${esc(n.polevka)}</b></div>` : ''}
    <ol class="jidla">${n.jidla.map((j, i) => `<li><span class="c">${i + 1}</span><span class="n">${esc(j)}</span></li>`).join('')}</ol>
    ${ceny.length ? `<p class="nabidka-cena">${ceny.join('')}</p>` : ''}`;
  $('.nabidka-pozn', box).textContent = n.poznamka || '';
}

/* Hodnocení hostů. V ostrém webu se čísla obnovují automaticky (Google Places API, Firmy.cz).
   Na úvod jde vždy zdroj s vyšší známkou; při shodě ten s víc hodnoceními.
   Zdroj s méně než MIN_HODNOCENI recenzemi se nebere, aby číslo bylo reprezentativní. */
const HODNOCENI = [
  { zdroj: 'Googlu', hvezdy: 4.1, pocet: 642, url: 'https://www.google.com/maps/search/?api=1&query=Restaurace+Na+M%C4%9Bste%C4%8Dku+Lysice' },
  { zdroj: 'Mapy.cz', hvezdy: 4.3, pocet: 121, url: 'https://www.firmy.cz/detail/565171-restaurace-na-mestecku-lysice.html' },
];
const MIN_HODNOCENI = 50;
const hvezdyText = (h) => h.toFixed(1).replace('.', ',') + ' ★';
function nejlepsiHodnoceni() {
  return HODNOCENI.filter((h) => h.pocet >= MIN_HODNOCENI)
    .sort((a, b) => b.hvezdy - a.hvezdy || b.pocet - a.pocet)[0] || null;
}
function vykresliHodnoceni() {
  const nej = nejlepsiHodnoceni();
  $$('[data-hodnoceni-nej]').forEach((el) => {
    if (!nej) { el.hidden = true; return; }
    el.innerHTML = `<dt>${hvezdyText(nej.hvezdy)}</dt><dd><a href="#recenze">${nej.pocet} hodnocení na ${esc(nej.zdroj)}</a></dd>`;
  });
}

/* Víkend (sobota + neděle) je v týdnu šestá položka dny[5]: speciality jen na tento termín. */
const VIKEND = 5;
const maObsah = (d) => !!d && (d.zavreno || !!(d.polevka && d.polevka.nazev) || (d.jidla || []).some((j) => j.nazev && String(j.nazev).trim()));
const datumyDne = (od, i) => (i === VIKEND ? `${datumDne(od, 5).getDate()}.–${fmt(datumDne(od, 6))}` : fmt(datumDne(od, i)));
const nazevDne = (od, i) => (i === VIKEND ? `Víkend ${datumyDne(od, i)}` : `${DNY[i]} ${fmt(datumDne(od, i))}`);
const zkratkaDne = (i) => (i === VIKEND ? 'So–Ne' : DNY_KRATCE[i]);

/* Karta denního menu s dlaždicemi Po–Pá. Předvybraný je dnešek, po 15:00 a o víkendu nejbližší další všední den. */
function vykresliKartu(root) {
  const tyden = nactiTyden(), now = ted();
  const dnes = new Date(now); dnes.setHours(12, 0, 0, 0);
  const zitra = new Date(dnes); zitra.setDate(zitra.getDate() + 1);
  const vsedni = (d) => d.getDay() >= 1 && d.getDay() <= 5;
  const cil = new Date(dnes);
  if (now.getHours() >= 15 || !vsedni(cil)) { do { cil.setDate(cil.getDate() + 1); } while (!vsedni(cil)); }
  // Dlaždice: Po–Pá, a víkend jen když má vyplněné speciality
  const vikend = maObsah(tyden.dny[VIKEND]);
  const dlazdice = [0, 1, 2, 3, 4].concat(vikend ? [VIKEND] : []);
  let vybrany = [0, 1, 2, 3, 4].find((i) => stejnyDen(datumDne(tyden.od, i), cil));
  if (vybrany === undefined) { const dalsi = [0, 1, 2, 3, 4].find((i) => datumDne(tyden.od, i) >= dnes); vybrany = dalsi !== undefined ? dalsi : 0; }
  // V pátek po 15:00 a o víkendu se ukáže víkendová nabídka, pokud je
  const so = datumDne(tyden.od, 5), ne = datumDne(tyden.od, 6), pa = datumDne(tyden.od, 4);
  const vikendDnes = stejnyDen(dnes, so) || stejnyDen(dnes, ne);
  if (vikend && (vikendDnes || (stejnyDen(dnes, pa) && now.getHours() >= 15))) vybrany = VIKEND;
  const a = datumDne(tyden.od, 0), b = vikend ? ne : pa;
  root.innerHTML = `
    <div class="karta-hlava"><h2>Denní menu</h2><small>${a.getDate()}.–${fmt(b)} ${b.getFullYear()}</small></div>
    <div class="dny${vikend ? ' s-vikendem' : ''}" role="tablist" aria-label="Den v týdnu">${dlazdice.map((i) => { const dnesek = i === VIKEND ? vikendDnes : stejnyDen(datumDne(tyden.od, i), dnes); return `<button class="den-btn${dnesek ? ' dnes' : ''}${i === VIKEND ? ' vikend' : ''}" role="tab" aria-selected="${i === vybrany}" data-i="${i}"><b>${zkratkaDne(i)}</b><span>${datumyDne(tyden.od, i)}</span></button>`; }).join('')}</div>
    <div class="karta-telo" role="tabpanel"></div>
    <div class="karta-pata">
      <a class="btn btn-plna" href="tel:+420516472188" data-objednat>${ikonaTel}Objednat s sebou · ${TEL_MENU}</a>
      ${tyden.cenaPoznamka ? `<p>${esc(tyden.cenaPoznamka)}</p>` : ''}
    </div>`;
  const telo = $('.karta-telo', root);
  const ukaz = (i) => {
    $$('.den-btn', root).forEach((t) => t.setAttribute('aria-selected', String(+t.dataset.i === i)));
    const d = datumDne(tyden.od, i), den = tyden.dny[i];
    const jeDnes = i === VIKEND ? vikendDnes : stejnyDen(d, dnes), jeZitra = i === VIKEND ? stejnyDen(zitra, so) : stejnyDen(d, zitra);
    const stitek = jeDnes ? '<span class="stitek">Dnes</span>' : jeZitra ? '<span class="stitek">Zítra</span>' : '';
    const hlava = `<div class="karta-den">${nazevDne(tyden.od, i)} ${stitek}</div>`;
    // Svátek nebo dovolená z administrace (Fotky a texty → výjimky) má přednost před menu
    const vyj = i === VIKEND ? null : (aktualniProvoz().vyjimky || []).find((v) => v.datum === isoDen(d) && v.zavreno);
    if (vyj) { telo.innerHTML = hlava + `<p class="karta-prazdna">Tento den máme zavřeno${vyj.text ? ` (${esc(vyj.text)})` : ''}.</p>`; return; }
    if (!den || den.zavreno || !den.jidla || !den.jidla.length) {
      telo.innerHTML = hlava + `<p class="karta-prazdna">${den && den.zavreno ? esc(den.poznamka || 'Tento den máme zavřeno.') : 'Menu na tento den ještě připravujeme.'}</p>`;
      return;
    }
    telo.innerHTML = hlava + `
      ${den.polevka && den.polevka.nazev ? `<div class="polevka-radek"><span class="k">Polévka</span><b>${esc(den.polevka.nazev)}</b>${den.polevka.alergeny && den.polevka.alergeny.length ? `<span class="a">${algText(den.polevka.alergeny)}</span>` : ''}</div>` : ''}
      <ol class="jidla">${den.jidla.map((j, n) => `<li><span class="c">${n + 1}</span><span class="n">${esc(j.nazev)}</span><span class="cena">${kc(j.cena)}</span><span class="i">${j.bezMasa ? '<span class="bezmasa">bez masa</span>' : ''}${j.alergeny && j.alergeny.length ? `<span>${algText(j.alergeny)}</span>` : ''}</span></li>`).join('')}</ol>`;
  };
  $('.dny', root).addEventListener('click', (e) => { const btn = e.target.closest('.den-btn'); if (btn) ukaz(+btn.dataset.i); });
  ukaz(vybrany);
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('js');
  $$('[data-tabule]').forEach(vykresliTabuli);
  $$('[data-karta]').forEach(vykresliKartu);
  vykresliStav();
  vykresliGalerii();
  vykresliSkupinyMenu();
  vykresliRauty();
  vykresliHodnoceni();
  const t = $('.menu-tlacitko'), mn = $('.mobilni-nav');
  if (t && mn) t.addEventListener('click', () => { const o = mn.classList.toggle('open'); t.setAttribute('aria-expanded', String(o)); });
  // Jediný animovaný moment: podtržení věty hosta se jednou dokreslí
  const z = $$('.zvyrazni');
  if (z.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('ted'); io.unobserve(e.target); } }), { threshold: 0.8 });
    z.forEach((el) => io.observe(el));
  } else z.forEach((el) => el.classList.add('ted'));
  // Spodní lišta jen tehdy, když není vidět tlačítko Objednat na tabuli (žádné dvě stejné výzvy najednou)
  const tb = $('.uvod [data-objednat]');
  if (tb && 'IntersectionObserver' in window) new IntersectionObserver((en) => document.body.classList.toggle('lista-skryta', en[0].isIntersecting)).observe(tb);
  // Malá mapa v kontaktu (OpenStreetMap, bez cookies)
  const mk = $('#mapka');
  const startMapky = () => {
    if (!mk || typeof L === 'undefined') return;
    const pos = [49.4520863, 16.5374298];
    const m = L.map(mk, { scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false }).setView(pos, 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    L.marker(pos, { icon: L.divIcon({ className: '', html: '<div class="pin rest">★</div>', iconSize: [36, 36], iconAnchor: [18, 18] }) }).addTo(m).bindPopup('<b>Restaurace Na Městečku</b><br>Komenského 589, Lysice');
  };
  if (mk) { if (typeof L !== 'undefined') startMapky(); else window.addEventListener('load', startMapky); }
  // Formulář poptávky: v ostrém webu se uloží na server a objeví se v administraci
  const f = $('#poptavka-form');
  // Odkaz „Poptat raut“ (skupiny.html?typ=raut) rovnou vybere druh akce
  const predvyber = new URLSearchParams(location.search).get('typ');
  // Rauty: pole „Kam raut dovézt“ jen při dovozu
  if (f) { const prepniDovoz = () => { const d = f.querySelector('[name="doprava"]:checked'); $$('[data-jen-dovoz]', f).forEach((el) => { el.style.display = d && d.value === 'Dovoz' ? '' : 'none'; }); }; f.addEventListener('change', (e) => { if (e.target.name === 'doprava') prepniDovoz(); }); prepniDovoz(); }
  if (f && predvyber) { const r = f.querySelector(`[name="typ"][value="${CSS.escape(predvyber)}"]`); if (r) r.checked = true; }
  if (f) f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = $('.dekujeme'), chybaEl = $('#poptavka-chyba'), btn = f.querySelector('button[type="submit"]');
    if (RNM_SERVER) {
      const typ = f.querySelector('[name="typ"]:checked'), doprava = f.querySelector('[name="doprava"]:checked');
      const v = (id) => ($('#' + id) || {}).value || '';
      btn.disabled = true; if (chybaEl) chybaEl.textContent = '';
      try {
        await rnmApi('/api/poptavka', { typ: typ ? typ.parentElement.textContent.trim() : (f.dataset.typ || ''), doprava: doprava ? doprava.value : '', misto: doprava && doprava.value === 'Dovoz' ? v('f-misto') : '', datum: v('f-datum'), cas: v('f-cas'), osob: v('f-osob'), jmeno: v('f-jmeno'), tel: v('f-tel'), mail: v('f-mail'), zprava: v('f-zprava'), web: v('f-web') });
      } catch (err) {
        btn.disabled = false;
        if (chybaEl) { chybaEl.textContent = err.message; chybaEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); } else alert(err.message);
        return;
      }
      f.reset(); btn.disabled = false;
    }
    d.classList.add('show'); d.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
});
