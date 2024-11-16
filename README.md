# Qonstrue open source libraries monorepo

This repository contains the following open source libraries:

* **ts-cleanco**: Cleans up company names

Instructions for each library are provided in the relevant readme file in the packages directory. Contributing instructions are also contained within the respective directory.

To create a release and push to npmjs.org:

```bash
npx nx release --skip-publish
git push && git push --tags
```