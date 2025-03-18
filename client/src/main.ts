import './custom-select/custom-select.ts';
import { environment } from './environment.ts';
import { setupNotifications } from './push-notifications/setupNotifications.ts';

function switchTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');
}

const themeSwitcher = document.getElementById('theme-switch');
themeSwitcher?.addEventListener('click', switchTheme);

setupNotifications();

const notificationsButton = document.getElementById(
  'notifications-button'
);

notificationsButton.addEventListener('click', async () => {
  const result = await fetch(
    `${environment.publicUrl}/api/send-notification/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify('Hello from the client!'),
    }
  );

  try {
    const json = await result.json();
    console.log(json);
  } catch (error) {
    console.error(error);
  }
});
