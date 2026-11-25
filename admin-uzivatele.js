/* Administrace: můj účet, odhlášení a správa uživatelů (sekce Uživatelé jen pro roli správce).
   Data a pravidla jsou v auth.js, tady je jen obrazovka. */

(function () {
  const ja = Ucty.aktualni();
  if (!ja) return;   // auth.js už přesměrovává na přihlášení
  const jeSpravce = ja.role === 'spravce';
  const datum = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const kratce = (s) => { if (!s) return ''; const d = new Date(s); return `${d.getDate()}. ${d.getMonth() + 1}.`; };

  /* ---------- hlavička a můj účet ---------- */
  $('#ucet-jmeno').textContent = ja.jmeno;
  $$('[data-jen="spravce"]').forEach((el) => { el.hidden = !jeSpravce; });
  const dUcet = $('#dlg-ucet');
  $('#b-ucet').addEventListener('click', () => {
    $('#ucet-info-jmeno').textContent = ja.jmeno;
    $('#ucet-info-email').textContent = ja.email;
    $('#ucet-info-role').textContent = `Role: ${Ucty.ROLE[ja.role].nazev}. ${Ucty.ROLE[ja.role].popis}`;
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
      dUcet.close(); toast('✓ Heslo je změněné.');
    } catch (err) { $('#ucet-chyba').textContent = err.message; }
    b.disabled = false;
  });
  // Odhlášení i v jiné záložce (nebo zablokování správcem) se projeví hned
  // (v ostrém webu to hlídá server u každého uložení)
  const hlidej = () => { const u = Ucty.aktualni(); if (!u || u.id !== ja.id || u.role !== ja.role) location.replace('prihlaseni.html'); };
  window.addEventListener('storage', (e) => { if (e.key === 'rnm-relace-v1' || e.key === 'rnm-ucty-v1') hlidej(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hlidej(); });
  setInterval(hlidej, 60000);

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
          <div class="uz-meta"><span class="badge${u.role === 'spravce' ? '' : ' green'}">${Ucty.ROLE[u.role].nazev}</span>${blok ? '<span class="badge seda">Zablokovaný</span>' : ''}<span>${u.posledni ? 'naposledy přihlášen ' + datum(u.posledni) : 'zatím se nepřihlásil'}</span></div>
        </div>
        ${sam ? '<div class="uz-akce"><span class="uz-meta">Svůj účet upravíte vpravo nahoře.</span></div>' : `<div class="uz-akce">
          <label class="sr" for="r-${esc(u.id)}">Role</label>
          <select id="r-${esc(u.id)}" data-a="role">${Object.entries(Ucty.ROLE).map(([k, r]) => `<option value="${k}"${k === u.role ? ' selected' : ''}>${r.nazev}</option>`).join('')}</select>
          <button class="btn btn-ghost btn-sm" data-a="heslo">Odkaz na nové heslo</button>
          <button class="btn btn-ghost btn-sm" data-a="blok">${blok ? 'Obnovit přístup' : 'Zablokovat'}</button>
          ${blok ? '<button class="btn btn-ghost btn-sm" data-a="odebrat">Odebrat</button>' : ''}
        </div>`}
      </div>`;
    }).join('');
    $('#uz-pozvanky-nadpis').hidden = !pozvanky.length;
    $('#uz-pozvanky').innerHTML = pozvanky.map((p) => `<div class="uz" data-token="${esc(p.token)}">
        <div style="display:grid;gap:6px;min-width:0">
          <div class="uz-hlava"><h3>${esc(p.jmeno || p.email)}</h3>${p.jmeno ? `<span class="em">${esc(p.email)}</span>` : ''}</div>
          <div class="uz-meta"><span class="badge${p.role === 'spravce' ? '' : ' green'}">${Ucty.ROLE[p.role].nazev}</span><span class="badge ${p.prosla ? 'seda' : 'gold'}">${p.prosla ? 'Platnost vypršela' : 'Platí do ' + kratce(p.platiDo)}</span><span>pozváno ${datum(p.vytvoreno)}</span></div>
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
  async function kopiruj(text) {
    try { await navigator.clipboard.writeText(text); toast('✓ Odkaz je zkopírovaný.'); }
    catch (e) { ukazOdkaz({ nadpis: 'Odkaz', odkaz: text, text: 'Označte odkaz a zkopírujte ho.' }); }
  }

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
      if (a === 'heslo') {
        const r = zkus(() => Ucty.odkazNaNoveHeslo(id));
        if (r) ukazOdkaz({ nadpis: `Odkaz na nové heslo pro ${jm}`, odkaz: r.odkaz, text: 'Platí 24 hodin a jde použít jen jednou. V ostrém webu ho pošleme e-mailem automaticky.' });
      }
    }
    if (pz) {
      const token = pz.dataset.token;
      if (a === 'kopirovat') kopiruj(Ucty.seznam().pozvanky.find((p) => p.token === token).odkaz);
      if (a === 'znovu') { const r = zkus(() => Ucty.obnovitPozvanku(token)); if (r) ukazOdkaz({ nadpis: 'Nový odkaz pozvánky', odkaz: r.odkaz, text: 'Starý odkaz už neplatí. Nový platí 7 dní.' }); }
      if (a === 'zrusit' && confirm('Zrušit pozvánku? Odkaz přestane platit.')) zkus(() => Ucty.zrusitPozvanku(token), 'Pozvánka je zrušená.');
    }
  });

  /* ---------- pozvat ---------- */
  const dPoz = $('#dlg-pozvat');
  function ukazOdkaz({ nadpis, odkaz, text }) {
    $('#pozvat-pole').hidden = true; $('#pozvat-ok').hidden = true;
    $('#pozvat-form > h2').textContent = nadpis; $('#pozvat-form > p:not(.dlg-chyba)').hidden = true;
    $('#pozvat-vysledek').hidden = false; $('#pozvat-vysledek-nadpis').hidden = true;
    $('#pozvat-odkaz').value = odkaz; $('#pozvat-vysledek-text').textContent = text;
    $('#pozvat-kopirovat').hidden = false; $('#pozvat-zavrit').textContent = 'Hotovo';
    if (!dPoz.open) dPoz.showModal();
    $('#pozvat-odkaz').select();
  }
  function otevriPozvani() {
    $('#pozvat-form').reset(); $('#pozvat-chyba').textContent = '';
    $('#pozvat-form > h2').textContent = 'Pozvat do administrace'; $('#pozvat-form > p:not(.dlg-chyba)').hidden = false;
    $('#pozvat-pole').hidden = false; $('#pozvat-ok').hidden = false; $('#pozvat-vysledek').hidden = true; $('#pozvat-vysledek-nadpis').hidden = false;
    $('#pozvat-kopirovat').hidden = true; $('#pozvat-zavrit').textContent = 'Zrušit';
    dPoz.showModal(); $('#pz-email').focus();
  }
  $('#b-pozvat').addEventListener('click', otevriPozvani);
  $('#pozvat-zavrit').addEventListener('click', () => dPoz.close());
  $('#pozvat-kopirovat').addEventListener('click', () => kopiruj($('#pozvat-odkaz').value));
  $('#pozvat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const p = Ucty.pozvat({ email: $('#pz-email').value, jmeno: $('#pz-jmeno').value, role: $('#pozvat-form').querySelector('[name="pz-role"]:checked').value });
      vykresli();
      ukazOdkaz({ nadpis: 'Pozvánka je připravená', odkaz: p.odkaz, text: `Pro ${p.email}, platí 7 dní. V ostrém webu ji pošleme e-mailem automaticky. V ukázce odkaz zkopírujte a otevřete třeba v anonymním okně.` });
    } catch (err) { $('#pozvat-chyba').textContent = err.message; }
  });

  $('#b-reset-ucty').addEventListener('click', () => {
    if (!confirm('Vrátit ukázkové účty do původního stavu? Pozvaní lidé a změny hesel z této ukázky zmizí a odhlásíte se.')) return;
    Ucty.resetUkazky(); location.replace('prihlaseni.html');
  });

  vykresli();
  $$('[data-view="uzivatele"]').forEach((b) => b.addEventListener('click', vykresli));
  if (location.hash === '#uzivatele') prepniPohled('uzivatele');
  if (location.hash === '#pozvat') { prepniPohled('uzivatele'); otevriPozvani(); $('#pz-email').value = 'kuchar@example.com'; $('#pz-jmeno').value = 'Kuchař'; }
})();
