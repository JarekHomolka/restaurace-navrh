/* Přihlášení, role a pozvánky do administrace.

   UKÁZKA: v návrhu (statický web na GitHub Pages) se účty drží v prohlížeči (localStorage),
   aby šlo celý postup vyzkoušet bez serveru. Hesla se ani tady neukládají čitelně:
   ukládá se jen otisk PBKDF2-SHA256 se solí. Ochrana proti útočníkovi to ale není, protože
   kód i data jsou v prohlížeči. V ostrém webu dělá totéž server (Payload CMS), viz
   docs/prihlaseni-a-role.md. Názvy funkcí odpovídají tamním operacím.

   Role:
   - obsluha: denní menu, jídelní lístek, poptávky, fotky a texty
   - spravce: všechno jako obsluha + zve a spravuje uživatele, vidí záznam změn */

const Ucty = (() => {
  const KLIC = 'rnm-ucty-v1', KLIC_RELACE = 'rnm-relace-v1';
  const UKAZKA = true;                       // v ostrém webu neexistuje
  const MIN_DELKA_HESLA = 10;
  const MAX_POKUSU = 5, ZAMEK_MIN = 15;      // po 5 chybných heslech zámek na 15 minut
  const RELACE_HODIN = 12, RELACE_ZUSTAT_DNI = 30;
  const POZVANKA_DNI = 7, ODKAZ_HESLO_HODIN = 24;
  const ITERACE = 150000;

  const ROLE = {
    obsluha: { nazev: 'Obsluha', popis: 'Denní menu, jídelní lístek, poptávky, fotky a texty.' },
    spravce: { nazev: 'Správce', popis: 'Všechno jako obsluha. Navíc zve nové lidi, mění role a blokuje přístup.' },
  };

  /* Ukázkové účty (testovací hodnoty jen pro tento návrh) */
  const UKAZKOVE_UCTY = [
    { id: 'u1', jmeno: 'Správce webu', email: 'spravce@example.com', role: 'spravce', heslo: 'Ukazka-spravce-2026', posledni: '2026-11-24T19:12' },
    { id: 'u2', jmeno: 'Obsluha', email: 'obsluha@example.com', role: 'obsluha', heslo: 'Ukazka-obsluha-2026', posledni: '2026-11-25T08:41' },
  ];

  /* ---------- pomocné ---------- */
  const ted = () => new Date();
  const iso = (d) => d.toISOString();
  const normEmail = (e) => String(e || '').trim().toLowerCase();
  const platnyEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const nahodne = (n = 24) => b64(crypto.getRandomValues(new Uint8Array(n)));
  const chyba = (zprava, kod) => Object.assign(new Error(zprava), { kod });

  async function otisk(heslo, sul) {
    if (!(window.crypto && crypto.subtle)) throw chyba('Prohlížeč nepodporuje bezpečné ukládání hesel. Otevřete stránku přes https.', 'crypto');
    const klic = await crypto.subtle.importKey('raw', new TextEncoder().encode(heslo), 'PBKDF2', false, ['deriveBits']);
    const bity = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(sul), iterations: ITERACE }, klic, 256);
    return b64(bity);
  }
  async function overHeslo(u, heslo) {
    const h = await otisk(heslo, u.sul);
    let r = h.length ^ u.otisk.length;                       // porovnání bez předčasného konce
    for (let i = 0; i < Math.max(h.length, u.otisk.length); i++) r |= (h.charCodeAt(i) || 0) ^ (u.otisk.charCodeAt(i) || 0);
    return r === 0;
  }

  /* ---------- úložiště ---------- */
  function nacti() { try { return JSON.parse(localStorage.getItem(KLIC)) || null; } catch (e) { return null; } }
  function uloz(db) { try { localStorage.setItem(KLIC, JSON.stringify(db)); } catch (e) { /* bez úložiště */ } }
  function db() { const d = nacti(); if (!d) throw chyba('Účty nejsou připravené.', 'db'); return d; }

  async function pripravit() {
    if (nacti()) return;
    const uzivatele = [];
    for (const u of UKAZKOVE_UCTY) {
      const sul = nahodne(16);
      uzivatele.push({ id: u.id, jmeno: u.jmeno, email: u.email, role: u.role, stav: 'aktivni', sul, otisk: await otisk(u.heslo, sul), vytvoren: '2026-11-20T10:00', posledni: u.posledni });
    }
    const zaPet = new Date(Date.now() + 5 * 864e5);
    uloz({
      uzivatele,
      pozvanky: [{ token: nahodne(), typ: 'pozvanka', email: 'brigada@example.com', jmeno: 'Brigáda léto', role: 'obsluha', vytvoreno: '2026-11-23T16:20', platiDo: iso(zaPet), pozval: 'u1' }],
      pokusy: {},
      zaznam: [
        { kdy: '2026-11-25T08:43', kdo: 'Obsluha', co: 'Zveřejnění denního menu na 23.–27. 11.' },
        { kdy: '2026-11-23T16:20', kdo: 'Správce webu', co: 'Pozvánka pro brigada@example.com (obsluha)' },
        { kdy: '2026-11-20T10:05', kdo: 'Správce webu', co: 'Účet pro obsluha@example.com (obsluha)' },
      ],
    });
  }

  function zapis(co, kdo) {
    const d = nacti(); if (!d) return;
    const u = aktualni();
    d.zaznam.unshift({ kdy: iso(ted()).slice(0, 16), kdo: kdo || (u ? u.jmeno : 'Systém'), co });
    d.zaznam = d.zaznam.slice(0, 200);
    uloz(d);
  }

  /* ---------- relace ---------- */
  function aktualni() {
    let r; try { r = JSON.parse(localStorage.getItem(KLIC_RELACE)); } catch (e) { r = null; }
    if (!r || new Date(r.platiDo) < ted()) return null;
    const d = nacti(); if (!d) return null;
    const u = d.uzivatele.find((x) => x.id === r.id);
    // zablokovaný nebo odebraný uživatel je odhlášen hned, i když má platnou relaci
    if (!u || u.stav !== 'aktivni' || u.verze !== r.verze) return null;
    return { id: u.id, jmeno: u.jmeno, email: u.email, role: u.role };
  }
  function zalozRelaci(u, zustat) {
    const platiDo = new Date(Date.now() + (zustat ? RELACE_ZUSTAT_DNI * 864e5 : RELACE_HODIN * 36e5));
    try { localStorage.setItem(KLIC_RELACE, JSON.stringify({ id: u.id, verze: u.verze, platiDo: iso(platiDo) })); } catch (e) { /* nic */ }
  }
  function odhlasit() { try { localStorage.removeItem(KLIC_RELACE); } catch (e) { /* nic */ } }

  /* Na začátku každé stránky administrace: bez přihlášení (nebo bez role) přesměruje na přihlášení. */
  function vyzadujPrihlaseni(role) {
    const u = aktualni();
    if (u && (!role || u.role === role)) return u;
    document.documentElement.style.visibility = 'hidden';
    const zpet = location.pathname.split('/').pop() + location.search + location.hash;
    location.replace('prihlaseni.html' + (u ? '?chyba=role' : '?zpet=' + encodeURIComponent(zpet)));
    return null;
  }
  // Návrat po přihlášení jen na stránky administrace (žádné přesměrování ven)
  const bezpecnyNavrat = (z) => (/^admin\.html([?#][^\s]*)?$/.test(z || '') ? z : 'admin.html');

  async function prihlasit(email, heslo, zustat) {
    await pripravit();
    const d = db(), e = normEmail(email), p = d.pokusy[e] || { n: 0, do: null };
    if (p.do && new Date(p.do) > ted()) throw chyba(`Příliš mnoho pokusů. Zkuste to za ${Math.ceil((new Date(p.do) - ted()) / 6e4)} min, nebo požádejte správce o odkaz na nové heslo.`, 'zamceno');
    const u = d.uzivatele.find((x) => x.email === e);
    const ok = u ? await overHeslo(u, String(heslo || '')) : (await otisk(String(heslo || ''), 'x'), false); // stejná doba i pro neznámý e-mail
    if (!ok) {
      p.n = (p.do && new Date(p.do) <= ted()) ? 1 : p.n + 1; p.do = null;
      if (p.n >= MAX_POKUSU) { p.do = iso(new Date(Date.now() + ZAMEK_MIN * 6e4)); p.n = 0; }
      d.pokusy[e] = p; uloz(d);
      throw chyba(p.do ? `Příliš mnoho pokusů. Přihlášení je na ${ZAMEK_MIN} minut zamčené.` : 'E-mail nebo heslo nesedí.', p.do ? 'zamceno' : 'spatne');
    }
    if (u.stav === 'zablokovan') throw chyba('Tento účet je zablokovaný. Obraťte se na správce webu.', 'blok');
    delete d.pokusy[e]; u.posledni = iso(ted()).slice(0, 16); uloz(d);
    zalozRelaci(u, zustat);
    return aktualni();
  }

  /* ---------- správa uživatelů (jen správce) ---------- */
  function jenSpravce() { const u = aktualni(); if (!u || u.role !== 'spravce') throw chyba('Na to potřebujete roli správce.', 'role'); return u; }
  const aktivniSpravci = (d) => d.uzivatele.filter((x) => x.role === 'spravce' && x.stav === 'aktivni');
  const odkaz = (token) => new URL('pozvanka.html?t=' + token, location.href).href;

  function seznam() {
    jenSpravce();
    const d = db(), nyni = ted();
    return {
      uzivatele: d.uzivatele.map(({ sul, otisk: _o, ...u }) => u),
      pozvanky: d.pozvanky.filter((p) => p.typ === 'pozvanka').map((p) => ({ ...p, prosla: new Date(p.platiDo) < nyni, odkaz: odkaz(p.token) })),
    };
  }
  function pozvat({ email, jmeno, role }) {
    const ja = jenSpravce(), d = db(), e = normEmail(email);
    if (!platnyEmail(e)) throw chyba('Zadejte platný e-mail.', 'email');
    if (!ROLE[role]) throw chyba('Vyberte roli.', 'role');
    if (d.uzivatele.some((x) => x.email === e)) throw chyba('Tento e-mail už účet má.', 'existuje');
    d.pozvanky = d.pozvanky.filter((p) => !(p.typ === 'pozvanka' && p.email === e));   // starší pozvánka pro stejný e-mail přestane platit
    const p = { token: nahodne(), typ: 'pozvanka', email: e, jmeno: String(jmeno || '').trim(), role, vytvoreno: iso(ted()).slice(0, 16), platiDo: iso(new Date(Date.now() + POZVANKA_DNI * 864e5)), pozval: ja.id };
    d.pozvanky.push(p); uloz(d);
    zapis(`Pozvánka pro ${e} (${ROLE[role].nazev.toLowerCase()})`);
    return { ...p, odkaz: odkaz(p.token) };
  }
  function obnovitPozvanku(token) {
    jenSpravce(); const d = db(), p = d.pozvanky.find((x) => x.token === token); if (!p) throw chyba('Pozvánka už neexistuje.', 'nenalezeno');
    p.token = nahodne(); p.vytvoreno = iso(ted()).slice(0, 16); p.platiDo = iso(new Date(Date.now() + POZVANKA_DNI * 864e5)); uloz(d);
    zapis(`Nový odkaz pozvánky pro ${p.email}`);
    return { ...p, odkaz: odkaz(p.token) };
  }
  function zrusitPozvanku(token) {
    jenSpravce(); const d = db(), p = d.pozvanky.find((x) => x.token === token); if (!p) return;
    d.pozvanky = d.pozvanky.filter((x) => x.token !== token); uloz(d);
    zapis(`Zrušená pozvánka pro ${p.email}`);
  }
  function hlidejPoslednihoSpravce(d, u, novaRole, novyStav) {
    if (u.role === 'spravce' && u.stav === 'aktivni' && (novaRole !== 'spravce' || novyStav !== 'aktivni') && aktivniSpravci(d).length <= 1)
      throw chyba('Musí zůstat aspoň jeden aktivní správce.', 'posledni');
  }
  function zmenRoli(id, role) {
    const ja = jenSpravce(), d = db(), u = d.uzivatele.find((x) => x.id === id);
    if (!u || !ROLE[role]) throw chyba('Uživatel nenalezen.', 'nenalezeno');
    if (u.id === ja.id) throw chyba('Svou vlastní roli změnit nejde. Požádejte jiného správce.', 'sam');
    hlidejPoslednihoSpravce(d, u, role, u.stav);
    u.role = role; u.verze = (u.verze || 0) + 1; uloz(d);   // změna role ukončí jeho relaci
    zapis(`${u.email}: role ${ROLE[role].nazev.toLowerCase()}`);
  }
  function zablokovat(id, ano) {
    const ja = jenSpravce(), d = db(), u = d.uzivatele.find((x) => x.id === id);
    if (!u) throw chyba('Uživatel nenalezen.', 'nenalezeno');
    if (u.id === ja.id) throw chyba('Sami sebe zablokovat nemůžete.', 'sam');
    hlidejPoslednihoSpravce(d, u, u.role, ano ? 'zablokovan' : 'aktivni');
    u.stav = ano ? 'zablokovan' : 'aktivni'; u.verze = (u.verze || 0) + 1; uloz(d);
    zapis(`${u.email}: ${ano ? 'přístup zablokován' : 'přístup obnoven'}`);
  }
  function odebrat(id) {
    const ja = jenSpravce(), d = db(), u = d.uzivatele.find((x) => x.id === id);
    if (!u) return;
    if (u.id === ja.id) throw chyba('Svůj vlastní účet odebrat nemůžete.', 'sam');
    hlidejPoslednihoSpravce(d, u, null, null);
    d.uzivatele = d.uzivatele.filter((x) => x.id !== id); d.pozvanky = d.pozvanky.filter((p) => p.uzivatel !== id); uloz(d);
    zapis(`Odebraný účet ${u.email}`);
  }
  // Zapomenuté heslo: správce vytvoří jednorázový odkaz (v ostrém webu přijde uživateli e-mailem)
  function odkazNaNoveHeslo(id) {
    jenSpravce(); const d = db(), u = d.uzivatele.find((x) => x.id === id);
    if (!u) throw chyba('Uživatel nenalezen.', 'nenalezeno');
    d.pozvanky = d.pozvanky.filter((p) => !(p.typ === 'heslo' && p.uzivatel === id));
    const p = { token: nahodne(), typ: 'heslo', uzivatel: id, email: u.email, vytvoreno: iso(ted()).slice(0, 16), platiDo: iso(new Date(Date.now() + ODKAZ_HESLO_HODIN * 36e5)) };
    d.pozvanky.push(p); uloz(d);
    zapis(`Odkaz na nové heslo pro ${u.email}`);
    return { ...p, odkaz: odkaz(p.token) };
  }
  function zaznam(n = 12) { jenSpravce(); return db().zaznam.slice(0, n); }

  /* ---------- přijetí pozvánky / nastavení hesla ---------- */
  function kontrolaHesla(heslo, email) {
    if (String(heslo).length < MIN_DELKA_HESLA) return `Heslo musí mít aspoň ${MIN_DELKA_HESLA} znaků.`;
    if (normEmail(heslo) === normEmail(email) || /^(.)\1+$/.test(heslo) || /^(0123456789|1234567890|heslo|password|qwertz|qwerty)/i.test(heslo)) return 'Tohle heslo je moc snadné na uhodnutí.';
    return '';
  }
  async function najdiOdkaz(token) {
    await pripravit();
    const d = db(), p = d.pozvanky.find((x) => x.token === token);
    if (!p) return { chyba: 'Odkaz už neplatí. Buď byl použit, nebo ho správce zrušil.' };
    if (new Date(p.platiDo) < ted()) return { chyba: 'Platnost odkazu vypršela. Požádejte správce o nový.' };
    return { typ: p.typ, email: p.email, jmeno: p.jmeno || (d.uzivatele.find((u) => u.id === p.uzivatel) || {}).jmeno || '', role: p.role || (d.uzivatele.find((u) => u.id === p.uzivatel) || {}).role };
  }
  async function nastavitHeslo(token, { jmeno, heslo }) {
    const info = await najdiOdkaz(token); if (info.chyba) throw chyba(info.chyba, 'odkaz');
    const k = kontrolaHesla(heslo, info.email); if (k) throw chyba(k, 'heslo');
    const d = db(), p = d.pozvanky.find((x) => x.token === token), sul = nahodne(16), h = await otisk(heslo, sul);
    let u;
    if (p.typ === 'pozvanka') {
      if (!String(jmeno || '').trim()) throw chyba('Vyplňte jméno, ať ostatní vědí, kdo co upravil.', 'jmeno');
      if (d.uzivatele.some((x) => x.email === p.email)) throw chyba('Tento e-mail už účet má.', 'existuje');
      u = { id: 'u' + nahodne(6), jmeno: String(jmeno).trim(), email: p.email, role: p.role, stav: 'aktivni', sul, otisk: h, vytvoren: iso(ted()).slice(0, 16), posledni: iso(ted()).slice(0, 16), pozval: p.pozval };
      d.uzivatele.push(u);
    } else {
      u = d.uzivatele.find((x) => x.id === p.uzivatel); if (!u) throw chyba('Účet už neexistuje.', 'nenalezeno');
      u.sul = sul; u.otisk = h; u.verze = (u.verze || 0) + 1; u.posledni = iso(ted()).slice(0, 16);   // nové heslo odhlásí ostatní zařízení
    }
    d.pozvanky = d.pozvanky.filter((x) => x.token !== token);   // odkaz jde použít jen jednou
    delete d.pokusy[u.email];
    uloz(d);
    zalozRelaci(u, false);
    zapis(p.typ === 'pozvanka' ? `Přijatá pozvánka, nový účet ${u.email} (${ROLE[u.role].nazev.toLowerCase()})` : `Nové heslo pro ${u.email}`, u.jmeno);
    return aktualni();
  }
  async function zmenHeslo(stare, nove) {
    const ja = aktualni(); if (!ja) throw chyba('Nejste přihlášeni.', 'relace');
    const d = db(), u = d.uzivatele.find((x) => x.id === ja.id);
    if (!(await overHeslo(u, String(stare || '')))) throw chyba('Současné heslo nesedí.', 'spatne');
    const k = kontrolaHesla(nove, u.email); if (k) throw chyba(k, 'heslo');
    u.sul = nahodne(16); u.otisk = await otisk(nove, u.sul); u.verze = (u.verze || 0) + 1; uloz(d);
    zalozRelaci(u, false);
    zapis('Změna vlastního hesla');
  }

  function resetUkazky() { try { localStorage.removeItem(KLIC); localStorage.removeItem(KLIC_RELACE); } catch (e) { /* nic */ } }
  const ukazkoveHeslo = (role) => (UKAZKA ? (UKAZKOVE_UCTY.find((u) => u.role === role) || {}) : {});

  return { UKAZKA, ROLE, MIN_DELKA_HESLA, POZVANKA_DNI, pripravit, prihlasit, odhlasit, aktualni, vyzadujPrihlaseni, bezpecnyNavrat,
    seznam, pozvat, obnovitPozvanku, zrusitPozvanku, zmenRoli, zablokovat, odebrat, odkazNaNoveHeslo, zaznam, zapis,
    najdiOdkaz, nastavitHeslo, zmenHeslo, kontrolaHesla, resetUkazky, ukazkoveHeslo };
})();
