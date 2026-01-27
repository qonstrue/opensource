# Qonstrue open source libraries monorepo

This repository contains the following open source libraries:

## Published Packages

### [ts-cleanco](https://www.npmjs.com/package/ts-cleanco)
**Version:** 1.2.1  
**Description:** Typescript implementation of cleanco python  
**npm:** https://www.npmjs.com/package/ts-cleanco

### [ts-cologo](https://www.npmjs.com/package/ts-cologo)
**Version:** 1.2.1  
**Description:** Extract company logos  
**npm:** https://www.npmjs.com/package/ts-cologo

### [ts-doc-convert](https://www.npmjs.com/package/ts-doc-convert)
**Version:** 1.2.1  
**Description:** Convert documents between formats (DOCX, Markdown, etc.)  
**npm:** https://www.npmjs.com/package/ts-doc-convert

### [json-render-sveltekit](https://www.npmjs.com/package/json-render-sveltekit)
**Version:** 1.2.1  
**Description:** Svelte/SvelteKit renderer for @json-render/core. JSON becomes Svelte components. Port of @json-render/react by Vercel Labs.  
**npm:** https://www.npmjs.com/package/json-render-sveltekit

## Development

Instructions for each library are provided in the relevant readme file in the packages directory. Contributing instructions are also contained within the respective directory.

### Creating a Release

To create a release and push to npmjs.org:

```bash
pnpm nx release version
git push && git push --tags
```

The CI workflow will automatically publish the packages to npmjs.org using trusted publishing (OIDC).