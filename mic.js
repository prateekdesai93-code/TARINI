chrome.storage.local.get('settings').then(g => { document.documentElement.dataset.theme = ((g.settings || {}).theme === 'light') ? 'light' : 'dark'; });
document.getElementById('allow').addEventListener('click', async () => {
  const out = document.getElementById('out');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    out.className = 'ok'; out.textContent = 'Done. You can close this tab and use the mic in Tarini.';
  } catch (e) {
    out.className = 'bad'; out.textContent = 'The microphone was blocked. Click the icon in the address bar, allow the microphone, then press the button again.';
  }
});
