import './custom-select/custom-select';

function switchTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');
}

const themeSwitcher = document.getElementById('theme-switch');
themeSwitcher?.addEventListener('click', switchTheme);
