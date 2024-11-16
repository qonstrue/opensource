import { termsByCountry, termsByType } from './termdata';

export type CleanerConfig = {
  suffix: boolean;
  prefix: boolean;
  middle: boolean;
  multi: boolean;
};

const defaultCleanerConfig: CleanerConfig = {
  suffix: true,
  prefix: false,
  middle: false,
  multi: false,
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
  (config: CleanerConfig) => (potentiallyDirtyName: string) => {
    console.log(potentiallyDirtyName);
    return allSuffixes.reduce((accum, suffix) => {
      if (config.suffix && potentiallyDirtyName.endsWith(` ${suffix}`)) {
        potentiallyDirtyName = stripAllWhitespace(
          potentiallyDirtyName.substring(
            0,
            potentiallyDirtyName.length - suffix.length
          )
        );
        if (!config.multi) return potentiallyDirtyName;
      }

      if (config.prefix && potentiallyDirtyName.startsWith(`${suffix} `)) {
        potentiallyDirtyName = stripAllWhitespace(
          potentiallyDirtyName.substring(suffix.length + 1)
        );
        if (!config.multi) return potentiallyDirtyName;
      }

      if (config.middle) {
        const idx = potentiallyDirtyName.indexOf(` ${suffix} `);
        if (idx >= 0) {
          potentiallyDirtyName = stripAllWhitespace(
            potentiallyDirtyName.substring(0, idx) +
              potentiallyDirtyName.substring(idx + suffix.length + 1)
          );
          if (!config.multi) return potentiallyDirtyName;
        }
      }

      return accum;
    }, potentiallyDirtyName);
  };

const stripAllWhitespace = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\.\w\/]+/g, ' ');
