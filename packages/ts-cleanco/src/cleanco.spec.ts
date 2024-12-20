import {
  doubleCleanupTests,
  multiCleanupTests,
  preservingCleanupTests,
  simpleTestCases,
} from './fixtures/testCases';
import {
  cleanCo,
  removeInternalCharsFromFirstWord,
  removeInternalCharsFromLastWord,
  removePunctuation,
  replaceMatchingSuffix,
} from './cleanco';

describe('Cleanco', () => {
  it.each(simpleTestCases)(
    'should handle basic cleanup: %s (%s)',
    (_, name) => {
      expect(cleanCo(name)).toEqual('Hello World');
    }
  );

  it.each(multiCleanupTests)(
    'should handle multiple cleanup: %s (%s)',
    (_, name) => {
      expect(
        cleanCo(name, {
          matchPrefix: true,
          matchMiddle: true,
          matchSuffix: true,
          matchMultiple: true,
        })
      ).toEqual('Hello World');
    }
  );

  it.each(doubleCleanupTests)(
    'should handle double cleanup: %s (%s)',
    (_, name) => {
      expect(
        cleanCo(name, {
          matchPrefix: true,
          matchMiddle: true,
          matchSuffix: true,
          matchMultiple: true,
        })
      ).toEqual('Hello World');
    }
  );

  it.skip.each(preservingCleanupTests)(
    'should handle preserving cleanup: %s (%s - %s)',
    (_, name, expected) => {
      expect(
        cleanCo(name, {
          matchPrefix: true,
          matchMiddle: true,
          matchSuffix: true,
          matchMultiple: true,
        })
      ).toEqual(expected);
    }
  );
});

describe('Replace suffix in company name', () => {
  it.each([
    ['Sustentabilitas ltd', 'ltd', 'Sustentabilitas'],
    ['Sustentabilitas ltd corp', 'corp', 'Sustentabilitas ltd'],
    ['Sustentabilitas ltd corp', 'ltd corp', 'Sustentabilitas'],
  ])(
    'should remove punctuation from the last word in a sentence',
    (name, suffix, expected) => {
      expect(replaceMatchingSuffix(name, suffix)).toEqual(expected);
    }
  );
});

describe('Handling punctuation at the end of a sentence', () => {
  it.each([
    ['This is a str.ing.', 'This is a string'],
    ['This i.s a string.', 'This i.s a string'],
    ['Thi.s is a string.', 'Thi.s is a string'],
    ['Thi.s is a s.r.o.', 'Thi.s is a sro'],
  ])(
    'should remove punctuation from the last word in a sentence',
    (original, resolved) => {
      expect(removeInternalCharsFromLastWord(original)).toEqual(resolved);
    }
  );
});

describe('Handling punctuation at the start of a sentence', () => {
  it.each([
    ['Th.is. is a string', 'This is a string'],
    ['This i.s a string.', 'This i.s a string.'],
    ['This is a stri.ng.', 'This is a stri.ng.'],
  ])(
    'should remove punctuation from the first word in a sentence',
    (original, resolved) => {
      expect(removeInternalCharsFromFirstWord(original)).toEqual(resolved);
    }
  );
});

describe('Remove punctuation', () => {
  it.each([
    ['s.r.o.', 'sro'],
    ['ltd.', 'ltd'],
    ['inc.', 'inc'],
  ])(
    'should remove punctuation from the last word in a sentence',
    (original, resolved) => {
      expect(removePunctuation(original)).toEqual(resolved);
    }
  );
});
