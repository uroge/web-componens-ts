export function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  // Replace URL-specific Base64 characters with standard Base64 characters
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+') // Convert URL-safe '-' to '+'
    .replace(/_/g, '/'); // Convert URL-safe '_' to '/'

  // Decode the Base64 string to a raw binary string
  const rawData = atob(base64);

  // Convert the binary string into a Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
