import { termsByCountry, termsByType } from './termdata';

export type CleanerConfig = {
  readonly matchSuffix: boolean;
  readonly matchPrefix: boolean;
  readonly matchMiddle: boolean;
  readonly matchMultiple: boolean;
};

const defaultCleanerConfig: CleanerConfig = {
  matchSuffix: true,
  matchPrefix: false,
  matchMiddle: false,
  matchMultiple: false,
};

export const cleanCo = (
  potentiallyDirtyName: string,
  config: CleanerConfig = defaultCleanerConfig
): string => handleSuffixes(config)(stripAllWhitespace(potentiallyDirtyName));

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
  (config: CleanerConfig) =>
  (potentiallyDirtyName: string): string =>
    allSuffixes.reduce((accum, suffix) => {
      if (config.matchSuffix) {
        potentiallyDirtyName = replaceMatchingSuffix(
          removeInternalCharsFromLastWord(potentiallyDirtyName),
          removePunctuation(suffix)
        );
        if (!config.matchMultiple) return potentiallyDirtyName;
      }

      if (config.matchPrefix) {
        potentiallyDirtyName = replaceMatchingPrefix(
          removeInternalCharsFromFirstWord(potentiallyDirtyName),
          removePunctuation(suffix)
        );
        if (!config.matchMultiple) return potentiallyDirtyName;
      }

      if (config.matchMiddle) {
        const idx = potentiallyDirtyName
          .toLowerCase()
          .indexOf(` ${suffix.toLowerCase()} `);
        if (idx >= 0) {
          potentiallyDirtyName = replaceMatchingMiddle(
            potentiallyDirtyName,
            suffix
          );
          if (!config.matchMultiple) return potentiallyDirtyName;
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

// Hyphen must be escaped so it doesn't form a range (e.g. +-= would include digits 0-9)
const PUNCTUATION_ONLY = /[.,\/#!$%^&*()_+\-='":{}|<>?]/g;
const PUNCTUATION_AND_SPACE = /[\s.,\/#!$%^&*()_+\-='":{}|<>?]/g;

export const removePunctuation = (text: string): string =>
  text.replace(PUNCTUATION_ONLY, '');

export const removeInternalCharsFromLastWord = (str: string): string =>
  str.replace(/\S+(\S*)$/, (match) =>
    match.trim().replace(PUNCTUATION_AND_SPACE, '')
  );

export const removeInternalCharsFromFirstWord = (str: string): string =>
  str.replace(/^(\S*)\S+/, (match) =>
    match.trim().replace(PUNCTUATION_AND_SPACE, '')
  );
