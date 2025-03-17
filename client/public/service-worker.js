self.addEventListener('message', function handleMessage(event) {
  self.vapidPublicKey = event.data.vapidPublicKey;
});

self.addEventListener('push', function handlePush(event) {
  console.log('Received a push message: ', event);

  const title = 'New Notification';
  const body = 'You have new updates!';
  const icon = '/images/icon.png';
  const tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag,
    })
  );

  event.waitUntil(resubscribeToPush());
});

function resubscribeToPush() {
  return self.registration.pushManager
    .getSubscription()
    .then((subscription) => {
      if (subscription) {
        return subscription.unsubscribe();
      }
    })
    .then(function () {
      return self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          self.vapidPublicKey
        ),
      });
    })
    .catch(function (error) {
      console.error('Failed to resubscribe:', error);
    });
}
