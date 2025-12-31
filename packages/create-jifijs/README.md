# create-jifijs

Scaffolding tool for creating new JifiJs projects.

## Usage

### With npx (Recommended)

```bash
npx create-jifijs my-project
cd my-project
npm run dev
```

### With npm

```bash
npm create jifijs my-project
cd my-project
npm run dev
```

### Interactive Mode

If you don't provide a project name, you'll be prompted to enter one:

```bash
npx create-jifijs
```

## What's Included

When you create a new project with create-jifijs, you get:

- **Full TypeScript Setup** - Strict type checking enabled
- **Express.js 5** - Latest version with all modern features
- **MongoDB Integration** - Mongoose ODM pre-configured
- **Redis Caching** - Built-in caching layer with fallback
- **JWT Authentication** - Complete auth system with refresh tokens
- **Role-Based Access Control** - Admin/User roles
- **File Upload System** - Secure file handling
- **Email Templates** - Handlebars templates with queue
- **Code Generator** - CLI tool for rapid development
- **API Documentation** - Swagger/OpenAPI auto-generated
- **Testing Suite** - Jest pre-configured
- **Security Features** - Helmet, CORS, rate limiting
- **Developer Tools** - ESLint, hot reload, logging

## Next Steps

After creating your project:

1. **Configure Environment**
   ```bash
   nano .env
   ```
   Update MongoDB URI, Redis connection, JWT secrets, etc.

2. **Start Development**
   ```bash
   npm run dev
   ```

3. **Generate Code**
   ```bash
   npm run g resource product
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0
- Redis >= 6.x (optional, for caching)

## Documentation

Full documentation available at [https://jifijs.njifanda.com](https://jifijs.njifanda.com)

## Support

- GitHub Issues: [https://github.com/mrnjifanda/jifijs/issues](https://github.com/mrnjifanda/jifijs/issues)
- Email: [jifijs@njifanda.com](mailto:jifijs@njifanda.com)

## License

OSL-3.0
