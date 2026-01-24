import type { Component, Snippet, SvelteComponent } from 'svelte';
import type { Action, UIElement, UITree } from '../types/index.js';

export interface ComponentRenderProps<P = Record<string, unknown>> {
  element: UIElement<string, P>;
  children?: Snippet;
  onAction?: (action: Action) => void;
  loading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRenderer<P = Record<string, unknown>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (new (...args: any[]) => SvelteComponent<ComponentRenderProps<P>>)
  | Component<ComponentRenderProps<P>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRegistry = Record<string, ComponentRenderer<any>>;

export interface RendererProps {
  tree: UITree | null;
  registry: ComponentRegistry;
  loading?: boolean;
  fallback?: ComponentRenderer;
}

export type ActionHandler<TParams = Record<string, unknown>, TResult = unknown> = (
  params: TParams,
) => Promise<TResult> | TResult;

export type ValidationFunction = (value: unknown, args?: Record<string, unknown>) => boolean;
