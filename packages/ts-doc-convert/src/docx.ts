import { toDocx } from '@m2d/core';
import { htmlPlugin } from '@m2d/html';
import { imagePlugin } from '@m2d/image';
import { listPlugin } from '@m2d/list';
import { mathPlugin } from '@m2d/math';
import { tablePlugin } from '@m2d/table';
import { Effect, pipe } from 'effect';
import mammoth from 'mammoth';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

export const docxToMarkdown = (
  docxBuffer: Buffer,
): Effect.Effect<never, Error, Buffer> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const mammothResult = await mammoth.convertToHtml({
          buffer: docxBuffer,
        });

        const processor = unified()
          .use(rehypeParse)
          .use(rehypeRemark)
          .use(remarkStringify, { bullet: '-' });
        const file = await processor.process(mammothResult.value);
        return Buffer.from(String(file), 'utf-8');
      },
      catch: (error: unknown) =>
        error instanceof Error
          ? new Error(`Could not convert DOCX to Markdown: ${error.message}`)
          : new Error(
              'Could not convert DOCX to Markdown: Unknown error occurred',
            ),
    }),
  );

export const markdownToDocx = (
  markdownBuffer: Buffer,
): Effect.Effect<never, Error, Buffer> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const markdownContent = markdownBuffer.toString('utf-8');
        const tree = unified().use(remarkParse).parse(markdownContent);
        const docxBlob: Blob = (await toDocx(
          tree,
          {},
          {
            plugins: [
              listPlugin(),
              htmlPlugin(),
              imagePlugin(),
              mathPlugin(),
              tablePlugin(),
            ],
          },
        )) as Blob;
        const arrayBuffer = await docxBlob.arrayBuffer();
        return Buffer.from(arrayBuffer);
      },
      catch: (error: unknown) =>
        error instanceof Error
          ? new Error(`Could not convert Markdown to DOCX: ${error.message}`)
          : new Error(
              'Could not convert Markdown to DOCX: Unknown error occurred',
            ),
    }),
  );
