# Contributing to json-render-sveltekit

Thank you for your interest in contributing to json-render-sveltekit!

> This package is a Svelte/SvelteKit port of [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) by [Vercel Labs](https://github.com/vercel-labs/json-render).

## Development Setup

This package is part of an Nx monorepo. Follow these steps to get started:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/qonstrue/opensource.git
   cd opensource-components
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the package**:
   ```bash
   # Using Nx (recommended)
   pnpm exec nx build json-render-sveltekit
   
   # Or from package directory
   cd packages/json-render/sveltekit
   pnpm run build
   ```

4. **Run tests**:
   ```bash
   # Using Nx (recommended)
   pnpm exec nx test json-render-sveltekit
   
   # Or from package directory
   cd packages/json-render/sveltekit
   pnpm run test
   ```

5. **Type checking**:
   ```bash
   # Using Nx
   pnpm exec nx typecheck json-render-sveltekit
   
   # Or from package directory
   pnpm run typecheck
   ```

6. **Svelte check**:
   ```bash
   # Using Nx
   pnpm exec nx svelte-check json-render-sveltekit
   
   # Or from package directory
   pnpm run svelte-check
   ```

## Development Workflow

### Making Changes

1. **Fork the repository** and create a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** following the code style guidelines below

3. **Run tests** to ensure nothing breaks:
   ```bash
   pnpm exec nx test json-render-sveltekit
   ```

4. **Run svelte-check** to validate Svelte components:
   ```bash
   pnpm exec nx svelte-check json-render-sveltekit
   ```

5. **Build the package** to ensure it compiles:
   ```bash
   pnpm exec nx build json-render-sveltekit
   ```

### Running Affected Commands

Nx can run commands only on affected projects:

```bash
# Test only affected projects
pnpm exec nx affected -t test

# Build only affected projects
pnpm exec nx affected -t build

# Run all checks on affected projects
pnpm exec nx affected -t test build svelte-check
```

## Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with clear, descriptive commits
4. Add tests for new functionality
5. Ensure all tests pass: `pnpm exec nx test json-render-sveltekit`
6. Run svelte-check: `pnpm exec nx svelte-check json-render-sveltekit`
7. Update documentation if needed
8. Submit a pull request with a clear description

## Code Style

- **TypeScript**: Use TypeScript for all code
- **Svelte 5**: Follow Svelte 5 runes syntax (`$props()`, `$derived()`, etc.)
- **Formatting**: Code is formatted with Prettier (automatically on commit)
- **Naming**: Use descriptive names for functions and variables
- **Comments**: Add JSDoc comments for public APIs
- **Tests**: Write tests for new features and bug fixes

## Testing Guidelines

- **Unit tests**: Write tests for utilities and hooks using Vitest
- **Coverage**: Aim for good test coverage on new code
- **Test organization**: Group related tests with `describe` blocks
- **Assertions**: Use descriptive test names and clear assertions
- **Mocking**: Mock external dependencies appropriately

Example test structure:
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Project Structure

```
packages/json-render/sveltekit/
├── src/
│   ├── index.ts              # Main entry point
│   └── lib/
│       ├── components/       # Svelte components
│       ├── contexts/         # Context providers
│       ├── hooks/           # Composable hooks
│       ├── renderer/        # Renderer logic
│       ├── types/           # TypeScript types
│       └── utils/           # Utility functions
├── package.json
├── vite.config.mts          # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── svelte.config.js         # Svelte configuration
└── README.md
```

## Dependencies

- **Runtime**: `@json-render/core`, `svelte`
- **Dev**: `@sveltejs/vite-plugin-svelte`, `vite`, `vitest`, `svelte-check`, `typescript`, `zod`

## Svelte-Specific Guidelines

1. **Use Svelte 5 syntax**: Prefer runes over legacy syntax
2. **Type components**: Add proper TypeScript types to component props
3. **Store usage**: Use Svelte stores for reactive state
4. **Context API**: Use `setContext`/`getContext` for provider patterns
5. **Snippets**: Use Svelte 5 snippets for children rendering

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating a new one
- Provide clear reproduction steps for bugs
- Include relevant code snippets and error messages

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Credits

This package is based on [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) by Vercel Labs. When contributing, please maintain compatibility with the core concepts from the original implementation where applicable.
