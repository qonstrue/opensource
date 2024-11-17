**README.md**

# Company Logos

**A TypeScript package to find company logos or favicons by domain (use as a fallback).**

This package is designed to download company logos and convert them to base64. It can be used as a backup mechanism where you are missing some logos but know the domain of the company

## Installation

```bash
npm install ts-cologo
```

## Usage

```typescript
import { fetchAsBase64String } from 'ts-cologo';

const base64String = await fetchAsBase64String(
  fetch,
  'https://www.iana.org/_img/2022/iana-logo-header.svg'
);
console.log(base64String); // data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4w....
```

## Customization

The package can be customized to your specific needs by providing a configuration object:

```typescript
import { cologo, LogoConfig } from 'ts-cologo';

const config: LogoConfig = {};

const logo = await fetchAsBase64String(fetch, 'apple.com', config);
```

## Contributing

We welcome contributions to improve this package. Here's how you can contribute:

1. **Fork the repository**
2. **Create a new branch**
3. **Make your changes**
4. **Test your changes**
5. **Submit a pull request**

## License

This project is licensed under the MIT License.
