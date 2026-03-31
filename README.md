# 🌍 Spozzz — Deployment Guide

> Share what you love. Discover what matters.

---

## Was du brauchst (beides kostenlos)

| Service | Wozu | Link |
|---|---|---|
| **Supabase** | Datenbank + Login | supabase.com |
| **Vercel** | Hosting | vercel.com |
| **GitHub** | Code-Repository | github.com |

---

## Schritt 1 — Supabase einrichten (10 Min)

1. Geh auf **supabase.com** → „Start your project" → kostenlosen Account erstellen
2. Klick „New Project" → Name: `spozzz` → Passwort merken → Region: `Europe (Frankfurt)`
3. Warte bis das Projekt erstellt ist (~2 Min)
4. Geh zu **SQL Editor** (linkes Menü)
5. Klick „New Query" → kopiere den gesamten Inhalt von `supabase-schema.sql` → klick „Run"
6. Geh zu **Project Settings → API**
7. Kopiere:
   - `Project URL` → das ist dein `REACT_APP_SUPABASE_URL`
   - `anon public` Key → das ist dein `REACT_APP_SUPABASE_ANON_KEY`

---

## Schritt 2 — Code auf GitHub hochladen (5 Min)

1. Erstelle kostenlosen Account auf **github.com**
2. Klick „New Repository" → Name: `spozzz` → Public oder Private → „Create"
3. Lade alle Dateien aus diesem Ordner hoch:
   - Entweder per GitHub Desktop (empfohlen für Anfänger)
   - Oder per Drag & Drop im Browser

---

## Schritt 3 — Vercel deployment (5 Min)

1. Geh auf **vercel.com** → „Sign up with GitHub"
2. Klick „New Project" → wähle dein `spozzz` Repository → „Import"
3. Unter **Environment Variables** füge hinzu:
   ```
   REACT_APP_SUPABASE_URL    = https://DEIN_PROJEKT.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = DEIN_ANON_KEY
   ```
4. Klick „Deploy" → warte ~3 Minuten
5. ✅ Deine App ist live unter `spozzz-xyz.vercel.app`

---

## Schritt 4 — Eigene Domain (optional)

In Vercel: Settings → Domains → Add Domain → `spozzz.com`
DNS bei deinem Anbieter auf Vercel zeigen lassen.

---

## Als PWA auf iPhone installieren

1. Öffne die App-URL in Safari
2. Klick das Teilen-Icon (□↑)
3. „Zum Home-Bildschirm" → „Hinzufügen"
4. ✅ App-Icon erscheint wie eine native App

---

## Projektstruktur

```
spozzz/
├── public/
│   ├── index.html          # HTML-Einstiegspunkt
│   └── manifest.json       # PWA-Manifest
├── src/
│   ├── lib/
│   │   └── supabase.js     # Datenbank-Verbindung + alle Queries
│   ├── components/
│   │   ├── Layout.js       # Navigation + Menu-Wrapper
│   │   ├── SlideMenu.js    # Slide-in Menü
│   │   └── SpotCard.js     # Wiederverwendbare Spot-Karte
│   ├── pages/
│   │   ├── LoginPage.js    # Login + Registrierung
│   │   ├── HomePage.js     # Home mit 3 Sektionen
│   │   ├── FriendsPage.js  # Freunde + Anfragen + Suche
│   │   ├── SavedPage.js    # Gespeicherte Spots
│   │   ├── MySpozzzPage.js # Profil + eigene Spots
│   │   ├── AddSpotPage.js  # Spot hinzufügen
│   │   ├── DetailPage.js   # Spot-Detail
│   │   └── FriendProfilePage.js # Freundesprofil
│   ├── App.js              # Router + Auth-Context
│   └── index.css           # Globales CSS (exaktes Prototyp-Design)
├── supabase-schema.sql     # ← Dieses SQL in Supabase ausführen!
├── .env.example            # Umgebungsvariablen-Vorlage
├── vercel.json             # Vercel-Konfiguration
└── package.json            # Dependencies
```

---

## Lokale Entwicklung

```bash
# 1. Dependencies installieren
npm install

# 2. .env.local erstellen
cp .env.example .env.local
# → Deine Supabase-Keys einfügen

# 3. Starten
npm start
# → App läuft auf http://localhost:3000
```

---

## Datenbank-Übersicht

| Tabelle | Inhalt |
|---|---|
| `profiles` | Nutzerprofile (auto-erstellt beim Signup) |
| `spots` | Alle Spozzz (mit Foto, Ort, Kategorie, Sichtbarkeit) |
| `likes` | Wer hat welchen Spot geliked |
| `saves` | Wer hat welchen Spot gespeichert |
| `follows` | Wer folgt wem |
| `friend_requests` | Offene/akzeptierte Freundschaftsanfragen |

Storage Bucket `spot-photos` für Fotos wird automatisch erstellt.
