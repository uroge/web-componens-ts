self.addEventListener('message', function handleMessage(event) {
  if (event.data && event.data.vapidPublicKey) {
    console.log('HANDLE MESSAGE', event.data);
    // TODO: Move vapidPublicKey to a more secure location like IndexedDB
    self.vapidPublicKey = event.data.vapidPublicKey;
  } else {
    console.warn('No vapidPublicKey received');
  }
});

self.addEventListener('push', function handlePush(event) {
  console.log('PUSH');
  const title = 'New Notification';
  const body = 'You have new updates!';
  const icon = '/vite.svg';
  const tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration
      .showNotification(title, {
        body: body,
        icon: icon,
        tag: tag,
        requireInteraction: true,
      })
      .then(() => {
        console.log('Notification displayed');
      })
      .catch((err) => {
        console.error('Failed to show notification:', err);
      })
  );

  // event.waitUntil(resubscribeToPush());
});

// function resubscribeToPush() {
//   return self.registration.pushManager
//     .getSubscription()
//     .then((subscription) => {
//       if (!subscription) {
//         return self.registration.pushManager.subscribe({
//           userVisibleOnly: true,
//           applicationServerKey: urlBase64ToUint8Array(
//             self.vapidPublicKey
//           ),
//         });
//       }
//     })
//     .catch(function (error) {
//       console.error('Failed to resubscribe:', error);
//     });
// }

// function urlBase64ToUint8Array(base64String) {
//   // Replace URL-specific Base64 characters with standard Base64 characters
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding)
//     .replace(/-/g, '+') // Convert URL-safe '-' to '+'
//     .replace(/_/g, '/'); // Convert URL-safe '_' to '/'

//   // Decode the Base64 string to a raw binary string
//   const rawData = atob(base64);

//   // Convert the binary string into a Uint8Array
//   const outputArray = new Uint8Array(rawData.length);
//   for (let i = 0; i < rawData.length; i++) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }

//   return outputArray;
// }
