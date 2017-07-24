var ipc = require('electron').ipcRenderer;

var remote = require('electron').remote;

var dbHelper = require('./DBHelper');

var Dialogs = require('dialogs');

var dialogs = Dialogs();

function setUpElements(){
  setupRegisterDevicesButton();
  setupInsertRoomButton();
  dbHelper.checkFirstStartupOfSystem(displayEmptyDBMessage);
  dbHelper.fillRoomsScreen(document.getElementById('rooms_container'),"onRoomClicked");
}

function setupRegisterDevicesButton(){
  var registerDevicesButton = document.getElementById('register_devices_button');
  registerDevicesButton.addEventListener('click',function(){
    ipc.send('register_devices_pressed');
  });
}

function setupInsertRoomButton(){
  var insertRoomButton = document.getElementById('insert_room_button');
  insertRoomButton.addEventListener('click',function(){
    ipc.send('insert_room_button_pressed');
    dialogs.prompt("Inserisci il nome della nuova pagina"," ",function(ok){
      if(ok != null && ok != "" && ok != " " && ok != undefined){
        console.log(ok);
        dbHelper.insertRoomIntoDB(ok,remote.getCurrentWindow());
      }
    });
  });
}

function onAssignButtonCLick(){
    ipc.send('assign_devices_button_pressed');
}

function onSensorAssignButtonClick(){
  ipc.send('assign_sensor_button_pressed');
}

function displayEmptyDBMessage(){
  document.getElementById('empty_db_message').innerHTML = "Non ci sono ancora dispositivi registrati. Premi il pulsante sottostante per iniziare il processo di registrazione dei dispositivi";
}

function onRoomClicked(id){
  console.log("Congratulations, you clicked on the room!");
  dbHelper.fillContentDivWithDevices(document.getElementById('content'),id)
}
