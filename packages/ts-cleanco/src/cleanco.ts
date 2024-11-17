import { termsByCountry, termsByType } from './termdata';

export type CleanerConfig = {
  matchSuffix: boolean;
  matchPrefix: boolean;
  matchMiddle: boolean;
  matchMulti: boolean;
};

const defaultCleanerConfig: CleanerConfig = {
  matchSuffix: true,
  matchPrefix: false,
  matchMiddle: false,
  matchMulti: false,
};

export const cleanCo = (
  potentiallyDirtyName: string,
  config: CleanerConfig = defaultCleanerConfig
) =>
  handleSuffixes(config)(
    stripAllWhitespace(potentiallyDirtyName).toLowerCase()
  );

const allTypeSuffixes = Object.entries(termsByType).reduce(
  (accum, each) => accum.concat(each[1]),
  [] as string[]
);

const allTermsByCountrySuffixes = Object.entries(termsByCountry).reduce(
  (accum, each) => accum.concat(each[1]),
  [] as string[]
);

const allSuffixes = [...allTypeSuffixes, ...allTermsByCountrySuffixes].sort(
  (left, right) => left.toLowerCase().localeCompare(right.toLowerCase())
);

const handleSuffixes =
  (config: CleanerConfig) => (potentiallyDirtyName: string) =>
    allSuffixes.reduce((accum, suffix) => {
      if (config.matchSuffix) {
        potentiallyDirtyName = replaceMatchingSuffix(
          removeInternalCharsFromLastWord(potentiallyDirtyName),
          removePunctuation(suffix)
        );
        if (!config.matchMulti) return potentiallyDirtyName;
      }

      if (config.matchPrefix) {
        potentiallyDirtyName = replaceMatchingPrefix(
          potentiallyDirtyName,
          suffix
        );
        if (!config.matchMulti) return potentiallyDirtyName;
      }

      if (config.matchMiddle) {
        const idx = potentiallyDirtyName.indexOf(` ${suffix} `);
        if (idx >= 0) {
          potentiallyDirtyName = replaceMatchingMiddle(
            potentiallyDirtyName,
            suffix
          );
          if (!config.matchMulti) return potentiallyDirtyName;
        }
      }

      return potentiallyDirtyName;
    }, potentiallyDirtyName);

const stripAllWhitespace = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\.\w\/]+/g, ' ');

export const replaceMatchingSuffix = (
  potentiallyDirtyName: string,
  suffix: string
) =>
  caseInsensitiveReplace(
    potentiallyDirtyName,
    ` ${suffix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`
  );

const replaceMatchingPrefix = (potentiallyDirtyName: string, prefix: string) =>
  caseInsensitiveReplace(
    potentiallyDirtyName,
    `^${prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')} `
  );

const replaceMatchingMiddle = (potentiallyDirtyName: string, prefix: string) =>
  caseInsensitiveReplace(
    potentiallyDirtyName,
    ` ${prefix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')} `,
    ' '
  );

const caseInsensitiveReplace = (
  originalString: string,
  searchPattern: string,
  replaceString: string = ''
) =>
  stripAllWhitespace(
    originalString.replace(new RegExp(searchPattern, 'i'), replaceString)
  );

export const removePunctuation = (text: string): string =>
  text.replace(/[.,\/#!$%^&*()_+-='":{}|<>?]/g, '');

export const removeInternalCharsFromLastWord = (str: string): string =>
  str.replace(/\S+(\S*)$/, (match) =>
    match.trim().replace(/[\s.,\/#!$%^&*()_+-='":{}|<>?]/g, '')
  );
