import crypto from 'crypto';

export function decryptKey(privateKeyPem: string, encryptedBase64: string) {
  return encryptedBase64;
  // Convert Base64 string to Buffer
  const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

  // Decrypt using the private key
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    encryptedBuffer,
  );

  return decryptedBuffer.toString('utf8'); // Convert Buffer to String
}

// Usage Example:
export const privateKey = process.env.PRIVATE_KEY as string;
