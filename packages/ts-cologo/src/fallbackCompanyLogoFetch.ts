import { fetchAsBase64String } from './fetchAsBase64String';

const digitalOceansCdnUrl =
  'https://poweredwith.nyc3.cdn.digitaloceanspaces.com/images/domains';
const googleFavIconsUrl = 'https://www.google.com/s2/favicons';

const fetchFromDigitalOcean = async (
  innerFetch: typeof fetch,
  domain: string
): Promise<string | undefined> =>
  await fetchAsBase64String(innerFetch, `${digitalOceansCdnUrl}/${domain}.jpg`);

const fetchFromGoogle = async (
  innerFetch: typeof fetch,
  domain: string
): Promise<string | undefined> =>
  await fetchAsBase64String(
    innerFetch,
    `${googleFavIconsUrl}?domain=${domain}&sz=128`
  );

export const fallbackCompanyLogoFetch = async (
  innerFetch: typeof fetch,
  domain: string
): Promise<string | undefined> => {
  const logo =
    (await fetchFromDigitalOcean(innerFetch, domain)) ||
    (await fetchFromGoogle(innerFetch, domain));
  return logo;
};
