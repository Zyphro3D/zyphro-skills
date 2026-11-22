// Sonde exécutée dans la page par Playwright (browser_evaluate). Mesure ce qu'un rendu réel peut trancher,
// renvoie un objet JSON. Règles et sources : REGLES.md. Aucune dépendance, aucune requête réseau.
() => {
  const MAX = 15, vw = innerWidth, vh = innerHeight, out = {vw, vh, theme: document.documentElement.getAttribute('data-theme') || 'système'};
  const cut = (s, n = 60) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const sel = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) return s + '#' + el.id;
    const c = [...el.classList].slice(0, 2).join('.');
    return (el.parentElement && el.parentElement !== document.body ? sel(el.parentElement) + ' > ' : '') + s + (c ? '.' + c : '');
  };
  const visible = el => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05;
  };
  const hidden = el => el.closest('[aria-hidden="true"]');
  const push = (k, v) => { (out[k] = out[k] || []).length < MAX ? out[k].push(v) : out[k + '_plus'] = (out[k + '_plus'] || 0) + 1; };

  // Éléments porteurs de texte (au moins un nœud texte direct non vide)
  const textEls = [...document.body.querySelectorAll('*')].filter(el =>
    !['SCRIPT', 'STYLE', 'NOSCRIPT', 'svg'].includes(el.tagName) &&
    [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && visible(el));

  // Débordement horizontal (320 px sans défilement latéral). body en overflow-x:hidden masque le
  // scrollWidth : on cherche aussi les éléments qui sortent de l'écran, hors conteneurs à défilement.
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) out.debordement = {scrollWidth: sw, vw};
  const defile = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) if (/auto|scroll|hidden|clip/.test(getComputedStyle(e).overflowX)) return true; return false; };
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > vw + 1 || r.left < -1) && visible(el) && !hidden(el) && !defile(el)) push('deborde', {el: sel(el), gauche: Math.round(r.left), droite: Math.round(r.right)});
  }

  // Contraste texte / fond réellement rendu (WCAG 1.4.3)
  const rgba = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = c => { const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const fond = el => {
    const pile = [];
    let approx = false;
    // Ce qui est peint sous le texte : la pile réelle au centre de l'élément s'il est à l'écran (voit une
    // pastille sœur, comme l'onglet actif du dock), sinon la chaîne des parents.
    // Grain de html/body ignoré (texture). Verre translucide : composé sur ce qu'il y a dessous,
    // en supposant un fond uni derrière (vrai sur nos pages) ; le constat est alors marqué approx.
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dessous = null;
    if (cx >= 0 && cy >= 0 && cx < vw && cy < vh) {
      const pile0 = document.elementsFromPoint(cx, cy), i = pile0.indexOf(el);
      if (i >= 0) dessous = pile0.slice(i).filter(e => e === el || !el.contains(e));
    }
    if (!dessous) { dessous = []; for (let e = el; e; e = e.parentElement) dessous.push(e); }
    for (const e of dessous) {
      const cs = getComputedStyle(e), racine = e === document.body || e === document.documentElement;
      const c = rgba(cs.backgroundColor);
      if (!racine && /gradient|url\(/.test(cs.backgroundImage)) return null;
      if (cs.backdropFilter && cs.backdropFilter !== 'none' && !(c && c[3] >= 0.85)) approx = true;
      if (c && c[3] > 0) { pile.push(c); if (c[3] >= 1) break; }
    }
    let b = rgba(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1];
    if (b[3] < 1) b = over(b, [255, 255, 255, 1]);
    for (const c of pile.reverse()) b = over(c, b);
    return {b, approx};
  };
  let mesures = 0, nonMesurables = 0;
  for (const el of textEls) {
    if (hidden(el) || el.closest('[aria-disabled="true"],:disabled')) continue; // contrôles inactifs exemptés (WCAG 1.4.3)
    const cs = getComputedStyle(el), f = fond(el);
    if (!f) { nonMesurables++; continue; }
    const bg = f.b;
    let fg = rgba(cs.color); if (!fg) continue;
    fg = over(fg, bg);
    const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a), ratio = (l1 + 0.05) / (l2 + 0.05);
    const px = parseFloat(cs.fontSize), grand = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), seuil = grand ? 3 : 4.5;
    mesures++;
    if (ratio < seuil) push(f.approx ? 'contraste_approx' : 'contraste', {el: sel(el), texte: cut(el.textContent, 40), ratio: +ratio.toFixed(2), seuil});
  }
  out.contraste_mesures = mesures; out.contraste_non_mesurables = nonMesurables;

  // Taille du texte : < 12 px hors libellés mono de la charte (9-11 px), < 9 px toujours
  for (const el of textEls) {
    const cs = getComputedStyle(el), px = parseFloat(cs.fontSize), mono = /mono/i.test(cs.fontFamily);
    if (px < 9 || (px < 12 && !mono)) push('texte_petit', {el: sel(el), px, mono, decor: !!hidden(el), texte: cut(el.textContent, 30)});
  }

  // Cibles : < 24 px toujours (WCAG 2.5.8, sauf exception d'espacement), < 44 px sur téléphone (charte §5)
  const cibles = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[tabindex]:not([tabindex="-1"])')].filter(el => visible(el) && !hidden(el));
  const boites = cibles.map(el => el.getBoundingClientRect());
  // Exception d'espacement : un cercle de 24 px centré sur la cible ne touche aucune autre cible
  const espacee = i => { const a = boites[i], cx = a.left + a.width / 2, cy = a.top + a.height / 2;
    return boites.every((b, j) => j === i || Math.hypot(Math.max(b.left - cx, 0, cx - b.right), Math.max(b.top - cy, 0, cy - b.bottom)) >= 12); };
  for (const [i, el] of cibles.entries()) {
    const r = boites[i], mini = Math.min(r.width, r.height);
    const enLigne = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p,li');
    if (mini < 24 && !enLigne && !espacee(i)) push('cible_petite', {el: sel(el), l: Math.round(r.width), h: Math.round(r.height)});
    else if (vw <= 620 && mini < 43.5 && !enLigne) push('cible_tactile', {el: sel(el), l: Math.round(r.width), h: Math.round(r.height)});
  }

  // Bouton ou lien de navigation dont le libellé passe à la ligne
  for (const el of document.querySelectorAll('.btn,button,nav a,.dock a,.bar a')) {
    if (!visible(el) || [...el.querySelectorAll('*')].some(c => /block|flex|grid/.test(getComputedStyle(c).display))) continue;
    const rg = document.createRange(); rg.selectNodeContents(el);
    const lignes = new Set([...rg.getClientRects()].filter(r => r.width > 1).map(r => Math.round(r.top)));
    if (lignes.size > 1) push('bouton_a_la_ligne', {el: sel(el), texte: cut(el.textContent, 30)});
  }

  // Texte recouvert par un autre texte (hors parents/enfants)
  // Les éléments fixés (barre, dock) passent au-dessus du contenu par construction : exclus
  const fixe = el => { for (let e = el; e; e = e.parentElement) if (/fixed|sticky/.test(getComputedStyle(e).position)) return true; return false; };
  const blocs = textEls.filter(el => !hidden(el) && !fixe(el)).slice(0, 500).map(el => ({el, r: el.getBoundingClientRect()}));
  for (let i = 0; i < blocs.length; i++) for (let j = i + 1; j < blocs.length; j++) {
    const a = blocs[i], b = blocs[j];
    if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (x > 4 && y > 4) push('texte_recouvert', {a: sel(a.el), b: sel(b.el)});
  }

  // Premier écran : titre, phrase et action principale visibles sans défiler
  const h1 = document.querySelector('h1'), cta = document.querySelector('.btn.primary,.hero .btn,.hero a');
  out.premier_ecran = {
    h1: h1 ? (h1.getBoundingClientRect().bottom <= vh ? 'visible' : 'sous le pli') : 'absent',
    action: cta ? (cta.getBoundingClientRect().bottom <= vh ? 'visible' : 'sous le pli') : 'absente',
  };

  // Feuilles de style : focus, mouvement réduit, transition: all
  const css = {focus_visible: 0, outline_sans_remplacement: [], reduced_motion: 0, transition_all: []};
  const parcours = regles => { for (const r of regles) {
    if (r.media && /prefers-reduced-motion/.test(r.media.mediaText)) css.reduced_motion++;
    if (r.cssRules) parcours(r.cssRules);
    if (!r.selectorText) continue;
    if (/:focus-visible/.test(r.selectorText)) css.focus_visible++;
    if (/(^|[^-])outline\s*:\s*(none|0)/.test(r.cssText) && !/:focus-visible/.test(r.selectorText) && /:focus/.test(r.selectorText)) css.outline_sans_remplacement.push(r.selectorText);
    if (/transition(-property)?\s*:\s*all/.test(r.cssText)) css.transition_all.push(r.selectorText);
  } };
  for (const s of document.styleSheets) { try { parcours(s.cssRules); } catch (e) { css.feuille_illisible = (css.feuille_illisible || 0) + 1; } }
  out.css = css;

  // En-tête de document, zoom, images, SVG, ressources externes
  const vp = document.querySelector('meta[name=viewport]')?.content || '';
  out.doc = {
    lang: document.documentElement.lang || 'ABSENT', title: cut(document.title) || 'ABSENT',
    description: document.querySelector('meta[name=description]') ? 'ok' : 'ABSENTE',
    zoom_bloque: /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(vp),
  };
  for (const im of document.images) {
    if (!im.hasAttribute('alt')) push('image_sans_alt', im.currentSrc || im.src);
    if (im.complete && im.naturalWidth === 0) push('image_cassee', im.currentSrc || im.src);
    if (!im.getAttribute('width') || !im.getAttribute('height')) push('image_sans_dimensions', im.currentSrc || im.src);
  }
  for (const s of document.querySelectorAll('svg')) {
    if (hidden(s) || s.closest('a,button')?.getAttribute('aria-label')) continue;
    if (!s.getAttribute('role') && !s.getAttribute('aria-label') && !s.querySelector('title')) push('svg_sans_aria_hidden', sel(s));
  }
  for (const r of performance.getEntriesByType('resource')) {
    try { const u = new URL(r.name); if (/^https?:$/.test(u.protocol) && u.origin !== location.origin) push('ressource_externe', r.name); } catch (e) {}
  }
  return out;
}
