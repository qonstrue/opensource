import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UIElement } from '../types/index.js';
import { flatToTree, useUIStream } from './useUIStream.js';

const createMockReadableStream = (chunks: string[]): ReadableStream<Uint8Array> => {
  let chunkIndex = 0;
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sendChunk = () => {
        if (chunkIndex < chunks.length) {
          controller.enqueue(encoder.encode(chunks[chunkIndex]));
          chunkIndex++;
          if (chunkIndex < chunks.length) {
            setTimeout(sendChunk, 0);
          } else {
            controller.close();
          }
        } else {
          controller.close();
        }
      };
      sendChunk();
    },
  });
};

const createMockReader = (chunks: string[]) => {
  const stream = createMockReadableStream(chunks);
  return stream.getReader();
};

describe('useUIStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('clear', () => {
    it('should clear tree and error stores', async () => {
      const { tree, error, clear, send } = useUIStream({ api: '/api/test' });

      const mockReader = createMockReader(['']);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      await send('test');

      const treeBefore = get(tree);
      const errorBefore = get(error);

      clear();

      expect(get(tree)).toBeNull();
      expect(get(error)).toBeNull();
    });
  });

  describe('send', () => {
    it('should make POST request with prompt and context', async () => {
      const mockReader = createMockReader(['']);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { send } = useUIStream({ api: '/api/generate' });
      await send('test prompt', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'test prompt',
            context: { key: 'value' },
            currentTree: { root: '', elements: {} },
          }),
        }),
      );
    });

    it('should set isStreaming to true during request', async () => {
      const mockReader = createMockReader(['']);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { isStreaming, send } = useUIStream({ api: '/api/test' });
      const sendPromise = send('test');

      expect(get(isStreaming)).toBe(true);
      await sendPromise;
      expect(get(isStreaming)).toBe(false);
    });

    it('should initialize tree store with empty tree', async () => {
      const mockReader = createMockReader(['']);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      const sendPromise = send('test');

      const initialTree = get(tree);
      expect(initialTree).toEqual({ root: '', elements: {} });

      await sendPromise;
    });

    it('should process stream chunks and update tree', async () => {
      const patches = [
        JSON.stringify({
          op: 'set',
          path: '/elements/button-1',
          value: { key: 'button-1', type: 'Button', props: { label: 'Click' } },
        }),
        JSON.stringify({ op: 'set', path: '/root', value: 'button-1' }),
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree).not.toBeNull();
      expect(finalTree?.root).toBe('button-1');
      expect(finalTree?.elements['button-1']).toBeDefined();
    });

    it('should handle multiple stream chunks', async () => {
      const chunk1 =
        JSON.stringify({
          op: 'set',
          path: '/elements/button-1',
          value: { key: 'button-1', type: 'Button', props: { label: 'Click' } },
        }) + '\n';
      const chunk2 = JSON.stringify({ op: 'set', path: '/root', value: 'button-1' }) + '\n';
      const mockReader = createMockReader([chunk1, chunk2]);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.root).toBe('button-1');
    });

    it('should handle incomplete chunks in buffer', async () => {
      const incompletePatch = '{"op":"set","path":"/elements/button-1","value":{"key":"button-1"';
      const completePatch = ',"type":"Button","props":{"label":"Click"}}}\n';
      const mockReader = createMockReader([incompletePatch, completePatch]);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree).not.toBeNull();
    });

    it('should call onComplete callback with final tree', async () => {
      const onComplete = vi.fn();
      const mockReader = createMockReader(['']);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { send } = useUIStream({ api: '/api/test', onComplete });
      await send('test');

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ root: '', elements: {} }));
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { error, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const errorValue = get(error);
      expect(errorValue).toBeInstanceOf(Error);
      expect(errorValue?.message).toContain('HTTP error: 500');
    });

    it('should handle missing response body', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const { error, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const errorValue = get(error);
      expect(errorValue).toBeInstanceOf(Error);
      expect(errorValue?.message).toBe('No response body');
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { send } = useUIStream({ api: '/api/test', onError });
      await send('test');

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should set error store on error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const { error, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const errorValue = get(error);
      expect(errorValue).toBeInstanceOf(Error);
      expect(errorValue?.message).toBe('Network error');
    });

    it('should handle AbortError silently', async () => {
      const onError = vi.fn();
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

      const { error, send } = useUIStream({ api: '/api/test', onError });
      await send('test');

      expect(onError).not.toHaveBeenCalled();
      expect(get(error)).toBeNull();
    });

    it('should abort previous request when new one starts', async () => {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
      const abort1 = vi.spyOn(abortController1, 'abort');

      let controllerCount = 0;
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        controllerCount++;
        if (controllerCount === 1) {
          return Promise.resolve({
            ok: true,
            body: {
              getReader: () => createMockReader(['']),
            },
          });
        }
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => createMockReader(['']),
          },
        });
      });

      const { send } = useUIStream({ api: '/api/test' });
      const promise1 = send('first');
      const promise2 = send('second');

      await Promise.all([promise1, promise2]);
    });

    it('should handle comments in stream', async () => {
      const patches = [
        '// This is a comment',
        JSON.stringify({ op: 'set', path: '/root', value: 'test' }),
        '// Another comment',
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.root).toBe('test');
    });

    it('should handle empty lines in stream', async () => {
      const patches = ['', JSON.stringify({ op: 'set', path: '/root', value: 'test' }), ''];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.root).toBe('test');
    });

    it('should process remaining buffer after stream ends', async () => {
      const patch = JSON.stringify({ op: 'set', path: '/root', value: 'test' });
      const mockReader = createMockReader([patch]);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.root).toBe('test');
    });

    it('should handle invalid JSON patches gracefully', async () => {
      const patches = ['invalid json', JSON.stringify({ op: 'set', path: '/root', value: 'test' })];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.root).toBe('test');
    });
  });

  describe('patch operations', () => {
    it('should handle set operation on root', async () => {
      const patch = JSON.stringify({ op: 'set', path: '/root', value: 'new-root' });
      const mockReader = createMockReader([patch + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      expect(get(tree)?.root).toBe('new-root');
    });

    it('should handle add operation on element', async () => {
      const patches = [
        JSON.stringify({
          op: 'add',
          path: '/elements/button-1',
          value: { key: 'button-1', type: 'Button', props: { label: 'Click' } },
        }),
        JSON.stringify({ op: 'set', path: '/root', value: 'button-1' }),
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.elements['button-1']).toBeDefined();
      expect(finalTree?.elements['button-1'].props.label).toBe('Click');
    });

    it('should handle replace operation on element property', async () => {
      const patches = [
        JSON.stringify({
          op: 'add',
          path: '/elements/button-1',
          value: { key: 'button-1', type: 'Button', props: { label: 'Old' } },
        }),
        JSON.stringify({ op: 'replace', path: '/elements/button-1/props/label', value: 'New' }),
        JSON.stringify({ op: 'set', path: '/root', value: 'button-1' }),
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.elements['button-1'].props.label).toBe('New');
    });

    it('should handle remove operation on element', async () => {
      const patches = [
        JSON.stringify({
          op: 'add',
          path: '/elements/button-1',
          value: { key: 'button-1', type: 'Button', props: { label: 'Click' } },
        }),
        JSON.stringify({
          op: 'add',
          path: '/elements/button-2',
          value: { key: 'button-2', type: 'Button', props: { label: 'Delete' } },
        }),
        JSON.stringify({ op: 'remove', path: '/elements/button-2' }),
        JSON.stringify({ op: 'set', path: '/root', value: 'button-1' }),
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.elements['button-1']).toBeDefined();
      expect(finalTree?.elements['button-2']).toBeUndefined();
    });

    it('should handle nested property updates', async () => {
      const patches = [
        JSON.stringify({
          op: 'add',
          path: '/elements/card-1',
          value: {
            key: 'card-1',
            type: 'Card',
            props: { title: 'Card', description: 'Old' },
          },
        }),
        JSON.stringify({ op: 'replace', path: '/elements/card-1/props/description', value: 'New' }),
        JSON.stringify({ op: 'set', path: '/root', value: 'card-1' }),
      ];
      const mockReader = createMockReader([patches.join('\n') + '\n']);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const { tree, send } = useUIStream({ api: '/api/test' });
      await send('test');

      const finalTree = get(tree);
      expect(finalTree?.elements['card-1'].props.description).toBe('New');
    });
  });
});

describe('flatToTree', () => {
  it('should convert flat array to tree structure', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'card-1',
        type: 'Card',
        props: { title: 'Parent' },
        parentKey: null,
      },
      {
        key: 'button-1',
        type: 'Button',
        props: { label: 'Child' },
        parentKey: 'card-1',
      },
      {
        key: 'text-1',
        type: 'Text',
        props: { content: 'Another Child' },
        parentKey: 'card-1',
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.root).toBe('card-1');
    expect(tree.elements['card-1']).toBeDefined();
    expect(tree.elements['button-1']).toBeDefined();
    expect(tree.elements['text-1']).toBeDefined();
    expect(tree.elements['card-1'].children).toContain('button-1');
    expect(tree.elements['card-1'].children).toContain('text-1');
  });

  it('should handle elements without parentKey as root', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'root-1',
        type: 'Button',
        props: { label: 'Root' },
        parentKey: null,
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.root).toBe('root-1');
    expect(tree.elements['root-1']).toBeDefined();
  });

  it('should handle empty array', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [];
    const tree = flatToTree(elements);

    expect(tree.root).toBe('');
    expect(Object.keys(tree.elements)).toHaveLength(0);
  });

  it('should handle multiple root elements (last one wins)', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'root-1',
        type: 'Button',
        props: { label: 'First Root' },
        parentKey: null,
      },
      {
        key: 'root-2',
        type: 'Button',
        props: { label: 'Second Root' },
        parentKey: null,
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.root).toBe('root-2');
    expect(tree.elements['root-1']).toBeDefined();
    expect(tree.elements['root-2']).toBeDefined();
  });

  it('should handle deeply nested structures', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'level-1',
        type: 'Card',
        props: { title: 'Level 1' },
        parentKey: null,
      },
      {
        key: 'level-2',
        type: 'Card',
        props: { title: 'Level 2' },
        parentKey: 'level-1',
      },
      {
        key: 'level-3',
        type: 'Text',
        props: { content: 'Level 3' },
        parentKey: 'level-2',
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.root).toBe('level-1');
    expect(tree.elements['level-1'].children).toContain('level-2');
    expect(tree.elements['level-2'].children).toContain('level-3');
  });

  it('should handle missing parent references gracefully', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'orphan',
        type: 'Button',
        props: { label: 'Orphan' },
        parentKey: 'missing-parent',
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.elements['orphan']).toBeDefined();
    expect(tree.elements['missing-parent']).toBeUndefined();
  });

  it('should preserve element properties', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'button-1',
        type: 'Button',
        props: { label: 'Click', action: 'submit' },
        visible: true,
        parentKey: null,
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.elements['button-1'].type).toBe('Button');
    expect(tree.elements['button-1'].props.label).toBe('Click');
    expect(tree.elements['button-1'].props.action).toBe('submit');
    expect(tree.elements['button-1'].visible).toBe(true);
  });

  it('should initialize children as empty array', () => {
    const elements: (UIElement & { parentKey?: string | null })[] = [
      {
        key: 'parent',
        type: 'Card',
        props: { title: 'Parent' },
        parentKey: null,
      },
    ];

    const tree = flatToTree(elements);

    expect(tree.elements['parent'].children).toEqual([]);
  });
});
