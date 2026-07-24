# CentralScore — Worker proxy Sportmonks

Acest Worker ține cheia ta API Sportmonks secretă. Site-ul static (GitHub Pages)
apelează acest Worker, iar Worker-ul adaugă cheia și cere datele de la Sportmonks.

## Pași de deploy (5 minute, gratuit)

1. Creează cont pe https://dash.cloudflare.com (dacă nu ai deja).
2. În dashboard, mergi la **Workers & Pages** → **Create** → **Create Worker**.
3. Dă-i un nume, ex. `centralscore-proxy`, apasă **Deploy** (versiunea implicită).
4. Apasă **Edit code** și înlocuiește tot conținutul cu fișierul `worker.js` din acest folder.
5. Salvează și dă **Deploy**.
6. Mergi la **Settings** → **Variables and Secrets** → adaugă un secret:
   - Name: `SPORTMONKS_TOKEN`
   - Value: cheia ta API de la Sportmonks (cea generată la pasul "API Tokens")
7. Notează URL-ul Worker-ului, ceva de forma:
   `https://centralscore-proxy.<subdomeniul-tau>.workers.dev`

## Conectarea la aplicație

În `app/.env.production`, adaugă:

```
VITE_API_BASE=https://centralscore-proxy.<subdomeniul-tau>.workers.dev
```

Apoi rebuild aplicația. Odată configurat, bannerul "Mod demo" dispare automat
și aplicația va cere date reale prin Worker.

## Notă despre CORS

Worker-ul e restricționat implicit să accepte cereri doar de la
`https://byot36.github.io`. Dacă testezi local, adaugă temporar
`http://localhost:5173` (sau portul tău) în `ALLOWED_ORIGIN` din `worker.js`.
