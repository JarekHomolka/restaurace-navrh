/* Administrace: můj účet, odhlášení a správa uživatelů (sekce Uživatelé jen pro super admina, tedy IT).
   Data a pravidla jsou v auth.js, tady je jen obrazovka. */

(function () {
  const ja = Ucty.aktualni();
  if (!ja) return;   // auth.js už přesměrovává na přihlášení
  const jeSpravce = ja.role === 'superadmin';
  const datum = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const kratce = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}.`; };

  /* ---------- hlavička a můj účet ---------- */
  $('#ucet-jmeno').textContent = ja.jmeno;
  $$('[data-jen="superadmin"]').forEach((el) => { el.hidden = !jeSpravce; });
  const dUcet = $('#dlg-ucet');
  $('#b-ucet').addEventListener('click', () => {
    $('#ucet-info-jmeno').textContent = ja.jmeno;
    $('#ucet-info-email').textContent = ja.email;
    $('#ucet-info-role').textContent = `${Ucty.ROLE[ja.role].nazev} (${Ucty.ROLE[ja.role].kdo}). ${Ucty.ROLE[ja.role].popis}`;
    $('#ucet-chyba').textContent = '';
    dUcet.showModal();
  });
  $('#ucet-zavrit').addEventListener('click', () => dUcet.close());
  $('#b-odhlasit').addEventListener('click', () => { Ucty.odhlasit(); location.replace('prihlaseni.html?odhlaseno=1'); });
  $('#heslo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = $('#h-ulozit'); b.disabled = true;
    try {
      await Ucty.zmenHeslo($('#h-stare').value, $('#h-nove').value);
      $('#h-stare').value = ''; $('#h-nove').value = ''; $('#zmena-hesla').open = false;
      if (ja.zmenitHeslo) { location.reload(); return; }
      dUcet.close(); toast('✓ Heslo je změněné.');
    } catch (err) { $('#ucet-chyba').textContent = err.message; }
    b.disabled = false;
  });
  // Odhlášení i v jiné záložce (nebo zablokování super adminem) se projeví hned
  // (v ostrém webu to hlídá server u každého uložení)
  const hlidej = () => { const u = Ucty.aktualni(); if (!u || u.id !== ja.id || u.role !== ja.role) location.replace('prihlaseni.html'); };
  window.addEventListener('storage', (e) => { if (/^rnm-(relace|ucty)-/.test(e.key || '')) hlidej(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hlidej(); });
  setInterval(hlidej, 60000);

  // Dočasné heslo od IT: hned po přihlášení si člověk nastaví vlastní (dialog nejde zavřít)
  if (ja.zmenitHeslo) {
    $('#b-ucet').click();
    $('#zmena-hesla').open = true;
    $('#ucet-chyba').textContent = 'Máte dočasné heslo od IT. Než budete pokračovat, nastavte si vlastní.';
    $('#ucet-zavrit').hidden = true;
    $('label[for="h-stare"]').textContent = 'Dočasné heslo od IT';
    dUcet.addEventListener('cancel', (e) => e.preventDefault());
    $('#h-stare').focus();
  }

  if (!jeSpravce) return;

  /* ---------- seznam uživatelů ---------- */
  function vykresli() {
    const { uzivatele, pozvanky } = Ucty.seznam();
    const aktivni = uzivatele.filter((u) => u.stav === 'aktivni').length;
    $('#uz-stav').textContent = `${aktivni} aktivní${pozvanky.length ? ` · ${pozvanky.length} pozvánk${pozvanky.length === 1 ? 'a čeká' : 'y čekají'}` : ''}`;
    $('#uz-seznam').innerHTML = uzivatele.map((u) => {
      const sam = u.id === ja.id, blok = u.stav === 'zablokovan';
      return `<div class="uz${blok ? ' blok' : ''}" data-id="${esc(u.id)}">
        <div style="display:grid;gap:6px;min-width:0">
          <div class="uz-hlava"><h3>${esc(u.jmeno)}${sam ? ' <span class="badge seda">vy</span>' : ''}</h3><span class="em">${esc(u.email)}</span></div>
          <div class="uz-meta"><span class="badge${u.role === 'superadmin' ? '' : ' green'}">${Ucty.ROLE[u.role].nazev}</span>${blok ? '<span class="badge seda">Zablokovaný</span>' : ''}<span>${u.posledni ? 'naposledy přihlášen ' + datum(u.posledni) : 'zatím se nepřihlásil'}</span></div>
        </div>
        ${sam ? '<div class="uz-akce"><span class="uz-meta">Svůj účet upravíte vpravo nahoře.</span></div>' : `<div class="uz-akce">
          <label class="sr" for="r-${esc(u.id)}">Role</label>
          <select id="r-${esc(u.id)}" data-a="role">${Object.entries(Ucty.ROLE).map(([k, r]) => `<option value="${k}"${k === u.role ? ' selected' : ''}>${r.nazev}</option>`).join('')}</select>
          <button class="btn btn-ghost btn-sm" data-a="heslo">Nové heslo</button>
          <button class="btn btn-ghost btn-sm" data-a="blok">${blok ? 'Obnovit přístup' : 'Zablokovat'}</button>
          ${blok ? '<button class="btn btn-ghost btn-sm" data-a="odebrat">Odebrat</button>' : ''}
        </div>`}
      </div>`;
    }).join('');
    $('#uz-pozvanky-nadpis').hidden = !pozvanky.length;
    $('#uz-pozvanky').innerHTML = pozvanky.map((p) => `<div class="uz" data-token="${esc(p.token)}">
        <div style="display:grid;gap:6px;min-width:0">
          <div class="uz-hlava"><h3>${esc(p.jmeno || p.email)}</h3>${p.jmeno ? `<span class="em">${esc(p.email)}</span>` : ''}</div>
          <div class="uz-meta"><span class="badge${p.role === 'superadmin' ? '' : ' green'}">${Ucty.ROLE[p.role].nazev}</span><span class="badge ${p.prosla ? 'seda' : 'gold'}">${p.prosla ? 'Platnost vypršela' : 'Platí do ' + kratce(p.platiDo)}</span><span>pozváno ${datum(p.vytvoreno)}</span></div>
        </div>
        <div class="uz-akce">
          ${p.prosla ? '' : '<button class="btn btn-ghost btn-sm" data-a="kopirovat">Zkopírovat odkaz</button>'}
          <button class="btn btn-ghost btn-sm" data-a="znovu">${p.prosla ? 'Poslat znovu' : 'Nový odkaz'}</button>
          <button class="btn btn-ghost btn-sm" data-a="zrusit">Zrušit pozvánku</button>
        </div>
      </div>`).join('');
    $('#uz-zaznam').innerHTML = Ucty.zaznam(8).map((z) => `<li><time datetime="${esc(z.kdy)}">${datum(z.kdy)} · ${esc(z.kdo)}</time>${esc(z.co)}</li>`).join('');
  }

  const zkus = (fn, ok) => { try { const r = fn(); vykresli(); if (ok) toast(ok); return r; } catch (err) { toast(err.message); vykresli(); return null; } };

  $('#v-uzivatele').addEventListener('change', (e) => {
    if (e.target.dataset.a !== 'role') return;
    const id = e.target.closest('[data-id]').dataset.id;
    zkus(() => Ucty.zmenRoli(id, e.target.value), `✓ Role změněna na ${Ucty.ROLE[e.target.value].nazev.toLowerCase()}. Při dalším kroku se přihlásí znovu.`);
  });
  $('#v-uzivatele').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const a = b.dataset.a, uz = b.closest('[data-id]'), pz = b.closest('[data-token]');
    if (uz) {
      const id = uz.dataset.id, jm = uz.querySelector('h3').textContent;
      if (a === 'blok') {
        const blokovat = b.textContent.trim() === 'Zablokovat';
        if (blokovat && !confirm(`Zablokovat přístup pro ${jm}? Okamžitě se odhlásí a nepřihlásí se, dokud přístup neobnovíte.`)) return;
        zkus(() => Ucty.zablokovat(id, blokovat), blokovat ? `${jm} už se nepřihlásí.` : `✓ ${jm} má znovu přístup.`);
      }
      if (a === 'odebrat' && confirm(`Odebrat účet ${jm} natrvalo? Záznam jeho změn zůstane.`)) zkus(() => Ucty.odebrat(id), 'Účet je odebraný.');
      if (a === 'heslo') otevriDialog('heslo', { id, jmeno: jm });
    }
    if (pz) {
      const token = pz.dataset.token;
      if (a === 'kopirovat') kopiruj(Ucty.seznam().pozvanky.find((p) => p.token === token).odkaz, 'Odkaz');
      if (a === 'znovu') { const r = zkus(() => Ucty.obnovitPozvanku(token)); if (r) ukazOdkaz({ nadpis: 'Nový odkaz pozvánky', odkaz: r.odkaz, text: 'Starý odkaz už neplatí. Nový platí 7 dní.' }); }
      if (a === 'zrusit' && confirm('Zrušit pozvánku? Odkaz přestane platit.')) zkus(() => Ucty.zrusitPozvanku(token), 'Pozvánka je zrušená.');
    }
  });

  /* ---------- přidat uživatele / nové heslo (jeden dialog, dva režimy) ---------- */
  const dPoz = $('#dlg-pozvat');
  let rezim = 'novy', cil = null;   // 'novy' = nový účet, 'heslo' = nové heslo pro existující účet (cil = {id, jmeno})
  const zpusob = () => $('#pozvat-form').querySelector('[name="pz-zpusob"]:checked').value;
  function popisTlacitka() {
    const z = zpusob();
    $('#pz-heslo-blok').hidden = z !== 'heslo';
    $('#pozvat-ok').textContent = rezim === 'novy' ? (z === 'heslo' ? 'Přidat uživatele' : 'Vytvořit pozvánku') : (z === 'heslo' ? 'Uložit heslo' : 'Vytvořit odkaz');
  }
  function ukazVysledek({ nadpis, hodnota, text, kopirovat }) {
    $('#pozvat-pole').hidden = true; $('#pozvat-ok').hidden = true;
    $('#pz-nadpis').textContent = nadpis;
    $('#pozvat-vysledek').hidden = false;
    $('#pozvat-vysledek-nadpis').textContent = kopirovat === 'heslo' ? 'Heslo' : 'Odkaz';
    $('#pozvat-odkaz').value = hodnota; $('#pozvat-vysledek-text').textContent = text;
    $('#pozvat-kopirovat').hidden = false; $('#pozvat-kopirovat').textContent = kopirovat === 'heslo' ? 'Zkopírovat heslo' : 'Zkopírovat odkaz';
    $('#pozvat-zavrit').textContent = 'Hotovo';
    if (!dPoz.open) dPoz.showModal();
    $('#pozvat-odkaz').select();
  }
  const ukazOdkaz = ({ nadpis, odkaz, text }) => ukazVysledek({ nadpis, hodnota: odkaz, text, kopirovat: 'odkaz' });
  function otevriDialog(r, c) {
    rezim = r; cil = c || null;
    $('#pozvat-form').reset(); $('#pozvat-chyba').textContent = '';
    $('#pz-nadpis').textContent = r === 'novy' ? 'Přidat uživatele' : `Nové heslo pro ${cil.jmeno}`;
    $('#pz-udaje').hidden = r !== 'novy';
    $('#pz-zpusob-nadpis').textContent = r === 'novy' ? 'Heslo' : 'Jak';
    $('#pz-odkaz-nazev').textContent = r === 'novy' ? 'Pošlu odkaz, heslo si nastaví sám' : 'Pošlu odkaz, heslo si nastaví sám';
    $('#pz-odkaz-popis').textContent = r === 'novy' ? 'Jednorázový odkaz platí 7 dní.' : 'Jednorázový odkaz platí 24 hodin.';
    $('#pozvat-pole').hidden = false; $('#pozvat-ok').hidden = false; $('#pozvat-vysledek').hidden = true;
    $('#pozvat-kopirovat').hidden = true; $('#pozvat-zavrit').textContent = 'Zrušit';
    popisTlacitka();
    dPoz.showModal(); (r === 'novy' ? $('#pz-email') : $('#pz-heslo')).focus();
  }
  async function kopiruj(text, co) {
    try { await navigator.clipboard.writeText(text); toast(`✓ ${co || 'Odkaz'} je zkopírovaný.`); }
    catch (e) { $('#pozvat-odkaz').select(); toast('Označeno, zkopírujte Ctrl+C.'); }
  }
  $('#b-pozvat').addEventListener('click', () => otevriDialog('novy'));
  $('#pozvat-form').addEventListener('change', (e) => { if (e.target.name === 'pz-zpusob') popisTlacitka(); });
  $('#pz-generovat').addEventListener('click', () => { $('#pz-heslo').value = Ucty.vygenerujHeslo(); $('#pz-heslo').focus(); });
  $('#pozvat-zavrit').addEventListener('click', () => dPoz.close());
  $('#pozvat-kopirovat').addEventListener('click', () => kopiruj($('#pozvat-odkaz').value, $('#pozvat-kopirovat').textContent.includes('heslo') ? 'Heslo' : 'Odkaz'));
  $('#pozvat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#pozvat-chyba').textContent = '';
    const b = $('#pozvat-ok'); b.disabled = true;
    try {
      const z = zpusob(), heslo = $('#pz-heslo').value, zmenit = $('#pz-zmenit').checked;
      const zmenitText = zmenit ? ' Při prvním přihlášení si ho změní.' : '';
      if (rezim === 'novy' && z === 'heslo') {
        const u = await Ucty.vytvorit({ email: $('#pz-email').value, jmeno: $('#pz-jmeno').value, role: $('#pozvat-form').querySelector('[name="pz-role"]:checked').value, heslo, zmenitPriPrihlaseni: zmenit });
        vykresli();
        ukazVysledek({ nadpis: `Účet pro ${u.jmeno} je připravený`, hodnota: heslo, kopirovat: 'heslo', text: `Přihlašuje se e-mailem ${u.email}. Heslo se ukáže jen teď, uložené je jen jako otisk. Předejte ho osobně nebo telefonem.${zmenitText}` });
      } else if (rezim === 'novy') {
        const p = Ucty.pozvat({ email: $('#pz-email').value, jmeno: $('#pz-jmeno').value, role: $('#pozvat-form').querySelector('[name="pz-role"]:checked').value });
        vykresli();
        ukazOdkaz({ nadpis: 'Pozvánka je připravená', odkaz: p.odkaz, text: `Pro ${p.email}, platí 7 dní. V ostrém webu ji pošleme e-mailem automaticky. V ukázce odkaz zkopírujte a otevřete třeba v anonymním okně.` });
      } else if (z === 'heslo') {
        const u = await Ucty.nastavitHesloUzivateli(cil.id, heslo, zmenit);
        vykresli();
        ukazVysledek({ nadpis: `Nové heslo pro ${u.jmeno}`, hodnota: heslo, kopirovat: 'heslo', text: `Staré heslo přestalo platit a ${u.jmeno} je odhlášen na všech zařízeních. Heslo se ukáže jen teď.${zmenitText}` });
      } else {
        const r = Ucty.odkazNaNoveHeslo(cil.id);
        vykresli();
        ukazOdkaz({ nadpis: `Odkaz na nové heslo pro ${cil.jmeno}`, odkaz: r.odkaz, text: 'Platí 24 hodin a jde použít jen jednou. V ostrém webu ho pošleme e-mailem automaticky.' });
      }
    } catch (err) { $('#pozvat-chyba').textContent = err.message; }
    b.disabled = false;
  });

  $('#b-reset-ucty').addEventListener('click', () => {
    if (!confirm('Vrátit ukázku do začátku? Zůstane jen účet IT, všechny přidané účty zmizí a odhlásíte se.')) return;
    Ucty.resetUkazky(); location.replace('prihlaseni.html');
  });

  vykresli();
  $$('[data-view="uzivatele"]').forEach((b) => b.addEventListener('click', vykresli));
  if (location.hash === '#uzivatele') prepniPohled('uzivatele');
  if (location.hash === '#pridat') { prepniPohled('uzivatele'); otevriDialog('novy'); $('#pz-email').value = 'vedeni@example.com'; $('#pz-jmeno').value = 'Vedení restaurace'; $('#pz-generovat').click(); }
})();
