# Zenith — mise en ligne permanente (2 à 3 minutes)

Zenith est une application **Next.js (App Router)** + **PostgreSQL (Drizzle ORM)**.
La synchronisation multi-appareils passe par vos propres routes API (`/api/space/...`),
donc **aucune clé publique n'est exposée dans le navigateur**.

Vous avez besoin de deux comptes gratuits : une base Postgres (Supabase ou Neon) et un
hébergeur (Vercel). Les deux acceptent « Continuer avec Google » — aucun mot de passe à retenir.

---

## Étape 1 — Créer la base de données (Supabase, gratuit)

1. Aller sur https://supabase.com → **Start your project** → **Continue with Google**
   (utilisez `anthony.costaduma@gmail.com`).
2. **New project** :
   - Name : `zenith`
   - Database Password : cliquez sur « Generate a password » puis **copiez-le**
   - Region : `Europe (Paris)` ou `Europe (Frankfurt)`
   - **Create new project** (≈ 1 minute de provisioning).
3. Une fois le projet prêt : bouton **Connect** (en haut) → onglet **Connection string** →
   sélectionner **Transaction pooler** (port `6543`) → copier l'URL. Elle ressemble à :

   ```
   postgresql://postgres.abcdefghijklm:VOTRE_MOT_DE_PASSE@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
   ```

   Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe généré à l'étape 2, puis ajoutez
   `?sslmode=require` à la fin.

> Variante encore plus rapide : https://neon.tech (Continue with Google → Create project →
> copier la « Connection string »). Le reste de la procédure est identique.

**Valeur à conserver : `DATABASE_URL`** (l'URL complète ci-dessus).

---

## Étape 2 — Publier le code sur GitHub

1. Créez un dépôt vide sur https://github.com/new (ex. `zenith`).
2. Depuis le dossier du projet :

   ```bash
   git init
   git add .
   git commit -m "Zenith"
   git branch -M main
   git remote add origin https://github.com/VOTRE_COMPTE/zenith.git
   git push -u origin main
   ```

---

## Étape 3 — Déployer sur Vercel (gratuit, lien permanent)

1. https://vercel.com → **Continue with GitHub**.
2. **Add New… → Project** → importez le dépôt `zenith`.
3. Dans **Environment Variables**, ajoutez :

   | Name           | Value                                    |
   | -------------- | ---------------------------------------- |
   | `DATABASE_URL` | l'URL Postgres copiée à l'étape 1        |

4. **Deploy**. Au bout d'une minute vous obtenez un lien permanent du type
   `https://zenith-xxxx.vercel.app` (vous pouvez le renommer dans *Settings → Domains*).

---

## Étape 4 — Ouvrir le lien

C'est tout : au premier appel de `/api/health` ou de l'API de synchronisation, Zenith crée
les tables manquantes automatiquement et de façon idempotente. Aucun SQL n'est à coller.

Pour la maintenance locale uniquement, le schéma Drizzle peut toujours être appliqué avec :

```bash
DATABASE_URL="postgresql://...votre_url..." npx drizzle-kit push
```

---

## Étape 5 — Vérifier la synchronisation

1. Ouvrez le lien sur l'ordinateur → menu **Synchroniser** → copiez le code `zen-xxxx-xxxx-xxxx`.
2. Ouvrez le même lien sur le téléphone → **Synchroniser** → collez le code → **Rejoindre**.
3. Ajoutez une tâche sur un appareil : elle apparaît sur l'autre en ~4 secondes.

---

## Développement local

```bash
npm install
echo 'DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db' > .env
npx drizzle-kit push
npm run dev
```

## Structure

```
src/
  app/
    page.tsx              Accueil (horloge, citation, rituel, stats)
    taches/               Tâches (priorités, étiquettes illimitées, archives)
    habitudes/            Habitudes (séries, 7 derniers jours)
    etudes/               Matières, notes pondérées, examens
    focus/                Minuteur Pomodoro
    moyenne/              Note de productivité (semaine / mois / année)
    suivi/                Poids + photos de progression
    api/space/[code]/     GET (pull) · POST (push + fusion serveur)
    api/space/[code]/photos  Upload photo (compressée côté client)
    api/photos/[id]       Lecture / suppression d'une photo
  components/store.tsx    État global, persistance locale, boucle de synchro
  lib/merge.ts            Fusion CRDT-like (par id + updatedAt + tombstones)
  lib/calc.ts             Tous les calculs (scores, séries, moyennes)
  db/schema.ts            Tables Drizzle
```
