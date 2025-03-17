import './custom-select/custom-select';
import { setupNotifications } from './push-notifications/setupNotifications';

function switchTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');
}

const themeSwitcher = document.getElementById('theme-switch');
themeSwitcher?.addEventListener('click', switchTheme);

setupNotifications();
