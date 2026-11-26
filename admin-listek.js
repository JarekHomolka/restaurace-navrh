/* Administrace: editor jídelního lístku.
   Ostrý web: lístek je na serveru (/api/admin/listek), po „Uložit a zveřejnit“ je hned na webu.
   Ukázka: ukládá se do prohlížeče (localStorage) a listek.html ho odtud ukáže. */

(function () {
  const ed = $('#list-ed');
  if (!ed) return;
  const kopie = (o) => JSON.parse(JSON.stringify(o));
  let listek = null, otevrena = null, zmeneno = false, upraveno = null, upravil = null;

  const stav = (t, koncept) => { const s = $('#lst-stav'); s.textContent = t; s.classList.toggle('draft', !!koncept); };
  const kdy = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}. v ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function ukazStav() {
    if (zmeneno) return stav('Neuložené změny', true);
    stav(upraveno ? `Zveřejněno · upraveno ${kdy(upraveno)}${upravil ? ', ' + upravil : ''}` : 'Zveřejněno');
  }
  function oznac() { zmeneno = true; ukazStav(); }

  async function nacti() {
    if (RNM_SERVER) {
      const r = await rnmApi('/api/admin/listek');
      listek = r.listek || kopie(LISTEK); upraveno = r.upraveno || null; upravil = r.upravil || null;
    } else {
      try { const s = localStorage.getItem(KLIC_LISTEK); listek = s ? JSON.parse(s) : kopie(LISTEK); } catch (e) { listek = kopie(LISTEK); }
    }
  }

  /* ---------- vykreslení ---------- */
  function shrnuti(p) {
    return [p.g, p.popis].filter(Boolean).join(' · ') || (p.nazev ? '' : 'Doplňte název');
  }
  function radek(p, ki, pi) {
    const klic = `${ki}:${pi}`, open = otevrena === klic;
    return `<div class="lr${p.skryto ? ' skryta' : ''}${open ? ' open' : ''}" data-k="${ki}" data-p="${pi}">
      <div class="lr-hlava">
        <span class="lr-tah" data-tah title="Přetáhněte pro změnu pořadí" aria-hidden="true">⋮⋮</span>
        <button type="button" class="lr-nazev" data-a="otevrit" aria-expanded="${open}">
          <b>${esc(p.nazev || 'Nové jídlo')}</b>${shrnuti(p) ? `<small>${esc(shrnuti(p))}</small>` : ''}${p.skryto ? '<span class="badge seda">Skryto</span>' : ''}
        </button>
        <label class="price"><span class="sr">Cena ${esc(p.nazev)}</span><input data-f="cena" inputmode="numeric" value="${esc(p.cena)}" placeholder="0"></label>
      </div>
      ${open ? `<div class="lr-detail">
        <div class="field"><label for="lf-nazev">Název</label><input id="lf-nazev" data-f="nazev" value="${esc(p.nazev)}" placeholder="Např. Smažený kuřecí řízek"></div>
        <div class="field"><label for="lf-popis">Popis (nepovinné)</label><input id="lf-popis" data-f="popis" value="${esc(p.popis || '')}" placeholder="Např. plněný šunkou a eidamem"></div>
        <div class="lr-2">
          <div class="field"><label for="lf-g">Gramáž</label><input id="lf-g" data-f="g" value="${esc(p.g || '')}" placeholder="150 g"></div>
          <div class="field"><label for="lf-en">Anglicky (pro turisty)</label><input id="lf-en" data-f="en" value="${esc(p.en || '')}" placeholder="fried chicken breast" lang="en"></div>
        </div>
        <div class="field"><span class="lbl">Alergeny</span>
          <div class="alg-pick">${ALERGENY.map((n, i) => `<button type="button" class="${(p.a || []).includes(i + 1) ? 'on' : ''}" data-a="alg" data-n="${i + 1}" title="${n}" aria-pressed="${(p.a || []).includes(i + 1)}">${i + 1}<small>${n}</small></button>`).join('')}</div>
        </div>
        <div class="meal-line2">
          <label class="veg"><input type="checkbox" data-f="bezMasa" ${p.bezMasa ? 'checked' : ''}>Bez masa</label>
          <label class="veg"><input type="checkbox" data-f="skryto" ${p.skryto ? 'checked' : ''}>Dočasně nenabízíme (skrýt z webu)</label>
        </div>
        <div class="lr-akce">
          <button type="button" class="btn btn-ghost btn-sm" data-a="nahoru" ${pi === 0 ? 'disabled' : ''}>↑ Výš</button>
          <button type="button" class="btn btn-ghost btn-sm" data-a="dolu" ${pi === listek[ki].polozky.length - 1 ? 'disabled' : ''}>↓ Níž</button>
          <button type="button" class="btn btn-ghost btn-sm" data-a="hotovo">Hotovo</button>
          <button type="button" class="btn btn-ghost btn-sm smazat" data-a="smazat">Smazat</button>
        </div>
      </div>` : ''}
    </div>`;
  }
  function vykresli() {
    ed.innerHTML = listek.map((k, ki) => {
      const skryte = k.polozky.filter((p) => p.skryto).length;
      return `<div class="list-cat" id="lk-${esc(k.id)}">
        <h2>${esc(k.nazev)} <span class="badge">${k.polozky.length} položek${skryte ? ` · ${skryte} skryt${skryte === 1 ? 'á' : skryte < 5 ? 'é' : 'ých'}` : ''}</span></h2>
        ${k.pozn ? `<p class="lc-pozn">${esc(k.pozn)}</p>` : ''}
        ${k.polozky.map((p, pi) => radek(p, ki, pi)).join('')}
        <button type="button" class="add-meal" data-a="pridat" data-k="${ki}">+ Přidat do „${esc(k.nazev)}“</button>
      </div>`;
    }).join('');
  }
  const polozka = (el) => { const r = el.closest('.lr'); return r ? { r, k: +r.dataset.k, p: +r.dataset.p, x: listek[+r.dataset.k].polozky[+r.dataset.p] } : null; };

  /* ---------- události ---------- */
  ed.addEventListener('input', (e) => {
    const f = e.target.dataset.f, it = polozka(e.target); if (!f || !it) return;
    if (f === 'cena') { e.target.value = e.target.value.replace(/\D/g, ''); it.x.cena = e.target.value ? +e.target.value : ''; }
    else if (['nazev', 'popis', 'g', 'en'].includes(f)) {
      it.x[f] = e.target.value;
      const b = it.r.querySelector('.lr-nazev b'); if (b) b.textContent = it.x.nazev || 'Nové jídlo';
    } else return;
    oznac();
  });
  ed.addEventListener('change', (e) => {
    const f = e.target.dataset.f, it = polozka(e.target); if (!it || !['bezMasa', 'skryto'].includes(f)) return;
    it.x[f] = e.target.checked; oznac(); vykresli();
    if (f === 'skryto') toast(e.target.checked ? 'Jídlo se po uložení na webu skryje.' : 'Jídlo se po uložení na webu zase ukáže.');
  });
  ed.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'pridat') {
      const ki = +b.dataset.k, kat = listek[ki];
      kat.polozky.push({ g: '', nazev: '', a: [], cena: '', bezMasa: kat.id === 'bezmasa' });
      otevrena = `${ki}:${kat.polozky.length - 1}`; oznac(); vykresli();
      const i = $('#lf-nazev'); if (i) { i.focus(); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    const it = polozka(b); if (!it) return;
    const pol = listek[it.k].polozky;
    if (a === 'otevrit' || a === 'hotovo') {
      const klic = `${it.k}:${it.p}`;
      // Prázdné nové jídlo se při zavření zahodí
      if (otevrena === klic && !String(it.x.nazev || '').trim()) { pol.splice(it.p, 1); otevrena = null; vykresli(); return; }
      otevrena = otevrena === klic || a === 'hotovo' ? null : klic; vykresli();
      if (otevrena) { const r = ed.querySelector('.lr.open'); if (r) r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      return;
    }
    if (a === 'alg') {
      const n = +b.dataset.n, s = new Set(it.x.a || []);
      if (s.has(n)) s.delete(n); else s.add(n);
      it.x.a = [...s].sort((m, o) => m - o); oznac(); vykresli(); return;
    }
    if (a === 'nahoru' || a === 'dolu') {
      const kam = it.p + (a === 'nahoru' ? -1 : 1); if (kam < 0 || kam >= pol.length) return;
      [pol[it.p], pol[kam]] = [pol[kam], pol[it.p]];
      otevrena = `${it.k}:${kam}`; oznac(); vykresli(); return;
    }
    if (a === 'smazat') {
      if (!confirm(`Smazat „${it.x.nazev || 'nové jídlo'}“ z lístku? Pokud ho jen dočasně nevaříte, stačí ho skrýt.`)) return;
      pol.splice(it.p, 1); otevrena = null; oznac(); vykresli(); toast('Smazáno. Na webu zmizí po uložení.');
    }
  });

  /* ---------- Návrh alergenů a anglického názvu pro nové jídlo ----------
     1) stejné jídlo už v lístku nebo v historii denního menu, 2) jinak podle slov v názvu (slovník níže).
     Je to jen návrh: doplní se do prázdných polí a obsluha ho zkontroluje. */
  const ALG_PRAVIDLA = [
    [/rizek|rizk|smaz|obal|kapsa|duo\b/, [1, 3]], [/knedl/, [1, 3, 7]], [/testovin|spaget|lasagn|noky|nudl|pizza|toast|topink|pecivo|chleb|housk|bageta|tortil|wrap|burger|langos|palacink|kolac|zakusk|dort/, [1]],
    [/syr|smetan|masl|kase|eidam|hermelin|mozzarel|parmaz|jogurt|mlek|tvaroh|niva|gorgonz|bechamel/, [7]], [/tatar(ska|ka)|majonez|coleslaw|bramborov\w* salat|vlassk/, [3, 10]],
    [/tatarak/, [3, 10]], [/horcic/, [10]], [/celer|vyvar|polevk/, [9]], [/ryb|losos|pstruh|tunak|treska|kapr|filet z/, [4]], [/kreve|krab/, [2]], [/slavk|mekk|chobot/, [14]],
    [/orech|mandl|pistac|kesu/, [8]], [/arasid/, [5]], [/sezam/, [11]], [/soj/, [6]], [/vejc|vajic|omelet|hemenex/, [3]], [/gulas|svickov|rajsk|koprov|segedin|stroganov|(smetanov|houbov|pepr|knedlikov)\w* omack/, [1, 7, 9]],
    [/pizza/, [1, 7]], [/vino|na vine/, [12]],
    // polévky a běžná jídla denního menu
    [/kulajd/, [1, 3, 7, 9]], [/bramborac|gulasov|frankfurt|drstk|cesnec|zelnac|kminov|hovezi polevk/, [1, 9]], [/hrach|cockov|fazol|zeleninov/, [9]],
    [/rajsk\w* polevk|krem|kremov/, [1, 7, 9]], [/nudl/, [1, 3]], [/spenat|kase/, [7]], [/omack/, [1]], [/strouhank|trojobal|parizsk|sekan|karbanat|fasirk/, [1, 3]], [/syrem|sypan\w* syr/, [7]],
    // běžná jídla poledního menu (typický recept – obsluha vždy zkontroluje)
    [/na pepri|pepr/, [1, 7]], [/flamendr/, [1, 10]], [/na paprice|paprikov/, [1, 7]], [/kari|curry/, [1, 7]], [/cin(a|sk)|kung|sojov/, [1, 6]],
    [/rizot/, [7, 9]], [/bolonsk|bolognes/, [1, 9]], [/halusk/, [1, 3, 7]], [/francouzsk\w* brambor|zapekan|zapecen/, [3, 7]], [/bramborak/, [1, 3, 7]],
    [/spanelsk\w* ptac|plnen\w* paprik|moravsk\w* vrabec|veprova pecen/, [1]], [/znojemsk|okurkov\w* omack/, [1, 10]], [/lecho|zelenin\w* smes/, []],
    [/kotlet|plnen\w* kure|cordon/, [1, 3, 7]], [/livanc|livance|vdolk|buchtick|knedliky ovocn|ovocne knedl|kynute/, [1, 3, 7]], [/lasagn|gnocchi|carbonar/, [1, 3, 7]],
    [/fazolk|cuketov|dyn/, [7]], [/hamburg|cheeseburg/, [1, 3, 7, 10, 11]], [/tortill|burrito|quesadill/, [1, 7]],
  ];
  const EN_FRAZE = [
    ['houskovy knedlik', 'bread dumplings'], ['bramborovy knedlik', 'potato dumplings'], ['tatarska omacka', 'tartar sauce'], ['stouchany brambor', 'mashed potatoes'],
    ['vareny brambor', 'boiled potatoes'], ['bramborova kase', 'mashed potatoes'], ['bramborovy salat', 'potato salad'], ['cibulove krouzky', 'onion rings'],
    ['dusena ryze', 'steamed rice'], ['obložene misy', 'cold platters'], ['obložene', 'cold'], ['na pepri', 'with pepper'], ['na cesneku', 'with garlic'], ['na medu', 'with honey'],
    ['na masle', 'on butter'], ['na pomerancich', 'in orange sauce'], ['na smetane', 'in cream sauce'], ['bbq omacka', 'BBQ sauce'], ['sladka chilli omacka', 'sweet chilli sauce'],
  ];
  const EN_SLOVA = {
    smazeny: 'fried', smazena: 'fried', smazene: 'fried', grilovany: 'grilled', grilovana: 'grilled', grilovane: 'grilled', peceny: 'roasted', pecena: 'roasted', pecene: 'roasted',
    duseny: 'stewed', dusena: 'stewed', vareny: 'boiled', plneny: 'stuffed', plnena: 'stuffed', male: 'small', maly: 'small', domaci: 'homemade', zapeceny: 'baked', zapecene: 'baked',
    kureci: 'chicken', veprovy: 'pork', veprove: 'pork', veprova: 'pork', hovezi: 'beef', kachni: 'duck', kruti: 'turkey', teleci: 'veal', jehneci: 'lamb', zverinovy: 'venison',
    rizek: 'schnitzel', rizky: 'schnitzels', rizecky: 'mini schnitzels', rautove: 'buffet', steak: 'steak', medailonky: 'medallions', spizy: 'skewers', spiz: 'skewer', palicky: 'drumsticks',
    zebra: 'ribs', kebab: 'kebab', gulas: 'goulash', svickova: 'beef sirloin', stehno: 'leg', prsa: 'breast', maso: 'meat', vypecky: 'roast pork', vrabec: 'roast pork',
    knedlik: 'dumplings', knedliky: 'dumplings', hranolky: 'french fries', brambor: 'potatoes', brambory: 'potatoes', bramboraky: 'potato pancakes', ryze: 'rice', zeli: 'cabbage',
    syr: 'cheese', syrove: 'cheese', smazacky: 'fried bites', hermelin: 'Hermelín cheese', salat: 'salad', salaty: 'salads', okurek: 'pickle', obloha: 'garnish', zeleninova: 'vegetable',
    polevka: 'soup', vyvar: 'broth', pizza: 'pizza', sunka: 'ham', slanina: 'bacon', zampiony: 'mushrooms', houby: 'mushrooms', cibule: 'onion', tatarak: 'tartare', tatarka: 'tartar sauce', cesnekem: 'garlic', cesnek: 'garlic', syrem: 'cheese', sunkou: 'ham', slaninou: 'bacon', langos: 'langos', hranolkami: 'french fries', topinky: 'toast',
    misy: 'platters', uzeninova: 'cold cuts', syrova: 'cheese', s: 'with', se: 'with', a: 'and', omacka: 'sauce', kachna: 'duck', ryba: 'fish', losos: 'salmon', pstruh: 'trout',
    sopsky: 'Shopska', coleslaw: 'coleslaw', kompot: 'compote', tvaroh: 'cottage cheese', palacinky: 'pancakes', dezert: 'dessert', pohar: 'sundae', zmrzlina: 'ice cream',
  };
  const bezDiak = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function navrhniAnglicky(nazev) {
    let t = ' ' + bezDiak(nazev).replace(/[()]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const kousky = [];
    EN_FRAZE.forEach(([cz, en]) => { const c = bezDiak(cz); if (t.includes(' ' + c + ' ') || t.includes(' ' + c + ',')) t = t.replace(c, `§${kousky.push(en) - 1}§`); });
    let znamych = 0, slov = 0;
    const out = t.trim().split(/(\s+|,)/).map((w) => {
      if (!w.trim() || w === ',') return w;
      const m = w.match(/^§(\d+)§$/); if (m) { znamych++; slov++; return kousky[+m[1]]; }
      if (/^\d/.test(w)) return w;
      slov++;
      const en = EN_SLOVA[w]; if (en) { znamych++; return en; }
      return w;
    }).join('').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim();
    return slov && znamych / slov >= 0.6 ? out : '';
  }
  function navrhniAlergeny(nazev, popis) {
    const t = bezDiak(nazev + ' ' + (popis || '')), a = new Set();
    ALG_PRAVIDLA.forEach(([re, cisla]) => { if (re.test(t)) cisla.forEach((c) => a.add(c)); });
    return [...a].sort((x, y) => x - y);
  }
  /* Návrh alergenů pro denní menu (polévka, jídla): historie, pak slova v názvu. Polévky skoro vždy obsahují celer. */
  window.navrhAlergenuDenni = (nazev, typ) => {
    const n = bezDiak(nazev).trim(); if (!n) return [];
    if (typeof HISTORIE !== 'undefined') { const h = HISTORIE.find((x) => bezDiak(x.nazev).trim() === n && x.alergeny && x.alergeny.length); if (h) return [...h.alergeny]; }
    let x = null; listek.forEach((k) => k.polozky.forEach((q) => { if (!x && bezDiak(q.nazev).trim() === n && q.a && q.a.length) x = [...q.a]; })); if (x) return x;
    const a = new Set(navrhniAlergeny(nazev)); if (typ === 'polevka') a.add(9);
    return [...a].sort((p, q) => p - q);
  };
  function navrhPro(p) {
    const n = bezDiak(p.nazev).trim(); if (!n) return null;
    let a = null, en = '';
    // 1) stejné jídlo jinde v lístku
    listek.forEach((k) => k.polozky.forEach((x) => { if (x !== p && bezDiak(x.nazev).trim() === n) { if (!a && x.a && x.a.length) a = [...x.a]; if (!en && x.en) en = x.en; } }));
    // 2) historie denního menu (má alergeny)
    if (!a && typeof HISTORIE !== 'undefined') { const h = HISTORIE.find((x) => bezDiak(x.nazev).trim() === n && x.alergeny && x.alergeny.length); if (h) a = [...h.alergeny]; }
    // 3) podle slov v názvu
    if (!a) a = navrhniAlergeny(p.nazev, p.popis);
    if (!en) en = navrhniAnglicky(p.nazev);
    return { a, en };
  }
  ed.addEventListener('change', (e) => {
    if (e.target.dataset.f !== 'nazev') return;
    const it = polozka(e.target); if (!it || !String(it.x.nazev || '').trim()) return;
    const n = navrhPro(it.x); if (!n) return;
    const doplneno = [];
    if ((!it.x.a || !it.x.a.length) && n.a.length) { it.x.a = n.a; doplneno.push(`alergeny ${n.a.join(', ')}`); }
    if (!it.x.en && n.en) { it.x.en = n.en; doplneno.push(`anglicky „${n.en}“`); }
    if (doplneno.length) { oznac(); vykresli(); toast(`Navrhli jsme ${doplneno.join(' a ')}. Zkontrolujte prosím.`); }
  });

  /* ---------- Přetahování jídel v kategorii (myš i prst) za úchyt ⋮⋮ ---------- */
  let tah = null;
  ed.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('[data-tah]'); if (!h) return;
    const r = h.closest('.lr'); if (!r) return;
    e.preventDefault();
    h.setPointerCapture(e.pointerId);
    tah = { r, h, k: +r.dataset.k, kat: r.parentElement, pred: [...r.parentElement.querySelectorAll(':scope > .lr')].map((x) => +x.dataset.p) };
    r.classList.add('tazeno');
  });
  ed.addEventListener('pointermove', (e) => {
    if (!tah) return;
    const radky = [...tah.kat.querySelectorAll(':scope > .lr')].filter((x) => x !== tah.r);
    const cil = radky.find((x) => { const b = x.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
    tah.kat.insertBefore(tah.r, cil || tah.kat.querySelector(':scope > .add-meal'));
    if (e.clientY < 90) window.scrollBy(0, -12); else if (e.clientY > innerHeight - 150) window.scrollBy(0, 12);
  });
  const pustit = () => {
    if (!tah) return;
    const nove = [...tah.kat.querySelectorAll(':scope > .lr')].map((x) => +x.dataset.p);
    const pol = listek[tah.k].polozky, zmena = nove.some((v, i) => v !== tah.pred[i]);
    tah.r.classList.remove('tazeno'); tah = null;
    if (zmena) { const kopie = nove.map((i) => pol[i]); pol.length = 0; kopie.forEach((x) => pol.push(x)); otevrena = null; oznac(); toast('Pořadí změněno. Na webu se ukáže po uložení.'); }
    vykresli();
  };
  ed.addEventListener('pointerup', pustit);
  ed.addEventListener('pointercancel', pustit);

  async function uloz() {
    const btn = $('#lst-ulozit');
    const bezNazvu = listek.some((k) => k.polozky.some((p) => !String(p.nazev || '').trim()));
    if (bezNazvu) {
      listek.forEach((k) => { k.polozky = k.polozky.filter((p) => String(p.nazev || '').trim()); });
      otevrena = null; vykresli();
    }
    btn.disabled = true;
    try {
      if (RNM_SERVER) {
        const r = await rnmApi('/api/admin/listek', { listek }, 'PUT');
        listek = r.listek; upraveno = r.upraveno; upravil = (Ucty.aktualni() || {}).jmeno || upravil;
      } else {
        localStorage.setItem(KLIC_LISTEK, JSON.stringify(listek)); upraveno = new Date().toISOString();
      }
      zmeneno = false; ukazStav(); vykresli(); toast('✓ Uloženo. Lístek je na webu.');
    } catch (e) { toast('Nepodařilo se uložit: ' + e.message); }
    btn.disabled = false;
  }
  $('#lst-ulozit').addEventListener('click', uloz);
  window.addEventListener('beforeunload', (e) => { if (zmeneno) e.preventDefault(); });

  // Lístková lišta jen v pohledu Jídelní lístek (lišta denního menu se přepíná v admin.js)
  const bar = $('.lst-bar');
  const prepni = () => { bar.style.display = $('#v-listek').classList.contains('on') ? '' : 'none'; };
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setTimeout(prepni)));
  prepni();

  document.addEventListener('DOMContentLoaded', async () => {
    try { await nacti(); } catch (e) { ed.innerHTML = `<p class="tip"><span>⚠️</span><span>${esc(e.message)}</span></p>`; return; }
    vykresli(); ukazStav();
    if (location.hash === '#listek') { prepniPohled('listek'); prepni(); }
  });
})();
