# Test de mutation de sonde.js : injecte des défauts connus dans zyphro.fr (en mémoire, rien n'est modifié en ligne)
# et vérifie que chacun est détecté, plus un faux positif connu (texte blanc sur pastille sœur) qui doit rester absent.
# Lancer après toute modification de la sonde : python3 -I ~/.claude/skills/qualite-sites/test_sonde.py
import sys, json, time; import os; ICI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ICI)
import rendu
src = open(os.path.join(ICI, 'sonde.js')).read(); src = src[src.index('() =>'):]
s = rendu.Session()
s.outil("browser_resize", width=390, height=844)
s.outil("browser_navigate", url="https://zyphro.fr/")
s.outil("browser_evaluate", function="""() => { 
 const m = document.querySelector('main'), mk = (tag, id, txt, st) => { const e = document.createElement(tag); e.id = id; e.textContent = txt; Object.assign(e.style, st); m.prepend(e); return e; };
 mk('p', 'mut1', 'texte gris clair sur fond clair', {color: '#bfc3ca', fontSize: '16px'});
 const a = mk('a', 'mut2', 'x', {display: 'inline-block', width: '16px', height: '16px'}); a.href = '#';
 const a2 = document.createElement('a'); a2.href = '#'; a2.textContent = 'y'; Object.assign(a2.style, {display: 'inline-block', width: '16px', height: '16px'}); a.after(a2);
 const w = mk('div', 'mut7w', '', {position: 'relative', height: '40px'});
 const pill = document.createElement('i'); Object.assign(pill.style, {position: 'absolute', left: '0', top: '0', width: '200px', height: '40px', background: '#d63a41'}); w.append(pill);
 const t = document.createElement('span'); t.id = 'mut7'; t.textContent = 'onglet actif'; Object.assign(t.style, {position: 'relative', color: '#fff', fontSize: '16px'}); w.append(t);
 document.documentElement.setAttribute('data-theme', 'light');
 mk('div', 'mut3', 'large', {position: 'relative', left: '200px', width: '300px', height: '10px'});
 const i = document.createElement('img'); i.src = '/nexiste-pas.png'; m.prepend(i);
 const b = mk('a', 'mut5', 'bouton trop long ici', {display: 'inline-block', width: '60px', whiteSpace: 'normal'}); b.className = 'btn';
 mk('p', 'mut6', 'minuscule', {fontSize: '10px'});
 return 1; }""")
time.sleep(1.5)
r = rendu.resultat(s.outil("browser_evaluate", function=src))
s.outil("browser_close")
txt = json.dumps(r)
echecs = 'mut7' in json.dumps(r.get('contraste', []))
print('mut7 (faux positif attendu absent) :', 'RESTE SIGNALÉ' if echecs else 'ok, non signalé')
for k, cle in (('mut1', 'contraste'), ('mut2', 'cible_petite'), ('mut3', 'deborde'), ('mut4', 'image_cassee'), ('mut5', 'bouton_a_la_ligne'), ('mut6', 'texte_petit')):
    trouve = any((k in json.dumps(x)) or (k == 'mut4' and 'nexiste-pas' in json.dumps(x)) for x in r.get(cle, []))
    print(k, cle, 'DÉTECTÉ' if trouve else 'RATÉ')
    echecs |= not trouve
sys.exit(1 if echecs else 0)
