// ---- Configuration ----
// In Access Point mode, the ESP32's IP is always 192.168.4.1 by default —
// no need to check Serial Monitor for it. Just connect your phone/laptop's
// WiFi to the ESP32's own network (see the .ino file for the network name).
let ESP32_IP = "192.168.4.1";

const ipInput    = document.getElementById('espIp');
const saveIpBtn  = document.getElementById('saveIp');
const connStatus = document.getElementById('connStatus');
const panels     = document.querySelectorAll('.panel');

ipInput.value = ESP32_IP;

function baseUrl(){
  return `http://${ESP32_IP}`;
}

function setConnStatus(ok, message){
  connStatus.textContent = message;
  connStatus.classList.toggle('ok', ok);
  connStatus.classList.toggle('err', !ok);
}

function setPanelState(panel, isOn){
  const stateLabel = panel.querySelector('.state-label');
  const btnOn      = panel.querySelector('.btn-on');
  const btnOff     = panel.querySelector('.btn-off');

  panel.classList.toggle('is-on', isOn);
  stateLabel.textContent = isOn ? "ON" : "OFF";
  btnOn.classList.toggle('active', isOn);
  btnOff.classList.toggle('active', !isOn);
}

async function sendCommand(panel, path, isOnAfter){
  const pin = panel.dataset.pin;
  try{
    const res = await fetch(`${baseUrl()}${path}`, { method: 'GET' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    setPanelState(panel, isOnAfter);
    setConnStatus(true, `Connected · GPIO${pin} command OK (${ESP32_IP})`);
  }catch(err){
    setConnStatus(false, `Could not reach ESP32 at ${ESP32_IP}. Check the IP and that both devices share the same WiFi network.`);
  }
}

async function refreshPanel(panel){
  const pin = panel.dataset.pin;
  try{
    const res = await fetch(`${baseUrl()}/led/${pin}/state`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json(); // expects { "state": "on" } or { "state": "off" }
    setPanelState(panel, data.state === 'on');
    setConnStatus(true, `Connected · state synced (${ESP32_IP})`);
  }catch(err){
    setConnStatus(false, `Could not reach ESP32 at ${ESP32_IP}. Set the correct IP address above.`);
  }
}

function refreshAll(){
  panels.forEach(refreshPanel);
}

// Wire up each panel's buttons
panels.forEach(panel => {
  const pin    = panel.dataset.pin;
  const btnOn  = panel.querySelector('.btn-on');
  const btnOff = panel.querySelector('.btn-off');

  btnOn.addEventListener('click',  () => sendCommand(panel, `/led/${pin}/on`, true));
  btnOff.addEventListener('click', () => sendCommand(panel, `/led/${pin}/off`, false));
});

saveIpBtn.addEventListener('click', () => {
  const val = ipInput.value.trim();
  if(val){
    ESP32_IP = val;
    refreshAll();
  }
});

ipInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') saveIpBtn.click();
});

// Try to sync current state of all panels on page load
refreshAll();
