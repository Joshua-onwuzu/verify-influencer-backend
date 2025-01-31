import NodeRSA from 'node-rsa';

export function decryptText(encryptedData: string, key: string) {
  if (!encryptedData) return encryptedData;
  if (!key) throw new Error('No private key');
  const keyRSA = new NodeRSA(key, 'private', {
    encryptionScheme: 'pkcs1',
  });
  keyRSA.setOptions({ environment: 'browser' }); //By default it will use the node crypto library with the CVE
  return keyRSA.decrypt(encryptedData);
}
