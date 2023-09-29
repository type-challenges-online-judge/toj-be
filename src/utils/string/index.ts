import { Base64 } from 'js-base64';

export const decodeBase64UTF8 = (string) => {
  return Base64.decode(string.replaceAll('\n', ''));
};
