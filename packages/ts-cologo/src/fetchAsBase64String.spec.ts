import { fetchAsBase64String } from './fetchAsBase64String';
import { testLogos } from './fixtures/testLogos';

describe('Fetch as base64 string', () => {
  it.each(testLogos)(
    'should download image from %s as base64',
    async (_, url, expectedBase64String) => {
      const base64String = await fetchAsBase64String(fetch, url);
      expect(base64String).toEqual(expectedBase64String);
    }
  );
});
