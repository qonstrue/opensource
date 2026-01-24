import { describe, it, expect } from 'vitest';
import { createCatalog } from '@json-render/core';
import { z } from 'zod';
import { jsonToTree, jsonToTreeOrThrow, type JsonToTreeValidationResult } from './jsonToTree.js';
import type { UITree, UIElement } from '../types/index.js';

const testCatalog = createCatalog({
  components: {
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string().optional(),
      }),
      hasChildren: false,
    },
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      hasChildren: true,
    },
    Text: {
      props: z.object({
        content: z.string(),
      }),
      hasChildren: false,
    },
  },
  actions: {},
});

describe('jsonToTree', () => {
  describe('UITree format', () => {
    it('should parse a valid UITree object', () => {
      const json: UITree = {
        root: 'button-1',
        elements: {
          'button-1': {
            key: 'button-1',
            type: 'Button',
            props: {
              label: 'Click me',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).toEqual(json);
      expect(result.errors).toBeNull();
    });

    it('should parse a UITree with multiple elements', () => {
      const json: UITree = {
        root: 'card-1',
        elements: {
          'card-1': {
            key: 'card-1',
            type: 'Card',
            props: {
              title: 'My Card',
            },
            children: ['text-1'],
          },
          'text-1': {
            key: 'text-1',
            type: 'Text',
            props: {
              content: 'Hello World',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).toEqual(json);
      expect(result.errors).toBeNull();
    });
  });

  describe('Single UIElement format', () => {
    it('should parse a single element with key', () => {
      const json: UIElement = {
        key: 'button-1',
        type: 'Button',
        props: {
          label: 'Submit',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).not.toBeNull();
      expect(result.tree?.root).toBe('button-1');
      expect(result.tree?.elements['button-1']).toEqual(json);
      expect(result.errors).toBeNull();
    });

    it('should parse a single element without key and generate one', () => {
      const json = {
        type: 'Button',
        props: {
          label: 'Click',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).not.toBeNull();
      expect(result.tree?.root).toBe('root');
      expect(result.tree?.elements['root'].type).toBe('Button');
      expect(result.tree?.elements['root'].props).toEqual(json.props);
      expect(result.errors).toBeNull();
    });
  });

  describe('Array format', () => {
    it('should parse an array of elements', () => {
      const json = [
        {
          key: 'card-1',
          type: 'Card',
          props: {
            title: 'First Card',
          },
        },
        {
          key: 'button-1',
          type: 'Button',
          props: {
            label: 'Action',
          },
        },
      ];

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).not.toBeNull();
      expect(result.tree?.root).toBe('card-1');
      expect(result.tree?.elements['card-1']).toEqual(json[0]);
      expect(result.tree?.elements['button-1']).toEqual(json[1]);
      expect(result.errors).toBeNull();
    });

    it('should generate keys for array elements without keys', () => {
      const json = [
        {
          type: 'Button',
          props: {
            label: 'First',
          },
        },
        {
          type: 'Text',
          props: {
            content: 'Second',
          },
        },
      ];

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree).not.toBeNull();
      expect(result.tree?.root).toBe('element-0');
      expect(result.tree?.elements['element-0'].type).toBe('Button');
      expect(result.tree?.elements['element-1'].type).toBe('Text');
      expect(result.errors).toBeNull();
    });
  });

  describe('Invalid input formats', () => {
    it('should reject null input', () => {
      const result = jsonToTree(null, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject string input', () => {
      const result = jsonToTree('invalid', testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should reject number input', () => {
      const result = jsonToTree(123, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should reject empty array', () => {
      const result = jsonToTree([], testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should reject empty object', () => {
      const result = jsonToTree({}, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });
  });

  describe('Schema validation', () => {
    it('should validate props against component schema', () => {
      const json = {
        key: 'button-1',
        type: 'Button',
        props: {
          label: 'Valid Button',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject invalid props', () => {
      const json = {
        key: 'button-1',
        type: 'Button',
        props: {
          label: 123, // Should be string
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject missing required props', () => {
      const json = {
        key: 'button-1',
        type: 'Button',
        props: {},
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should accept optional props', () => {
      const json = {
        key: 'button-1',
        type: 'Button',
        props: {
          label: 'Click',
          action: 'submit',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should accept elements with optional description', () => {
      const json = {
        key: 'card-1',
        type: 'Card',
        props: {
          title: 'My Card',
          description: 'Optional description',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('Component type validation', () => {
    it('should reject unknown component types', () => {
      const json = {
        key: 'unknown-1',
        type: 'UnknownComponent',
        props: {
          someProp: 'value',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
      expect(result.errors?.[0]).toBeInstanceOf(Error);
    });

    it('should reject elements without type', () => {
      const json = {
        key: 'element-1',
        props: {
          label: 'Missing type',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should reject elements with non-string type', () => {
      const json = {
        key: 'element-1',
        type: 123,
        props: {
          label: 'Invalid type',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });
  });

  describe('Children references validation', () => {
    it('should validate valid children references', () => {
      const json: UITree = {
        root: 'card-1',
        elements: {
          'card-1': {
            key: 'card-1',
            type: 'Card',
            props: {
              title: 'Parent',
            },
            children: ['text-1', 'button-1'],
          },
          'text-1': {
            key: 'text-1',
            type: 'Text',
            props: {
              content: 'Child 1',
            },
          },
          'button-1': {
            key: 'button-1',
            type: 'Button',
            props: {
              label: 'Child 2',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should reject invalid children references', () => {
      const json: UITree = {
        root: 'card-1',
        elements: {
          'card-1': {
            key: 'card-1',
            type: 'Card',
            props: {
              title: 'Parent',
            },
            children: ['missing-child'],
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
      expect(result.errors?.some((err) => err instanceof Error && err.message.includes('invalid children'))).toBe(true);
    });

    it('should handle elements without children', () => {
      const json: UITree = {
        root: 'button-1',
        elements: {
          'button-1': {
            key: 'button-1',
            type: 'Button',
            props: {
              label: 'No children',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.errors).toBeNull();
    });
  });

  describe('Root key determination', () => {
    it('should use root key from UITree format', () => {
      const json: UITree = {
        root: 'custom-root',
        elements: {
          'custom-root': {
            key: 'custom-root',
            type: 'Button',
            props: {
              label: 'Root',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.root).toBe('custom-root');
      expect(result.errors).toBeNull();
    });

    it('should fail when root element is missing from elements map', () => {
      const json = {
        root: 'missing-root',
        elements: {
          'button-1': {
            key: 'button-1',
            type: 'Button',
            props: {
              label: 'Valid',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
      expect(result.errors?.some((err) => err instanceof Error && err.message.includes('No root element found'))).toBe(
        true,
      );
    });

    it('should fail when no valid root can be determined', () => {
      const json = {
        root: 'missing',
        elements: {},
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });
  });

  describe('Element structure validation', () => {
    it('should reject non-object elements', () => {
      const json = {
        root: 'invalid',
        elements: {
          invalid: 'not an object',
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(false);
      expect(result.tree).toBeNull();
      expect(result.errors).not.toBeNull();
    });

    it('should preserve visibility property', () => {
      const json: UITree = {
        root: 'button-1',
        elements: {
          'button-1': {
            key: 'button-1',
            type: 'Button',
            props: {
              label: 'Visible',
            },
            visible: true,
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.elements['button-1'].visible).toBe(true);
      expect(result.errors).toBeNull();
    });

    it('should handle children as string array', () => {
      const json: UITree = {
        root: 'card-1',
        elements: {
          'card-1': {
            key: 'card-1',
            type: 'Card',
            props: {
              title: 'Parent',
            },
            children: ['text-1'],
          },
          'text-1': {
            key: 'text-1',
            type: 'Text',
            props: {
              content: 'Child',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.elements['card-1'].children).toEqual(['text-1']);
      expect(result.errors).toBeNull();
    });

    it('should ignore non-array children', () => {
      const json = {
        key: 'card-1',
        type: 'Card',
        props: {
          title: 'Parent',
        },
        children: 'not-an-array',
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.elements['root']?.children).toBeUndefined();
      expect(result.errors).toBeNull();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle deeply nested structure', () => {
      const json: UITree = {
        root: 'card-1',
        elements: {
          'card-1': {
            key: 'card-1',
            type: 'Card',
            props: {
              title: 'Level 1',
            },
            children: ['card-2'],
          },
          'card-2': {
            key: 'card-2',
            type: 'Card',
            props: {
              title: 'Level 2',
            },
            children: ['text-1'],
          },
          'text-1': {
            key: 'text-1',
            type: 'Text',
            props: {
              content: 'Level 3',
            },
          },
        },
      };

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.root).toBe('card-1');
      expect(result.tree?.elements['card-1'].children).toEqual(['card-2']);
      expect(result.tree?.elements['card-2'].children).toEqual(['text-1']);
      expect(result.errors).toBeNull();
    });

    it('should handle multiple root candidates in array format', () => {
      const json = [
        {
          key: 'first',
          type: 'Button',
          props: {
            label: 'First',
          },
        },
        {
          key: 'second',
          type: 'Text',
          props: {
            content: 'Second',
          },
        },
      ];

      const result = jsonToTree(json, testCatalog);

      expect(result.success).toBe(true);
      expect(result.tree?.root).toBe('first');
      expect(result.tree?.elements['first']).toBeDefined();
      expect(result.tree?.elements['second']).toBeDefined();
      expect(result.errors).toBeNull();
    });
  });
});

describe('jsonToTreeOrThrow', () => {
  it('should return tree for valid input', () => {
    const json = {
      key: 'button-1',
      type: 'Button',
      props: {
        label: 'Valid',
      },
    };

    const tree = jsonToTreeOrThrow(json, testCatalog);

    expect(tree.root).toBe('button-1');
    expect(tree.elements['button-1'].type).toBe('Button');
  });

  it('should throw error for invalid input', () => {
    const json = {
      key: 'button-1',
      type: 'Button',
      props: {
        label: 123, // Invalid type
      },
    };

    expect(() => jsonToTreeOrThrow(json, testCatalog)).toThrow('JSON validation failed');
  });

  it('should throw error with detailed messages', () => {
    const json = {
      key: 'button-1',
      type: 'UnknownComponent',
      props: {
        label: 'Test',
      },
    };

    expect(() => jsonToTreeOrThrow(json, testCatalog)).toThrow();
  });

  it('should throw error for null input', () => {
    expect(() => jsonToTreeOrThrow(null, testCatalog)).toThrow('JSON validation failed');
  });

  it('should throw error for invalid format', () => {
    expect(() => jsonToTreeOrThrow('invalid', testCatalog)).toThrow('JSON validation failed');
  });
});
