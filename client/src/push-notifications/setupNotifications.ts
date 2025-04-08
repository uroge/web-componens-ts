import { environment } from '../environment';
import { urlBase64ToUint8Array } from '../utils/urlBase64ToUint8Array';

export const setupNotifications = () => {
  if (!('serviceWorker' in navigator)) {
    // eslint-disable-next-line no-console
    console.error('Service workers are not supported.');
    return;
  }

  if (!('PushManager' in window)) {
    // eslint-disable-next-line no-console
    console.error('Push notifications are not supported.');
    return;
  }

  askPermission()
    .then(() => registerServiceWorker())
    .then((value: unknown) => {
      const registration = value as ServiceWorkerRegistration;
      if (registration) {
        return new Promise((resolve) => {
          const checkActiveState = () => {
            if (registration.active) {
              resolve(registration);
            } else {
              setTimeout(checkActiveState, 100);
            }
          };
          checkActiveState();
        });
      }
    })
    .then((value: unknown) => {
      const registration = value as ServiceWorkerRegistration;
      registration.active?.postMessage({
        // Generated using https://web-push-codelab.glitch.me/
        vapidPublicKey: environment.vapidPublicKey,
      });

      return registration;
    })
    .then((registration) => {
      // Passing VAPID public key to the service worker
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          environment.vapidPublicKey
        ),
      };

      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(async (pushSubscription) => {
      if (pushSubscription) {
        await sendSubscriptionToBackend(pushSubscription);
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Error setting up notifications:', err);
    });
};

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  try {
    const registration = await navigator.serviceWorker.register(
      '/service-worker.js'
    );
    return registration;
  } catch {
    throw new Error('Service Worker registration failed');
  }
}

function askPermission(): Promise<void> {
  return new Promise((resolve, reject) => {
    Notification.requestPermission()
      .then((permissionResult) => {
        if (permissionResult !== 'granted') {
          reject(new Error("We weren't granted permission."));
        }
        resolve();
      })
      .catch(reject);
  });
}

async function sendSubscriptionToBackend(
  subscription: PushSubscription
) {
  try {
    const response = await fetch(
      `${environment.publicUrl}/api/save-subscription/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      }
    );

    if (!response.ok) {
      throw new Error('Bad status code from server.');
    }

    const responseData = await response.json();

    if (!(responseData.data && responseData.data.success)) {
      throw new Error('Bad response from server.');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error while sending subscription:', err);
    throw err;
  }
}
