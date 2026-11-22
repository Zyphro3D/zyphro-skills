#!/usr/bin/env python3
"""Contrôle au rendu d'une page publique via un serveur Playwright MCP en HTTP (variable PLAYWRIGHT_MCP).

Pour chaque largeur et chaque thème : charge la page, fait défiler pour déclencher les apparitions,
lance sonde.js, garde le résultat. Captures d'écran à 390 et 1440 px dans les deux thèmes.
Usage : python3 -I rendu.py URL [DOSSIER_SORTIE] [fr|en]   (sortie par défaut : ./rendu-<hôte>)
La langue est posée dans localStorage (zy-lang ; zc-lang pour ZCoach) : le navigateur du conteneur est en anglais.
Bibliothèque standard seulement. Écrit resultats.json + captures PNG dans le dossier de sortie.
"""
import base64, json, os, re, sys, time, urllib.parse, urllib.request

MCP = os.environ.get("PLAYWRIGHT_MCP", "http://localhost:8931/mcp")
LARGEURS = [(320, 700), (390, 844), (768, 1024), (1280, 800), (1440, 900), (1920, 1080)]
CAPTURES = {390, 1440}
THEMES = ["dark", "light"]
ICI = os.path.dirname(os.path.abspath(__file__))

# Défilement lent jusqu'en bas : les apparitions .rv (classe « in ») se déclenchent à l'écran et restent ;
# trop rapide, la capture pleine page montre des sections vides. Renvoie les .rv jamais apparus.
DEFILER = """async () => {
  const pas = Math.max(200, innerHeight * 0.5);
  for (let y = 0; y < document.documentElement.scrollHeight; y += pas) { scrollTo(0, y); await new Promise(r => setTimeout(r, 300)); }
  scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 800));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  return document.querySelectorAll('.rv:not(.in)').length;
}"""


class Session:
    def __init__(self):
        self.sid, self.n = None, 0
        self.appel("initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                                  "clientInfo": {"name": "qualite-sites", "version": "1"}})
        self.envoi({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def envoi(self, corps):
        h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.sid:
            h["Mcp-Session-Id"] = self.sid
        with urllib.request.urlopen(urllib.request.Request(MCP, json.dumps(corps).encode(), h), timeout=120) as r:
            self.sid = self.sid or r.headers.get("mcp-session-id")
            data = [l[5:].strip() for l in r.read().decode().splitlines() if l.startswith("data:")]
        return json.loads(data[-1]) if data else None

    def appel(self, methode, params):
        self.n += 1
        rep = self.envoi({"jsonrpc": "2.0", "id": self.n, "method": methode, "params": params})
        if rep and "error" in rep:
            raise RuntimeError(f"{methode}: {rep['error']}")
        return rep["result"] if rep else None

    def outil(self, nom, **args):
        res = self.appel("tools/call", {"name": nom, "arguments": args})
        if res.get("isError"):
            raise RuntimeError(f"{nom}: {res['content'][0].get('text', '')[:300]}")
        return res["content"]


def resultat(contenu):
    texte = contenu[0]["text"]
    m = re.search(r"### Result\n(.*?)\n### ", texte, re.S)
    return json.loads(m.group(1) if m else texte)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    url = sys.argv[1]
    sortie = sys.argv[2] if len(sys.argv) > 2 else "rendu-" + urllib.parse.urlparse(url).hostname
    langue = sys.argv[3] if len(sys.argv) > 3 else ""
    os.makedirs(sortie, exist_ok=True)
    sonde = open(os.path.join(ICI, "sonde.js")).read()
    sonde = sonde[sonde.index("() =>"):]
    s = Session()
    tout = []
    for theme in THEMES:
        # Préférences posées avant le chargement mesuré : la page s'ouvre déjà dans le bon thème et la bonne langue
        s.outil("browser_navigate", url=url)
        s.outil("browser_evaluate", function=f"() => {{ try {{ localStorage.setItem('zy-theme', '{theme}'); "
                f"{f'localStorage.setItem(\"zy-lang\", \"{langue}\"); localStorage.setItem(\"zc-lang\", \"{langue}\"); ' if langue else ''}}} catch (e) {{}} return 1; }}")
        for l, h in LARGEURS:
            s.outil("browser_resize", width=l, height=h)
            # Cloudflare répond parfois 403/429 à des chargements rapprochés : ne jamais sonder une page d'erreur
            for essai in range(3):
                s.outil("browser_navigate", url=url)
                titre = resultat(s.outil("browser_evaluate", function="() => document.title"))
                if not re.match(r"\s*(4\d\d|5\d\d)\b|Just a moment|Attention Required", str(titre)):
                    break
                print(f"{theme:5} {l:4} px : page d'erreur « {titre} », nouvel essai dans 20 s", flush=True)
                time.sleep(20)
            else:
                sys.exit(f"page d'erreur persistante ({titre}) : contrôle interrompu, aucun verdict")
            s.outil("browser_evaluate", function=f"() => {{ document.documentElement.setAttribute('data-theme', '{theme}'); return 1; }}")
            jamais_apparus = resultat(s.outil("browser_evaluate", function=DEFILER))
            r = resultat(s.outil("browser_evaluate", function=sonde))
            r["largeur"], r["theme"], r["rv_jamais_apparus"] = l, theme, jamais_apparus
            tout.append(r)
            if l in CAPTURES:
                for bloc in s.outil("browser_take_screenshot", type="png", fullPage=True):
                    if bloc.get("type") == "image":
                        chemin = os.path.join(sortie, f"{theme}-{l}.png")
                        open(chemin, "wb").write(base64.b64decode(bloc["data"]))
            print(f"{theme:5} {l:4} px : " + ", ".join(
                f"{k}={len(v) + r.get(k + '_plus', 0)}" for k, v in r.items() if isinstance(v, list)) or "rien", flush=True)
    s.outil("browser_close")
    json.dump({"url": url, "passes": tout}, open(os.path.join(sortie, "resultats.json"), "w"), ensure_ascii=False, indent=1)
    print(f"→ {os.path.abspath(sortie)}/resultats.json")


if __name__ == "__main__":
    main()
