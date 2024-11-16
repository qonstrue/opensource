export const fetchAsBase64String = async (
  innerFetch: typeof fetch,
  url: string
): Promise<string | undefined> => {
  const response = await innerFetch(url);
  if (!response.ok) return;

  const mimeType = response.headers.get('content-type');
  const favIconBinaryData = await response.arrayBuffer();
  const base64FavIcon = Buffer.from(favIconBinaryData).toString('base64');

  const OctetStreamMimeType =
    mimeType === 'application/octet-stream' ? 'image/jpeg' : mimeType;

  return `data:${OctetStreamMimeType};base64,${base64FavIcon}`;
};
