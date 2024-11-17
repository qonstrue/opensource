import { multiCleanupTests, simpleTestCases } from './fixtures/testCases';
import {
  cleanCo,
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
          matchMulti: true,
        })
      ).toEqual('Hello World');
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

describe('Handling punctuation', () => {
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
