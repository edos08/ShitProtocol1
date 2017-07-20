var ipc = require('electron').ipcRenderer;
var DBHelper = require('./DBHelper');

function setUpElements(){
  setupRegisterDevicesButton
  DBHelper.checkFirstStartupOfSystem(displayEmptyDBMessage);
  DBHelper.fillRoomsScreen(document.getElementById('rooms_container'),"onRoomClicked");
}

function setupRegisterDevicesButton(){
  console.log("loaded");
  var registerDevicesButton = document.getElementById('register_devices_button');
  registerDevicesButton.addEventListener('click',function(){
    ipc.send('register_devices_pressed');
  });
}

function displayEmptyDBMessage(){
  document.getElementById('empty_db_message').innerHTML = "Non ci sono ancora dispositivi registrati. Premi il pulsante sottostante per iniziare il processo di registrazione dei dispositivi";
}


function onRoomClicked(id){
  console.log("Congratulations, you clicked on the room!");
  ipc.send('open_room_event',id);
}
