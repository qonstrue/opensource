**README.md**

# Company Name Cleaner

**A (maintained) TypeScript package to clean and standardize company names.**

This package is designed to clean and standardize company names, removing unnecessary characters, formatting consistently, and handling common variations. It's particularly useful for data cleaning and normalization tasks.

It's based on the Python code written by [Petri Savolainen](https://github.com/psolin) at [Git repo](https://github.com/psolin/cleanco.git). All credit to Petri for creating the original library in Python.

## Installation

```bash
npm install ts-cleanco
```

## Usage

```typescript
import { cleanco } from 'ts-cleanco';

const dirtyNames = [
    '  Apple Inc.  ',
    'MICROSOFT CORPORATION',
    'Google LLC',
    'Alphabet Inc.',
];

const cleanNames = dirtyNames.map(cleanco);

console.log(cleanNames); // Output: ['Apple', 'Microsoft', 'Google', 'Alphabet']
```

## Customization

The package can be customized to your specific needs by providing a configuration object:

```typescript
import { cleanco, CleanerConfig } from 'ts-cleanco';

const config: CleanerConfig = {
  // Customize cleaning rules here, e.g.,
  matchSuffix: true,    // match and remove any strings in the suffix (default behaviour)
  matchPrefix: false,   // match and remove any strings in the prefix
  matchMiddle: false,   // match and remove any strings in the middle
  matchMulti: false,    // match multiple instances (suffix, prefix, middle)
};

const cleanName = cleanco('  Apple Inc.  ', config);
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