import { fallbackCompanyLogoFetch } from './fallbackCompanyLogoFetch';
import { testCompanyLogos } from './fixtures/testLogos';

describe('Fallback company logo fetch', () => {
  it.each(testCompanyLogos)(
    'should fetch %s',
    async (_, domain, expectedBase64String) => {
      const googleIcon = await fallbackCompanyLogoFetch(fetch, domain);
      expect(googleIcon).toBe(expectedBase64String);
    }
  );
});
