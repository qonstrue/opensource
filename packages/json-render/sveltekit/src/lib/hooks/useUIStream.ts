import { setByPath } from '@json-render/core';
import { writable, type Readable } from 'svelte/store';
import type { JsonPatch, UIElement, UITree } from '../types/index.js';

const isCommentLine = (line: string): boolean => {
  const trimmed = line.trim();
  return !trimmed || trimmed.startsWith('//');
};

const parsePatchLine = (line: string): JsonPatch | null => {
  if (isCommentLine(line)) {
    return null;
  }
  try {
    return JSON.parse(line.trim()) as JsonPatch;
  } catch {
    return null;
  }
};

const createElementWithUpdatedProp = (element: UIElement, propPath: string, value: unknown): UIElement => {
  const newElement = { ...element };
  setByPath(newElement as unknown as Record<string, unknown>, propPath, value);
  return newElement;
};

const removeElementFromTree = (tree: UITree, elementKey: string): UITree => {
  const { [elementKey]: _unusedElement, ...rest } = tree.elements;
  return { ...tree, elements: rest };
};

const updateRootInTree = (tree: UITree, newRoot: string): UITree => {
  return { ...tree, root: newRoot };
};

const addElementToTree = (tree: UITree, elementKey: string, element: UIElement): UITree => {
  return {
    ...tree,
    elements: { ...tree.elements, [elementKey]: element },
  };
};

const updateElementInTree = (tree: UITree, elementKey: string, updater: (element: UIElement) => UIElement): UITree => {
  const element = tree.elements[elementKey];
  if (!element) {
    return tree;
  }
  return {
    ...tree,
    elements: { ...tree.elements, [elementKey]: updater(element) },
  };
};

const extractElementKeyFromPath = (path: string): string | null => {
  const prefix = '/elements/';
  if (!path.startsWith(prefix)) {
    return null;
  }
  const afterPrefix = path.slice(prefix.length);
  const elementKey = afterPrefix.split('/')[0];
  return elementKey || null;
};

const extractPropertyPath = (path: string): string | null => {
  const prefix = '/elements/';
  if (!path.startsWith(prefix)) {
    return null;
  }
  const parts = path.slice(prefix.length).split('/');
  if (parts.length <= 1) {
    return null;
  }
  return '/' + parts.slice(1).join('/');
};

const applyRemovePatch = (tree: UITree, patch: JsonPatch): UITree => {
  const elementKey = extractElementKeyFromPath(patch.path);
  if (!elementKey) {
    return tree;
  }
  return removeElementFromTree(tree, elementKey);
};

const applySetPatch = (tree: UITree, patch: JsonPatch): UITree => {
  if (patch.path === '/root') {
    return updateRootInTree(tree, patch.value as string);
  }

  const elementKey = extractElementKeyFromPath(patch.path);
  if (!elementKey) {
    return tree;
  }

  const propertyPath = extractPropertyPath(patch.path);
  if (!propertyPath) {
    return addElementToTree(tree, elementKey, patch.value as UIElement);
  }

  return updateElementInTree(tree, elementKey, (element) =>
    createElementWithUpdatedProp(element, propertyPath, patch.value),
  );
};

const applyPatchToTree = (tree: UITree, patch: JsonPatch): UITree => {
  if (patch.op === 'remove') {
    return applyRemovePatch(tree, patch);
  }

  if (patch.op === 'set' || patch.op === 'add' || patch.op === 'replace') {
    return applySetPatch(tree, patch);
  }

  return tree;
};

export interface UseUIStreamOptions {
  api: string;
  onComplete?: (tree: UITree) => void;
  onError?: (error: Error) => void;
}

export interface UseUIStreamReturn {
  tree: Readable<UITree | null>;
  isStreaming: Readable<boolean>;
  error: Readable<Error | null>;
  send: (prompt: string, context?: Record<string, unknown>) => Promise<void>;
  clear: () => void;
}

const splitBufferIntoLines = (buffer: string): { completeLines: string[]; remaining: string } => {
  const lines = buffer.split('\n');
  const completeLines = lines.slice(0, -1);
  const remaining = lines[lines.length - 1] ?? '';
  return { completeLines, remaining };
};

const parsePatchesFromLines = (lines: string[]): JsonPatch[] => {
  return lines.map(parsePatchLine).filter((patch): patch is JsonPatch => patch !== null);
};

const applyPatchesToTree = (tree: UITree, patches: JsonPatch[]): UITree => {
  return patches.reduce((acc, patch) => applyPatchToTree(acc, patch), tree);
};

const processStreamChunk = (
  buffer: string,
  currentTree: UITree,
  _decoder: TextDecoder,
): { buffer: string; tree: UITree } => {
  const { completeLines, remaining } = splitBufferIntoLines(buffer);
  const patches = parsePatchesFromLines(completeLines);
  const updatedTree = applyPatchesToTree(currentTree, patches);

  return { buffer: remaining, tree: updatedTree };
};

const createEmptyTree = (): UITree => {
  return { root: '', elements: {} };
};

const createRequestPayload = (prompt: string, context: Record<string, unknown> | undefined, currentTree: UITree) => {
  return {
    prompt,
    context,
    currentTree,
  };
};

const validateResponse = (response: Response): void => {
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
};

const getResponseReader = (body: ReadableStream<Uint8Array> | null): ReadableStreamDefaultReader<Uint8Array> => {
  const reader = body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }
  return reader;
};

const processStreamReader = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (tree: UITree) => void,
): Promise<UITree> => {
  const decoder = new TextDecoder();
  let buffer = '';
  let currentTree = createEmptyTree();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const processed = processStreamChunk(buffer, currentTree, decoder);
    buffer = processed.buffer;
    currentTree = processed.tree;
    onChunk({ ...currentTree });
  }

  if (buffer.trim()) {
    const patch = parsePatchLine(buffer);
    if (patch) {
      currentTree = applyPatchToTree(currentTree, patch);
      onChunk({ ...currentTree });
    }
  }

  return currentTree;
};

const isAbortError = (error: unknown): boolean => {
  return (error as Error).name === 'AbortError';
};

const normalizeError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

export const useUIStream = ({ api, onComplete, onError }: UseUIStreamOptions): UseUIStreamReturn => {
  const treeStore = writable<UITree | null>(null);
  const isStreamingStore = writable<boolean>(false);
  const errorStore = writable<Error | null>(null);
  let abortController: AbortController | null = null;

  const clear = () => {
    treeStore.set(null);
    errorStore.set(null);
  };

  const send = async (prompt: string, context?: Record<string, unknown>) => {
    abortController?.abort();
    abortController = new AbortController();

    isStreamingStore.set(true);
    errorStore.set(null);

    const initialTree = createEmptyTree();
    treeStore.set(initialTree);

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequestPayload(prompt, context, initialTree)),
        signal: abortController.signal,
      });

      validateResponse(response);
      const reader = getResponseReader(response.body);

      const finalTree = await processStreamReader(reader, (tree) => {
        treeStore.set(tree);
      });

      onComplete?.(finalTree);
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      const error = normalizeError(err);
      errorStore.set(error);
      onError?.(error);
    } finally {
      isStreamingStore.set(false);
    }
  };

  return {
    tree: treeStore,
    isStreaming: isStreamingStore,
    error: errorStore,
    send,
    clear,
  };
};

const createElementFromFlat = (element: UIElement & { parentKey?: string | null }): UIElement => {
  return {
    key: element.key,
    type: element.type,
    props: element.props,
    children: [],
    visible: element.visible,
  };
};

const buildElementMap = (elements: (UIElement & { parentKey?: string | null })[]): Record<string, UIElement> => {
  return elements.reduce(
    (acc, element) => ({
      ...acc,
      [element.key]: createElementFromFlat(element),
    }),
    {} as Record<string, UIElement>,
  );
};

const updateParentWithChild = (
  elements: Record<string, UIElement>,
  parentKey: string,
  childKey: string,
): Record<string, UIElement> => {
  const parent = elements[parentKey];
  if (!parent) {
    return elements;
  }
  return {
    ...elements,
    [parentKey]: {
      ...parent,
      children: [...(parent.children || []), childKey],
    },
  };
};

const processElementForRelations = (
  acc: { elements: Record<string, UIElement>; root: string },
  element: UIElement & { parentKey?: string | null },
): { elements: Record<string, UIElement>; root: string } => {
  if (element.parentKey) {
    return {
      ...acc,
      elements: updateParentWithChild(acc.elements, element.parentKey, element.key),
    };
  }
  return {
    ...acc,
    root: element.key,
  };
};

const buildParentChildRelations = (
  elements: (UIElement & { parentKey?: string | null })[],
  elementMap: Record<string, UIElement>,
): { root: string; elements: Record<string, UIElement> } => {
  const initial = { elements: { ...elementMap }, root: '' };
  return elements.reduce(processElementForRelations, initial);
};

export const flatToTree = (elements: (UIElement & { parentKey?: string | null })[]): UITree => {
  const elementMap = buildElementMap(elements);
  const { root, elements: finalElements } = buildParentChildRelations(elements, elementMap);
  return { root, elements: finalElements };
};
