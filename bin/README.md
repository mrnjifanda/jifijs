# 🚀 Code Generator

Générateur de code automatique pour accélérer le développement de votre application Express + TypeScript.

## 📋 Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Types de fichiers](#types-de-fichiers)
- [Options](#options)
- [Exemples](#exemples)
- [Structure générée](#structure-générée)

## 🔧 Installation

Aucune installation nécessaire ! Le générateur est déjà inclus dans le projet.

## 💻 Utilisation

```bash
npm run g <type> <name> [--folder <folder>]
```

### Arguments

- `<type>` : Type de fichier à générer (voir ci-dessous)
- `<name>` : Nom de la ressource (en kebab-case ou camelCase)
- `[--folder]` : Dossier de destination (optionnel, par défaut: `app`)

## 📁 Types de fichiers

| Raccourci | Type complet | Description |
|-----------|--------------|-------------|
| `t` | `type` | Génère une interface TypeScript |
| `c` | `controller` | Génère un contrôleur |
| `s` | `service` | Génère un service |
| `m` | `model` | Génère un modèle Mongoose |
| `r` | `route` | Génère un fichier de routes |
| `v` | `validation` | Génère un fichier de validation Joi |
| - | `resource` | Génère tous les fichiers ci-dessus |
| - | `all` | Alias de `resource` |

## ⚙️ Options

### --folder, -f

Spécifie le dossier de destination pour le contrôleur, service et routes.

**Valeurs possibles :**
- `app` (par défaut) - Pour les fonctionnalités utilisateur
- `admin` - Pour les fonctionnalités administrateur
- `auth` - Pour les fonctionnalités d'authentification

## 📝 Exemples

### Générer un contrôleur uniquement

```bash
npm run g c product
# ou
npm run g controller product
```

Génère : `src/controllers/app/product.controller.ts`

### Générer un service uniquement

```bash
npm run g s product
# ou
npm run g service product
```

Génère : `src/services/app/product.service.ts`

### Générer une ressource complète

```bash
npm run g resource product
# ou
npm run g all product
```

Génère :
- `src/types/product.types.ts`
- `src/models/product.model.ts`
- `src/services/app/product.service.ts`
- `src/controllers/app/product.controller.ts`
- `routes/app/product.route.ts`
- `utils/validations/product.validation.ts`

### Générer dans un dossier spécifique

```bash
npm run g resource category --folder admin
# ou
npm run g all category -f admin
```

Génère dans le dossier `admin` :
- `src/types/category.types.ts`
- `src/models/category.model.ts`
- `src/services/admin/category.service.ts`
- `src/controllers/admin/category.controller.ts`
- `routes/admin/category.route.ts`
- `utils/validations/category.validation.ts`

### Générer uniquement les types

```bash
npm run g t product
# ou
npm run g type product
```

Génère : `src/types/product.types.ts`

## 🏗️ Structure générée

### Type (Interface TypeScript)

```typescript
export interface IProduct extends BaseDocument {
  name: string;
  description?: string;
  status: 'product_status_active' | 'product_status_inactive';
}

export enum ProductStatus {
  ACTIVE = 'product_status_active',
  INACTIVE = 'product_status_inactive',
}
```

### Controller

```typescript
class ProductController extends BaseController {
  async index(req: Request, res: Response, _next: NextFunction) {}
  async show(req: Request, res: Response, _next: NextFunction) {}
  async store(req: Request, res: Response, _next: NextFunction) {}
  async update(req: Request, res: Response, _next: NextFunction) {}
  async destroy(req: Request, res: Response, _next: NextFunction) {}
}
```

### Service

```typescript
class ProductService extends BaseService<IProduct> {
  // Méthodes héritées de BaseService:
  // - getAll()
  // - getById()
  // - create()
  // - update()
  // - delete()

  // Ajoutez vos méthodes personnalisées ici
}
```

### Model (Mongoose)

```typescript
const Product: Model<IProduct> = BaseSchema<IProduct>('products', {
  name: { type: String, required: true, index: true },
  description: { type: String, required: false },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
});
```

### Route

```typescript
router.get('/', validation.getAll, productController.index);
router.get('/:id', validation.getById, productController.show);
router.post('/', validation.create, productController.store);
router.put('/:id', validation.update, productController.update);
router.delete('/:id', validation.destroy, productController.destroy);
```

### Validation

```typescript
const getAll = (req, res, next) => {
  Validation(req.query, {
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
  }, res, next);
};
```

## 🎯 Bonnes pratiques

1. **Nommage** : Utilisez des noms singuliers (ex: `product`, pas `products`)
2. **Convention** : Utilisez le kebab-case ou camelCase (ex: `user-profile` ou `userProfile`)
3. **Organisation** : Utilisez les dossiers appropriés (`app`, `admin`, `auth`)
4. **Personnalisation** : Adaptez les fichiers générés à vos besoins spécifiques

## ⚠️ Notes importantes

- Les fichiers existants ne seront **jamais écrasés** - le générateur les ignore avec un avertissement
- Personnalisez les templates dans `bin/templates.js` selon vos besoins
- N'oubliez pas d'ajouter vos routes dans `routes.ts` après génération

## 🐛 Dépannage

### Le générateur ne fonctionne pas

Vérifiez que le fichier `bin/cli` est exécutable :

```bash
chmod +x bin/cli
```

### Erreur "Type not found"

Vérifiez que vous utilisez un type valide. Lancez `npm run g` sans arguments pour voir la liste.

## 📚 Exemples d'utilisation complets

### Créer un CRUD complet pour "Article"

```bash
# 1. Générer tous les fichiers
npm run g all article

# 2. Ajouter la route dans routes.ts
# { path: '/articles', route: '/app/article', middlewares: [xApiKey, isLogin] }

# 3. Personnaliser le modèle, service et contrôleur selon vos besoins

# 4. Tester les endpoints
# GET    /articles
# GET    /articles/:id
# POST   /articles
# PUT    /articles/:id
# DELETE /articles/:id
```

---

**Développé avec ❤️ pour accélérer votre développement !**
