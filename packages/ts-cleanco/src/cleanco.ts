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
      if (config.matchSuffix && potentiallyDirtyName.endsWith(` ${suffix}`)) {
        potentiallyDirtyName = stripAllWhitespace(
          potentiallyDirtyName.substring(
            0,
            potentiallyDirtyName.length - suffix.length
          )
        );
        if (!config.matchMulti) return potentiallyDirtyName;
      }

      if (config.matchPrefix && potentiallyDirtyName.startsWith(`${suffix} `)) {
        potentiallyDirtyName = stripAllWhitespace(
          potentiallyDirtyName.substring(suffix.length + 1)
        );
        if (!config.matchMulti) return potentiallyDirtyName;
      }

      if (config.matchMiddle) {
        const idx = potentiallyDirtyName.indexOf(` ${suffix} `);
        if (idx >= 0) {
          potentiallyDirtyName = stripAllWhitespace(
            potentiallyDirtyName.substring(0, idx) +
              potentiallyDirtyName.substring(idx + suffix.length + 1)
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
