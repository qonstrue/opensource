# ts-doc-convert

> ## ⚠️ Deprecated
>
> **This package is deprecated and no longer maintained.** It will receive no
> further updates, including security fixes.
>
> No replacement is planned. If you depend on it, pin the last published
> version and plan to migrate away — we suggest calling
> [`mammoth`](https://www.npmjs.com/package/mammoth),
> [`unified`](https://www.npmjs.com/package/unified) and
> [`@m2d/core`](https://www.npmjs.com/package/@m2d/core) directly, which is all
> this package ever wrapped.

Convert documents between formats: DOCX to Markdown and Markdown to DOCX.

## Installation

```bash
npm install ts-doc-convert
```

## Usage

Both functions return an [Effect](https://effect.website), so failures travel
the error channel rather than being thrown:

```typescript
import { Effect } from 'effect';
import { docxToMarkdown, markdownToDocx } from 'ts-doc-convert';

const markdown = await Effect.runPromise(docxToMarkdown(docxBuffer));
const docx = await Effect.runPromise(markdownToDocx(markdownBuffer));
```

## License

This project is licensed under the MIT License.
