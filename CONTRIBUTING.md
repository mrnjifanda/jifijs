# Contributing to JifiJs

First off, thank you for considering contributing to JifiJs! It's people like you that make JifiJs such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How Can I Contribute?](#how-can-i-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [jifijs@njifanda.com](mailto:jifijs@njifanda.com).

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 5.0
- Redis >= 6.x (optional, for caching and queues)
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/jifijs.git
   cd jifijs
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/mrnjifanda/jifijs.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Copy environment file:
   ```bash
   cp .env.example .env
   ```

6. Configure your `.env` file with local development settings

7. Start development server:
   ```bash
   npm run dev
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/mrnjifanda/jifijs/issues) to avoid duplicates.

When creating a bug report, include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (Node version, OS, etc.)
- Code samples or error messages

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:
- A clear and descriptive title
- Detailed description of the proposed functionality
- Explanation of why this enhancement would be useful
- Possible implementation approach (optional)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues where we need community help

### Pull Requests

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our [Coding Guidelines](#coding-guidelines)

3. Add tests for your changes

4. Ensure all tests pass:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

5. Commit your changes following [Commit Message Guidelines](#commit-message-guidelines)

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request against the `main` branch

## Pull Request Process

1. **Update Documentation**: Update the README.md or relevant documentation with details of changes
2. **Update Tests**: Add or update tests to cover your changes
3. **Update CHANGELOG**: Add your changes to CHANGELOG.md under "Unreleased" section
4. **Code Review**: Wait for code review and address any feedback
5. **CI Checks**: Ensure all CI checks pass
6. **Merge**: A maintainer will merge your PR once approved

### PR Requirements

- Clear description of changes
- All tests passing
- TypeScript compilation without errors
- ESLint checks passing
- No decrease in code coverage (if applicable)
- Documentation updated
- CHANGELOG.md updated

## Coding Guidelines

### TypeScript Style

- Use TypeScript for all new code
- Enable strict mode
- Provide proper type annotations
- Avoid using `any` type when possible
- Use interfaces for object shapes
- Use enums for fixed sets of values

### General Guidelines

- Follow existing code style
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic only
- Keep functions small and focused
- Use async/await over raw promises
- Handle errors appropriately
- Use early returns to reduce nesting

### Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── models/          # Database models
├── services/        # Business logic
└── types/           # TypeScript types

utils/
├── bases/           # Base classes
├── helpers/         # Utility functions
├── middlewares/     # Express middlewares
└── validations/     # Joi schemas

routes/              # Route definitions
configs/             # Configuration files
tests/               # Test files
```

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` with `I` prefix (e.g., `IUser`)
- Types: `PascalCase`

## Testing Guidelines

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error conditions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test path/to/test.test.ts
```

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```
feat(auth): add OAuth2 authentication

Implemented OAuth2 authentication flow with support for
Google and GitHub providers.

Closes #123
```

```
fix(cache): resolve memory leak in cache cleanup

Fixed interval not being cleared on shutdown causing
memory leaks in tests.
```

```
docs(readme): update installation instructions

Added Redis installation steps and clarified MongoDB
setup requirements.
```

### Scope

The scope should be the name of the affected module/component:
- `auth`
- `cache`
- `upload`
- `admin`
- `mail`
- etc.

## Questions?

Feel free to:
- Open an issue for discussion
- Email us at [jifijs@njifanda.com](mailto:jifijs@njifanda.com)
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the OSL-3.0 License.

---

Thank you for contributing to JifiJs!
