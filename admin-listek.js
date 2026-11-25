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
