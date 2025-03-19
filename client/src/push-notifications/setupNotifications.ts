import { environment } from '../environment';
import { urlBase64ToUint8Array } from '../utils/urlBase64ToUint8Array';
export const setupNotifications = () => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service workers are not supported.');
    return;
  }

  if (!('PushManager' in window)) {
    console.error('Push notifications are not supported.');
    return;
  }

  askPermission()
    .then(() => registerServiceWorker())
    .then((registration) => {
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
    .then((registration) => {
      registration.active?.postMessage({
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

      console.log({ subscribeOptions });

      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(async (pushSubscription) => {
      if (pushSubscription) {
        await sendSubscriptionToBackend(pushSubscription);
      }
    })
    .catch((err) => {
      console.error('Error setting up notifications:', err);
    });
};

function registerServiceWorker() {
  return navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('Service worker successfully registered.');
      return registration;
    })
    .catch((err) => {
      console.error('Unable to register service worker.', err);
      throw new Error('Service Worker registration failed');
    });
}

function askPermission(): Promise<void> {
  return new Promise((resolve, reject) => {
    Notification.requestPermission()
      .then((permissionResult) => {
        if (permissionResult !== 'granted') {
          reject(new Error("We weren't granted permission."));
        }
        console.log('PERMISSION GRANTED');
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
    console.error('Error while sending subscription:', err);
    throw err;
  }
}
