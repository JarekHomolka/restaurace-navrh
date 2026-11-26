/* Administrace: Fotky a texty – oznámení nahoře na webu, otevírací doba, výjimky (svátky, dovolená) a fotky na úvodu.
   Ostrý web: /api/admin/obsah, /api/admin/provoz, /api/admin/galerie, /api/admin/fotky.
   Ukázka: ukládá se do prohlížeče (localStorage), web si to odtud přečte. */

(function () {
  if (!$('#v-vice')) return;
  const kopie = (o) => JSON.parse(JSON.stringify(o));
  const PORADI = [1, 2, 3, 4, 5, 6, 0];
  const VYCHOZI_GALERIE = [
    { src: 'assets/foto/bar-sal.jpg', alt: 'Výčep a lokál restaurace' },
    { src: 'assets/foto/zahradka.jpg', alt: 'Zahrádka s pergolou za restaurací' },
    { src: 'assets/foto/svatba-sal.jpg', alt: 'Sál prostřený na svatbu' },
    { src: 'assets/foto/predkrm.jpg', alt: 'Předkrm a pivo na oslavě' },
    { src: 'assets/foto/sladke-mameni.jpg', alt: 'Sladký bar na oslavě' },
  ];
  const KLIC_GALERIE = 'rnm-galerie-v1';
  let provoz, galerie, skupiny, rauty, maxFotek = 12, zmeneno = false, upraveno = null, upravil = null;

  /* ---------- stav ---------- */
  const kdy = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}. v ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function ukazStav() {
    const s = $('#pv-stav');
    s.textContent = zmeneno ? 'Neuložené změny' : `Zveřejněno${upraveno ? ` · upraveno ${kdy(upraveno)}${upravil ? ', ' + upravil : ''}` : ''}`;
    s.classList.toggle('draft', zmeneno);
  }
  function oznac() { zmeneno = true; ukazStav(); }

  async function nacti() {
    if (RNM_SERVER) {
      const r = await rnmApi('/api/admin/obsah');
      provoz = r.provoz || kopie(VYCHOZI_PROVOZ); galerie = r.galerie; maxFotek = r.maxFotek || 12;
      skupiny = r.skupiny || kopie(VYCHOZI_SKUPINY); rauty = r.rauty || kopie(VYCHOZI_RAUTY);
      upraveno = r.provozUpraveno; upravil = r.provozUpravil;
    } else {
      provoz = kopie(aktualniProvoz()); skupiny = kopie(aktualniSkupiny()); rauty = kopie(aktualniRauty());
      try { galerie = JSON.parse(localStorage.getItem(KLIC_GALERIE)) || kopie(VYCHOZI_GALERIE); } catch (e) { galerie = kopie(VYCHOZI_GALERIE); }
    }
    provoz.vyjimky = provoz.vyjimky || []; provoz.oznameni = provoz.oznameni || { text: '', od: '', do: '' };
  }

  /* ---------- oznámení ---------- */
  function vykresliOznameniEd() {
    $('#oz-text').value = provoz.oznameni.text || '';
    $('#oz-od').value = provoz.oznameni.od || '';
    $('#oz-do').value = provoz.oznameni.do || '';
  }
  ['oz-text', 'oz-od', 'oz-do'].forEach((id) => $('#' + id).addEventListener('input', () => {
    provoz.oznameni = { text: $('#oz-text').value, od: $('#oz-od').value, do: $('#oz-do').value }; oznac();
  }));

  /* ---------- otevírací doba ---------- */
  function vykresliDobuEd() {
    $('#doba-dny').innerHTML = PORADI.map((d) => {
      const x = provoz.doba[d];
      return `<div class="doba-radek${x ? '' : ' zavreno'}" data-d="${d}">
        <b>${DNY[(d + 6) % 7]}</b>
        <div class="doba-casy">
          <label class="sr" for="od-${d}">Otevíráme</label><input type="time" id="od-${d}" data-f="od" value="${x ? x.od : '10:00'}" step="900">
          <label class="sr" for="do-${d}">Zavíráme</label><input type="time" id="do-${d}" data-f="do" value="${x ? x.do : '22:00'}" step="900">
          <label class="veg"><input type="checkbox" data-f="zavreno" ${x ? '' : 'checked'}>Zavřeno</label>
        </div>
      </div>`;
    }).join('');
  }
  $('#doba-dny').addEventListener('input', (e) => {
    const r = e.target.closest('[data-d]'); if (!r) return;
    const d = +r.dataset.d, f = e.target.dataset.f;
    if (f === 'zavreno') {
      provoz.doba[d] = e.target.checked ? null : { od: $(`#od-${d}`).value || '10:00', do: $(`#do-${d}`).value || '22:00' };
      r.classList.toggle('zavreno', e.target.checked);
    } else if (provoz.doba[d]) provoz.doba[d][f] = e.target.value;
    oznac();
  });

  /* ---------- výjimky ---------- */
  function vykresliVyjimky() {
    const dnes = isoDen(new Date());
    $('#vyjimky-seznam').innerHTML = provoz.vyjimky.length ? provoz.vyjimky.map((v, i) => `
      <div class="vyj${v.zavreno ? ' zavreno' : ''}${v.datum && v.datum < dnes ? ' minula' : ''}" data-i="${i}">
        <div class="vyj-radek">
          <label class="sr" for="vd-${i}">Datum</label><input type="date" id="vd-${i}" data-f="datum" value="${esc(v.datum)}">
          <input type="text" data-f="text" value="${esc(v.text || '')}" maxlength="80" placeholder="Např. Štědrý den" aria-label="Popis výjimky">
        </div>
        <div class="vyj-radek">
          <label class="veg"><input type="checkbox" data-f="zavreno" ${v.zavreno ? 'checked' : ''}>Celý den zavřeno</label>
          <label class="sr" for="vo-${i}">Otevíráme</label><input type="time" id="vo-${i}" data-f="od" value="${esc(v.od || '10:00')}" step="900">
          <label class="sr" for="vz-${i}">Zavíráme</label><input type="time" id="vz-${i}" data-f="do" value="${esc(v.do || '14:00')}" step="900">
          <button type="button" class="del" data-a="smazat" title="Odebrat výjimku" aria-label="Odebrat výjimku">×</button>
        </div>
      </div>`).join('') : '<p class="lc-pozn">Žádné výjimky. Web se řídí běžnou otevírací dobou.</p>';
  }
  $('#vyjimky-seznam').addEventListener('input', (e) => {
    const r = e.target.closest('[data-i]'); if (!r) return;
    const v = provoz.vyjimky[+r.dataset.i], f = e.target.dataset.f;
    if (f === 'zavreno') {
      v.zavreno = e.target.checked; r.classList.toggle('zavreno', v.zavreno);
      if (!v.zavreno) { v.od = r.querySelector('[data-f="od"]').value; v.do = r.querySelector('[data-f="do"]').value; }
    } else v[f] = e.target.value;
    oznac();
  });
  $('#vyjimky-seznam').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a="smazat"]'); if (!b) return;
    provoz.vyjimky.splice(+b.closest('[data-i]').dataset.i, 1); oznac(); vykresliVyjimky();
  });
  $('#vyj-pridat').addEventListener('click', () => {
    provoz.vyjimky.push({ datum: '', zavreno: true, text: '' }); oznac(); vykresliVyjimky();
    const i = $$('#vyjimky-seznam input[type="date"]').pop(); if (i) i.focus();
  });

  async function ulozProvoz() {
    const b = $('#pv-ulozit');
    provoz.vyjimky = provoz.vyjimky.filter((v) => v.datum).sort((x, y) => x.datum.localeCompare(y.datum));
    b.disabled = true;
    try {
      if (RNM_SERVER) {
        const r = await rnmApi('/api/admin/provoz', { provoz }, 'PUT');
        skupiny = (await rnmApi('/api/admin/skupiny', { skupiny: ctiSkupiny() }, 'PUT')).skupiny;
        rauty = (await rnmApi('/api/admin/rauty', { rauty: ctiRauty() }, 'PUT')).rauty;
        provoz = r.provoz; upraveno = r.upraveno; upravil = (Ucty.aktualni() || {}).jmeno || upravil;
      } else { localStorage.setItem(KLIC_PROVOZ, JSON.stringify(provoz)); localStorage.setItem(KLIC_SKUPINY, JSON.stringify(ctiSkupiny())); localStorage.setItem(KLIC_RAUTY, JSON.stringify(ctiRauty())); upraveno = new Date().toISOString(); }
      vykresliSkupinyEd(); vykresliRautyEd();
      zmeneno = false; ukazStav(); vykresliVyjimky(); toast('✓ Uloženo. Na webu je to hned.');
    } catch (e) { toast('Nepodařilo se uložit: ' + e.message); }
    b.disabled = false;
  }
  $('#pv-ulozit').addEventListener('click', ulozProvoz);

  /* ---------- nabídka pro skupinové zájezdy ---------- */
  function vykresliSkupinyEd() {
    $('#sk-nadpis').value = skupiny.nadpis || '';
    $('#sk-polevka').value = skupiny.polevka || '';
    $('#sk-polevka-a').value = (skupiny.polevkaA || []).join(', ');
    $('#sk-cena-bez').value = skupiny.cenaBez || '';
    $('#sk-cena-s').value = skupiny.cenaS || '';
    $('#sk-pozn').value = skupiny.poznamka || '';
    $('#sk-jidla').innerHTML = (skupiny.jidla || []).map((j, i) => `
      <div class="vyj-radek" data-i="${i}">
        <input type="text" data-f="jidlo" value="${esc(j)}" maxlength="160" aria-label="Jídlo ${i + 1}" placeholder="Název jídla a přílohy">
        <input type="text" class="alg-pole" data-f="alg" value="${esc(((skupiny.jidlaA || [])[i] || []).join(', '))}" inputmode="numeric" aria-label="Alergeny jídla ${i + 1}" placeholder="alergeny" title="Čísla alergenů, např. 1, 3, 7">
        <button type="button" class="del" data-a="smazat" title="Odebrat jídlo" aria-label="Odebrat jídlo ${i + 1}">×</button>
      </div>`).join('');
  }
  const ctiSkupiny = (iPrazdne) => ({
    nadpis: $('#sk-nadpis').value, polevka: $('#sk-polevka').value,
    ...(() => { const r = $$('#sk-jidla .vyj-radek').map((d) => [$('[data-f="jidlo"]', d).value, alergenyZTextu($('[data-f="alg"]', d).value)]).filter((p) => iPrazdne || p[0].trim()); return { jidla: r.map((p) => p[0]), jidlaA: r.map((p) => p[1]) }; })(),
    polevkaA: alergenyZTextu($('#sk-polevka-a').value),
    cenaBez: $('#sk-cena-bez').value.replace(/\D/g, ''), cenaS: $('#sk-cena-s').value.replace(/\D/g, ''), poznamka: $('#sk-pozn').value,
  });
  $('#skupiny-ed').addEventListener('input', (e) => {
    if (e.target.id === 'sk-cena-bez' || e.target.id === 'sk-cena-s') e.target.value = e.target.value.replace(/\D/g, '');
    oznac();
  });
  $('#sk-jidla').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a="smazat"]'); if (!b) return;
    skupiny = ctiSkupiny(true); const ix = +b.closest('[data-i]').dataset.i; skupiny.jidla.splice(ix, 1); skupiny.jidlaA.splice(ix, 1); oznac(); vykresliSkupinyEd();
  });
  $('#sk-pridat').addEventListener('click', () => {
    skupiny = ctiSkupiny(true); skupiny.jidla.push(''); skupiny.jidlaA.push([]); oznac(); vykresliSkupinyEd();
    const i = $$('#sk-jidla [data-f="jidlo"]').pop(); if (i) i.focus();
  });

  /* ---------- nabídka rautů s sebou ---------- */
  function vykresliRautyEd() {
    $('#ra-nadpis').value = rauty.nadpis || '';
    $('#ra-cena-od').value = rauty.cenaOd || '';
    $('#ra-cena-do').value = rauty.cenaDo || '';
    $('#ra-pozn').value = rauty.poznamka || '';
    $('#ra-polozky').innerHTML = (rauty.polozky || []).map((j, i) => `
      <div class="vyj-radek" data-i="${i}">
        <input type="text" data-f="polozka" value="${esc(j)}" maxlength="160" aria-label="Položka ${i + 1}" placeholder="Např. Sýrové smažáčky">
        <input type="text" class="alg-pole" data-f="alg" value="${esc(((rauty.polozkyA || [])[i] || []).join(', '))}" inputmode="numeric" aria-label="Alergeny položky ${i + 1}" placeholder="alergeny" title="Čísla alergenů, např. 1, 3, 7">
        <button type="button" class="del" data-a="smazat" title="Odebrat položku" aria-label="Odebrat položku ${i + 1}">×</button>
      </div>`).join('');
  }
  const ctiRauty = (iPrazdne) => ({
    nadpis: $('#ra-nadpis').value,
    ...(() => { const r = $$('#ra-polozky .vyj-radek').map((d) => [$('[data-f="polozka"]', d).value, alergenyZTextu($('[data-f="alg"]', d).value)]).filter((p) => iPrazdne || p[0].trim()); return { polozky: r.map((p) => p[0]), polozkyA: r.map((p) => p[1]) }; })(),
    cenaOd: $('#ra-cena-od').value.replace(/\D/g, ''), cenaDo: $('#ra-cena-do').value.replace(/\D/g, ''), poznamka: $('#ra-pozn').value,
  });
  $('#rauty-ed').addEventListener('input', (e) => {
    if (e.target.id === 'ra-cena-od' || e.target.id === 'ra-cena-do') e.target.value = e.target.value.replace(/\D/g, '');
    oznac();
  });
  $('#ra-polozky').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a="smazat"]'); if (!b) return;
    rauty = ctiRauty(true); const ix = +b.closest('[data-i]').dataset.i; rauty.polozky.splice(ix, 1); rauty.polozkyA.splice(ix, 1); oznac(); vykresliRautyEd();
  });
  $('#ra-pridat').addEventListener('click', () => {
    rauty = ctiRauty(true); rauty.polozky.push(''); rauty.polozkyA.push([]); oznac(); vykresliRautyEd();
    const i = $$('#ra-polozky [data-f="polozka"]').pop(); if (i) i.focus();
  });

  /* Po napsání názvu (zájezdy, rauty) předvyplníme alergeny, pokud je políčko prázdné. Obsluha je zkontroluje. */
  ['#skupiny-ed', '#rauty-ed'].forEach((sel) => $(sel).addEventListener('change', (e) => {
    const f = e.target.dataset.f;
    let pole = null, typ = 'jidlo';
    if (f === 'jidlo' || f === 'polozka') pole = $('[data-f="alg"]', e.target.closest('.vyj-radek'));
    else if (e.target.id === 'sk-polevka') { pole = $('#sk-polevka-a'); typ = 'polevka'; }
    if (!pole || pole.value.trim() || !e.target.value.trim()) return;
    const a = navrhAlergenu(e.target.value, typ);
    if (a.length) { pole.value = a.join(', '); oznac(); }
  }));

  /* ---------- galerie ---------- */
  const zprava = (t) => { $('#gal-zprava').textContent = t || ''; };
  function vykresliGalerieEd() {
    $('#gal-pocet').textContent = `${galerie.length} z ${maxFotek}`;
    $('#gal-seznam').innerHTML = galerie.map((f, i) => `
      <div class="gal-f" data-i="${i}">
        <img src="${esc(f.src || '/foto/' + f.id + '.jpg')}" alt="">
        <input value="${esc(f.alt || '')}" maxlength="120" placeholder="Co je na fotce" aria-label="Popis fotky ${i + 1}" data-f="alt">
        <div class="gal-akce">
          <button type="button" class="btn btn-ghost btn-sm" data-a="vlevo" ${i === 0 ? 'disabled' : ''} aria-label="Posunout dopředu">←</button>
          <button type="button" class="btn btn-ghost btn-sm" data-a="vpravo" ${i === galerie.length - 1 ? 'disabled' : ''} aria-label="Posunout dozadu">→</button>
          <button type="button" class="btn btn-ghost btn-sm" data-a="smazat" aria-label="Smazat fotku">Smazat</button>
        </div>
      </div>`).join('');
    $('.gal-nahrat').style.display = galerie.length >= maxFotek ? 'none' : '';
  }
  async function ulozGalerii(hlaska) {
    try {
      if (RNM_SERVER) galerie = (await rnmApi('/api/admin/galerie', { galerie }, 'PUT')).galerie;
      else localStorage.setItem(KLIC_GALERIE, JSON.stringify(galerie));
      if (hlaska) toast(hlaska);
    } catch (e) { toast('Nepodařilo se uložit fotky: ' + e.message); }
    vykresliGalerieEd();
  }
  $('#gal-seznam').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const i = +b.closest('[data-i]').dataset.i, a = b.dataset.a;
    if (a === 'vlevo' || a === 'vpravo') { const j = i + (a === 'vlevo' ? -1 : 1); [galerie[i], galerie[j]] = [galerie[j], galerie[i]]; ulozGalerii(j === 0 ? '✓ Tahle fotka je teď na webu velká.' : '✓ Pořadí uloženo.'); }
    if (a === 'smazat' && confirm('Smazat tuhle fotku z webu?')) { galerie.splice(i, 1); ulozGalerii('Fotka je smazaná.'); }
  });
  $('#gal-seznam').addEventListener('change', (e) => {
    if (e.target.dataset.f !== 'alt') return;
    galerie[+e.target.closest('[data-i]').dataset.i].alt = e.target.value; ulozGalerii('✓ Popis fotky uložen.');
  });

  // Zmenšení fotky v prohlížeči: delší strana max. 1600 px (v ukázce 900 px), JPEG
  async function zmensi(soubor, max, kvalita) {
    let obr;
    try { obr = await createImageBitmap(soubor, { imageOrientation: 'from-image' }); }
    catch (e) {
      obr = await new Promise((ok, chyba) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => chyba(new Error('Tenhle soubor neumíme otevřít. Zkuste fotku ve formátu JPG.')); i.src = URL.createObjectURL(soubor); });
    }
    const w0 = obr.width, h0 = obr.height, k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    c.getContext('2d').drawImage(obr, 0, 0, c.width, c.height);
    let blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', kvalita));
    if (blob && blob.size > 1600000) blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.65));
    if (!blob) throw new Error('Fotku se nepodařilo zmenšit.');
    return { blob, sirka: c.width, vyska: c.height, canvas: c };
  }
  $('#gal-soubor').addEventListener('change', async (e) => {
    const soubory = [...e.target.files].slice(0, Math.max(0, maxFotek - galerie.length));
    e.target.value = '';
    if (!soubory.length) return;
    let hotovo = 0;
    for (const s of soubory) {
      zprava(`Nahrávám fotku ${hotovo + 1} z ${soubory.length}…`);
      try {
        const alt = s.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/^(img|dsc|photo|pxl)\s*\d.*$/i, '').trim();
        if (RNM_SERVER) {
          const { blob, sirka, vyska } = await zmensi(s, 1600, 0.82);
          const r = await fetch(`/api/admin/fotky?sirka=${sirka}&vyska=${vyska}&alt=${encodeURIComponent(alt)}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'image/jpeg', 'x-rnm': '1' }, body: blob });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.chyba || 'Nahrání se nepovedlo.');
          galerie = j.galerie;
        } else {
          const { canvas } = await zmensi(s, 900, 0.7);
          galerie.push({ src: canvas.toDataURL('image/jpeg', 0.7), alt });
          localStorage.setItem(KLIC_GALERIE, JSON.stringify(galerie));
        }
        hotovo++;
        vykresliGalerieEd();
      } catch (err) { zprava(`${s.name}: ${err.message}`); toast(err.message); return; }
    }
    zprava(''); toast(`✓ Nahráno ${hotovo} ${hotovo === 1 ? 'fotka' : hotovo < 5 ? 'fotky' : 'fotek'}. Doplňte k nim krátký popis.`);
  });

  /* ---------- lišta s uložením jen v tomto pohledu ---------- */
  const bar = $('.pv-bar');
  const prepni = () => { bar.style.display = $('#v-vice').classList.contains('on') ? '' : 'none'; };
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => setTimeout(prepni)));
  prepni();
  window.addEventListener('beforeunload', (e) => { if (zmeneno) e.preventDefault(); });

  document.addEventListener('DOMContentLoaded', async () => {
    try { await nacti(); } catch (e) { $('#v-vice .list-ed').innerHTML = `<p class="tip"><span>⚠️</span><span>${esc(e.message)}</span></p>`; return; }
    vykresliOznameniEd(); vykresliDobuEd(); vykresliVyjimky(); vykresliSkupinyEd(); vykresliRautyEd(); vykresliGalerieEd(); ukazStav();
    if (location.hash === '#fotky') { prepniPohled('vice'); prepni(); }
  });
})();
