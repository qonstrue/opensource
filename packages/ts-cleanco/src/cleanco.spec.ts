import { multiCleanupTests, simpleTestCases } from './fixtures/testCases';
import { cleanCo } from './cleanco';

describe('Cleanco', () => {
  it.each(simpleTestCases)(
    'should handle basic cleanup: %s (%s)',
    (testCase, name) => {
      expect(cleanCo(name)).toEqual('hello world');
    }
  );

  it.each(multiCleanupTests)(
    'should handle multiple cleanup: %s (%s)',
    (testCase, name) => {
      expect(
        cleanCo(name, {
          matchPrefix: true,
          matchMiddle: true,
          matchSuffix: true,
          matchMulti: true,
        })
      ).toEqual('hello world');
    }
  );
});
