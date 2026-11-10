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

## Deprecated Packages

These packages are **deprecated and no longer maintained**. They will receive no
further updates, including security fixes, and no replacement is planned. Their
sources are being removed from this repository; the last published versions
remain installable on npm for existing users.

### ~~[ts-doc-convert](https://www.npmjs.com/package/ts-doc-convert)~~

**Status:** Deprecated — unmaintained, no replacement  
**Was:** Convert documents between formats (DOCX, Markdown, etc.)  
**npm:** https://www.npmjs.com/package/ts-doc-convert

### ~~[json-render-sveltekit](https://www.npmjs.com/package/json-render-sveltekit)~~

**Status:** Deprecated — unmaintained, no replacement  
**Was:** Svelte/SvelteKit renderer for @json-render/core. JSON becomes Svelte components. Port of @json-render/react by Vercel Labs.  
**npm:** https://www.npmjs.com/package/json-render-sveltekit

## Development

Instructions for each library are provided in the relevant readme file in the packages directory. Contributing instructions are also contained within the respective directory.

### Creating a Release

All four packages are a **fixed release group**, so they version and publish in
lockstep — a release bumps every package, including ones with no changes.

```bash
pnpm nx release patch --skip-publish   # bump, changelog, commit, tag
git push && git push --tags
```

`--skip-publish` is deliberate: publishing is CI's job. Pushing the `release/*`
tag triggers the workflow, which publishes to npmjs.org using trusted publishing
(OIDC) with provenance. Running the publish locally would bypass both.

> **One-time note:** versions 1.2.0–1.2.2 were published without matching
> `release/*` tags, so nx cannot resolve the previous tag. The first release
> after this needs `--first-release` added to the command above. Once that
> creates a `release/*` tag, subsequent releases no longer need the flag.
