# json-render-sveltekit

**Predictable. Guardrailed. Fast.** Svelte/SvelteKit renderer for user-prompted dashboards, widgets, apps, and data visualizations.

> This package is a Svelte/SvelteKit port of [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) by [Vercel Labs](https://github.com/vercel-labs/json-render). All core functionality and concepts are derived from the original React implementation.

## Features

- **Visibility Filtering**: Components automatically show/hide based on visibility conditions
- **Action Handling**: Built-in action execution with confirmation dialogs
- **Validation**: Field validation with error display
- **Data Binding**: Two-way data binding between UI and data model
- **Streaming**: Progressive rendering from streamed UI trees

## Installation

```bash
pnpm add json-render-sveltekit @json-render/core
# or
npm install json-render-sveltekit @json-render/core
```

## Quick Start

### Basic Setup

```svelte
<script lang="ts">
  import { JSONUIProvider, Renderer, useUIStream } from 'json-render-sveltekit';
  import { get } from 'svelte/store';

  // Define your component registry
  const registry = {
    Card: ({ element, children }) => ({
      render: () => (
        <div class="card">
          <h3>{element.props.title}</h3>
          {#if children}
            {@render children()}
          {/if}
        </div>
      ),
    }),
    Button: ({ element, onAction }) => ({
      render: () => (
        <button onclick={() => onAction?.(element.props.action)}>
          {element.props.label}
        </button>
      ),
    }),
  };

  // Action handlers
  const actionHandlers = {
    submit: async (params) => {
      await api.submit(params);
    },
    export: (params) => {
      download(params.format);
    },
  };

  const { tree, isStreaming, send, clear } = useUIStream({
    api: '/api/generate',
  });

  const $tree = get(tree);
  const $isStreaming = get(isStreaming);
</script>

<JSONUIProvider
  {registry}
  initialData={{ user: { name: 'John' } }}
  authState={{ isSignedIn: true }}
  {actionHandlers}
>
  <input
    placeholder="Describe the UI..."
    onkeydown={(e) => e.key === 'Enter' && send(e.target.value)}
  />
  <Renderer tree={$tree} {registry} loading={$isStreaming} />
</JSONUIProvider>
```

### Using Contexts Directly

```svelte
<script lang="ts">
  import {
    DataProvider,
    VisibilityProvider,
    ActionProvider,
    ValidationProvider,
    useData,
    useVisibility,
    useActions,
    useFieldValidation,
    useDataBinding,
  } from 'json-render-sveltekit';
  import { get } from 'svelte/store';

  // Data context
  function MyComponent() {
    const { data, get: getValue, set } = useData();
    const value = getValue('/user/name');
    const $value = get(value);

    return {
      render: () => (
        <input
          value={$value}
          oninput={(e) => set('/user/name', e.target.value)}
        />
      ),
    };
  }

  // Visibility context
  function ConditionalComponent({ visible }) {
    const { isVisible } = useVisibility();
    const $isVisible = get(isVisible(visible));

    if (!$isVisible) {
      return null;
    }
    return { render: () => <div>Visible content</div> };
  }

  // Action context
  function ActionButton({ action }) {
    const { execute, loadingActions } = useActions();
    const $loadingActions = get(loadingActions);

    return {
      render: () => (
        <button
          onclick={() => execute(action)}
          disabled={$loadingActions.has(action.name)}
        >
          {action.name}
        </button>
      ),
    };
  }

  // Validation context
  function ValidatedInput({ path, checks }) {
    const { errors, validate, touch } = useFieldValidation(path, { checks });
    const [value, setValue] = useDataBinding(path);
    const $errors = get(errors);
    const $value = get(value);

    return {
      render: () => (
        <div>
          <input
            value={$value}
            oninput={(e) => setValue(e.target.value)}
            onblur={() => {
              touch();
              validate();
            }}
          />
          {#each $errors as err}
            <span>{err}</span>
          {/each}
        </div>
      ),
    };
  }
</script>
```

### Streaming UI

```svelte
<script lang="ts">
  import { useUIStream } from 'json-render-sveltekit';
  import { get } from 'svelte/store';

  const {
    tree,        // Current UI tree
    isStreaming, // Whether currently streaming
    error,       // Error if any
    send,        // Send a prompt
    clear,       // Clear the tree
  } = useUIStream({
    api: '/api/generate',
    onComplete: (tree) => console.log('Done:', tree),
    onError: (err) => console.error('Error:', err),
  });

  const $tree = get(tree);
  const $isStreaming = get(isStreaming);
</script>

<div>
  <button onclick={() => send('Create a dashboard')}>
    Generate
  </button>
  {#if $isStreaming}
    <span>Generating...</span>
  {/if}
  {#if $tree}
    <Renderer tree={$tree} {registry} />
  {/if}
</div>
```

## API Reference

### Providers

- `JSONUIProvider` - Combined provider for all contexts
- `DataProvider` - Data model context
- `VisibilityProvider` - Visibility evaluation context
- `ActionProvider` - Action execution context
- `ValidationProvider` - Validation context

### Hooks

All hooks return Svelte stores (use `get()` or `$` prefix to access values):

- `useData()` - Access data model
- `useDataValue(path)` - Get a single value
- `useDataBinding(path)` - Two-way binding (returns tuple like `useState`)
- `useVisibility()` - Access visibility evaluation
- `useIsVisible(condition)` - Check if condition is visible
- `useActions()` - Access action execution
- `useAction(action)` - Execute a specific action
- `useValidation()` - Access validation context
- `useFieldValidation(path, config)` - Field-level validation

### Components

- `Renderer` - Render a UI tree
- `ConfirmDialog` - Default confirmation dialog

### Utilities

- `useUIStream(options)` - Hook for streaming UI generation
- `flatToTree(elements)` - Convert flat list to tree

## Component Props

Components in your registry receive these props:

```typescript
interface ComponentRenderProps<P = Record<string, unknown>> {
  element: UIElement<string, P>; // The element definition
  children?: Snippet;            // Rendered children (Svelte snippet)
  onAction?: (action: Action) => void; // Action callback
  loading?: boolean;             // Streaming in progress
}
```

## Example Component

```svelte
<script lang="ts">
  import type { ComponentRenderProps } from 'json-render-sveltekit';
  import { useDataValue } from 'json-render-sveltekit';
  import { get } from 'svelte/store';

  type Props = ComponentRenderProps<{
    label: string;
    valuePath: string;
    format?: 'currency' | 'number';
  }>;

  let { element }: Props = $props();

  const value = useDataValue(element.props.valuePath);
  const $value = get(value);

  const formatted = $derived.by(() => {
    if (element.props.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format($value as number);
    }
    return String($value);
  });
</script>

<div class="metric">
  <span class="label">{element.props.label}</span>
  <span class="value">{formatted}</span>
</div>
```

## Key Differences from React Version

If you're migrating from `@json-render/react`:

1. **Hooks return Svelte stores**: Use `get()` or `$` prefix to access values instead of direct values
2. **Context providers**: Built on Svelte's `setContext`/`getContext` API
3. **Component registry**: Components receive `Snippet` for children instead of `ReactNode`
4. **Event handlers**: Use `onclick`, `oninput` etc. instead of `onClick`, `onInput`
5. **Conditional rendering**: Use `{#if}` blocks instead of `&&` or ternary operators

## Credits

This package is a Svelte/SvelteKit port of [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) created by [Vercel Labs](https://github.com/vercel-labs/json-render). The original React implementation and all core concepts were developed by the Vercel team.

## License

MIT

## Related Packages

- [`@json-render/core`](https://www.npmjs.com/package/@json-render/core) - Core JSON render types and utilities
- [`@json-render/react`](https://www.npmjs.com/package/@json-render/react) - Original React implementation
