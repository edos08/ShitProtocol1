var ipc = require('electron').ipcRenderer;

function setUpElements(){
  setupRegisterDevicesButton();
}

function setupRegisterDevicesButton(){
  console.log("loaded");
  var registerDevicesButton = document.getElementById('register_devices_button');
  registerDevicesButton.addEventListener('click',function(){
    ipc.once('actionReply',function(){
    });
    ipc.send('register_devices_pressed');
  });
}
