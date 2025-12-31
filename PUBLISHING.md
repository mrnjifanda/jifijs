# Guide de Publication - JifiJs

Ce guide explique comment publier les deux packages npm : `jifijs` (le template) et `create-jifijs` (le scaffolding tool).

## Structure du Projet

```
jifijs/
├── package.json              # Package principal (jifijs)
├── src/                      # Code source du template
├── utils/
├── configs/
├── routes/
└── packages/
    └── create-jifijs/
        ├── package.json      # Package create-jifijs
        └── src/
            └── index.ts      # CLI tool
```

## Prérequis

1. Compte npm : https://www.npmjs.com/signup
2. Authentification npm :
   ```bash
   npm login
   ```

## Publication des Packages

### 1. Publier le Template (jifijs)

Le package `jifijs` contient le template complet pour créer des projets.

```bash
# À la racine du projet
cd /path/to/jifijs

# Vérifier que tout est correct
npm run type-check
npm run build

# Vérifier le contenu du package
npm pack --dry-run

# Publier sur npm
npm publish
```

**Important** : Le script `prepublishOnly` va automatiquement :
- Vérifier les types TypeScript
- Builder le projet

**Ce qui sera publié** :
- Tous les fichiers sources (src/, utils/, configs/, routes/)
- Les templates d'emails
- Le générateur CLI (bin/)
- La documentation
- Les fichiers de configuration (.env.example, tsconfig.json, etc.)

### 2. Publier le CLI (create-jifijs)

Le package `create-jifijs` permet de créer de nouveaux projets avec `npx`.

```bash
# Aller dans le dossier create-jifijs
cd packages/create-jifijs

# Installer les dépendances (première fois seulement)
npm install

# Builder le projet
npm run build

# Vérifier le contenu
npm pack --dry-run

# Publier sur npm
npm publish
```

**Important** : Vous devez publier `jifijs` AVANT `create-jifijs` car ce dernier télécharge `jifijs` depuis npm.

## Ordre de Publication

**TOUJOURS suivre cet ordre** :

1. **Publier `jifijs` en premier**
   ```bash
   npm publish
   ```

2. **Attendre quelques minutes** (propagation npm)

3. **Publier `create-jifijs`**
   ```bash
   cd packages/create-jifijs
   npm publish
   ```

## Mise à Jour des Versions

### Pour une nouvelle version :

1. **Mettre à jour jifijs**
   ```bash
   # À la racine
   npm version patch  # ou minor, ou major
   git push --tags
   npm publish
   ```

2. **Mettre à jour create-jifijs** (si nécessaire)
   ```bash
   cd packages/create-jifijs
   npm version patch
   cd ../..
   git push --tags
   npm publish packages/create-jifijs
   ```

### Versioning Sémantique

- **PATCH** (0.1.0 → 0.1.1) : Bug fixes
- **MINOR** (0.1.0 → 0.2.0) : Nouvelles fonctionnalités (compatibles)
- **MAJOR** (0.1.0 → 1.0.0) : Breaking changes

## Tester Avant Publication

### Tester jifijs localement

```bash
# Créer un package local
npm pack

# Installer dans un projet test
mkdir ../test-project
cd ../test-project
npm install ../jifijs/jifijs-0.1.0.tgz
```

### Tester create-jifijs localement

```bash
cd packages/create-jifijs
npm run build

# Lier globalement
npm link

# Tester dans un nouveau dossier
cd /tmp
create-jifijs my-test-app
```

## Utilisation pour les Utilisateurs

### Créer un nouveau projet

```bash
# Méthode 1 : npx (recommandée)
npx create-jifijs my-project
cd my-project
npm run dev

# Méthode 2 : git clone (pour contributeurs)
git clone https://github.com/mrnjifanda/jifijs.git my-project
cd my-project
npm install
npm run dev
```

## Checklist de Publication

Avant chaque publication, vérifier :

- [ ] Tests passent : `npm test`
- [ ] Build réussit : `npm run build`
- [ ] Types valides : `npm run type-check`
- [ ] CHANGELOG.md mis à jour
- [ ] Version incrémentée dans package.json
- [ ] Git commit et push
- [ ] Git tag créé
- [ ] jifijs publié en premier
- [ ] create-jifijs publié ensuite
- [ ] Testé avec `npx create-jifijs`

## Dépublication (Urgence uniquement)

Si vous devez retirer une version publiée :

```bash
# Dépublier une version spécifique (dans les 72h)
npm unpublish jifijs@0.1.0

# OU déprécier une version
npm deprecate jifijs@0.1.0 "Please use version 0.1.1 instead"
```

**⚠️ Attention** : La dépublication est possible uniquement dans les 72h après publication.

## Support

- GitHub Issues : https://github.com/mrnjifanda/jifijs/issues
- Email : jifijs@njifanda.com

## Automatisation (Futur)

Pour automatiser avec GitHub Actions :

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{secrets.NPM_TOKEN}}
```

---

**Dernière mise à jour** : 2025-12-31
