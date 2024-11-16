import { simpleTestCases } from './fixtures/testCases';
import { cleanCo } from './cleanco';

describe('Cleanco', () => {
  it.each(simpleTestCases)(
    'should handle basic cleanup: %s, %s',
    (testCase, name) => {
      expect(cleanCo(name)).toEqual('hello world');
    }
  );
});
