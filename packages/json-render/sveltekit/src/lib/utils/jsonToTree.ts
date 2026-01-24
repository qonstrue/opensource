import type { ZodError } from 'zod';
import type { Catalog, UIElement, UITree } from '../types/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCatalog = Catalog<any, any, any>;

export interface JsonToTreeValidationResult {
  success: boolean;
  tree: UITree | null;
  errors: ZodError[] | null;
}

type ElementValidationResult =
  | { success: true; element: UIElement; error: null }
  | { success: false; element: null; error: ZodError };

const validateElement = (
  element: unknown,
  catalog: AnyCatalog,
  elementPath: readonly string[] = [],
): ElementValidationResult => {
  if (typeof element !== 'object' || element === null) {
    return {
      success: false,
      element: null,
      error: new Error(`Element at ${elementPath.join('.')} must be an object`) as unknown as ZodError,
    };
  }

  const el = element as Record<string, unknown>;

  if (typeof el.type !== 'string') {
    return {
      success: false,
      element: null,
      error: new Error(`Element at ${elementPath.join('.')} must have a 'type' string`) as unknown as ZodError,
    };
  }

  const componentDef = catalog.components[el.type];
  if (!componentDef) {
    return {
      success: false,
      element: null,
      error: new Error(
        `Unknown component type '${el.type}' at ${elementPath.join('.')}. Available types: ${Object.keys(catalog.components).join(', ')}`,
      ) as unknown as ZodError,
    };
  }

  const propsResult = componentDef.props.safeParse(el.props);
  if (!propsResult.success) {
    return {
      success: false,
      element: null,
      error: propsResult.error,
    };
  }

  const validatedElement: UIElement = {
    key: typeof el.key === 'string' ? el.key : `${el.type}-${elementPath.length}`,
    type: el.type,
    props: propsResult.data,
    children: Array.isArray(el.children) ? (el.children as string[]) : undefined,
    visible: el.visible as UIElement['visible'],
  };

  return {
    success: true,
    element: validatedElement,
    error: null,
  };
};

const parseJsonFormat = (json: unknown): { rootElement: unknown; elementsMap: Record<string, unknown> } | null => {
  if (typeof json === 'object' && json !== null && 'root' in json && 'elements' in json) {
    const tree = json as { root: string; elements: Record<string, unknown> };
    return {
      rootElement: tree.elements[tree.root],
      elementsMap: tree.elements,
    };
  }

  if (typeof json === 'object' && json !== null && 'type' in json) {
    const key = (json as { key?: string }).key || 'root';
    return {
      rootElement: json,
      elementsMap: { [key]: json },
    };
  }

  if (Array.isArray(json) && json.length > 0) {
    const elementsMap = json.reduce(
      (acc, el, idx) => {
        const key = (el as { key?: string }).key || `element-${idx}`;
        return { ...acc, [key]: el };
      },
      {} as Record<string, unknown>,
    );
    return {
      rootElement: json[0],
      elementsMap,
    };
  }

  return null;
};

const validateAllElements = (
  elementsMap: Record<string, unknown>,
  catalog: AnyCatalog,
): {
  validatedElements: Record<string, UIElement>;
  errors: ZodError[];
} => {
  const entries = Object.entries(elementsMap);
  const results = entries.map(([key, element]) => ({
    key,
    result: validateElement(element, catalog, [key]),
  }));

  const validatedElements = results.reduce(
    (acc, { key, result }) => {
      if (result.success) {
        return { ...acc, [key]: result.element };
      }
      return acc;
    },
    {} as Record<string, UIElement>,
  );

  const errors = results
    .map(({ result }) => (result.success ? null : result.error))
    .filter((error): error is ZodError => error !== null);

  return { validatedElements, errors };
};

const validateChildrenReferences = (validatedElements: Record<string, UIElement>): ZodError[] => {
  return Object.entries(validatedElements).flatMap(([key, element]) => {
    if (!element.children) {
      return [];
    }

    const invalidChildren = element.children.filter((childKey) => !validatedElements[childKey]);

    if (invalidChildren.length === 0) {
      return [];
    }

    return [
      new Error(`Element '${key}' references invalid children: ${invalidChildren.join(', ')}`) as unknown as ZodError,
    ];
  });
};

const determineRootKey = (rootElement: unknown, validatedElements: Record<string, UIElement>): string | null => {
  if (
    typeof rootElement === 'object' &&
    rootElement !== null &&
    'key' in rootElement &&
    typeof (rootElement as { key: unknown }).key === 'string'
  ) {
    const key = (rootElement as { key: string }).key;
    return validatedElements[key] ? key : null;
  }

  const firstKey = Object.keys(validatedElements)[0];
  return firstKey || null;
};

export const jsonToTree = (json: unknown, catalog: AnyCatalog): JsonToTreeValidationResult => {
  const parsed = parseJsonFormat(json);

  if (!parsed) {
    return {
      success: false,
      tree: null,
      errors: [
        new Error('JSON must be a UITree object, a single UIElement, or an array of UIElements') as unknown as ZodError,
      ],
    };
  }

  const { rootElement, elementsMap } = parsed;

  if (!rootElement) {
    return {
      success: false,
      tree: null,
      errors: [new Error('No root element found') as unknown as ZodError],
    };
  }

  const { validatedElements, errors: elementErrors } = validateAllElements(elementsMap, catalog);

  const childrenErrors = validateChildrenReferences(validatedElements);

  const allErrors = [...elementErrors, ...childrenErrors];

  if (allErrors.length > 0) {
    return {
      success: false,
      tree: null,
      errors: allErrors,
    };
  }

  const rootKey = determineRootKey(rootElement, validatedElements);

  if (!rootKey) {
    return {
      success: false,
      tree: null,
      errors: [new Error('Could not determine valid root element') as unknown as ZodError],
    };
  }

  const tree: UITree = {
    root: rootKey,
    elements: validatedElements,
  };

  return {
    success: true,
    tree,
    errors: null,
  };
};

export const jsonToTreeOrThrow = (json: unknown, catalog: AnyCatalog): UITree => {
  const result = jsonToTree(json, catalog);
  if (!result.success || !result.tree) {
    const errorMessages = result.errors?.map((err) => (err instanceof Error ? err.message : String(err))).join('\n');
    throw new Error(`JSON validation failed:\n${errorMessages || 'Unknown error'}`);
  }
  return result.tree;
};
