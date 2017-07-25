var dbHelper = require('../main/DBHelper');

var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;
var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  console.log("Setting components up");
  dbHelper.queryAllDevicesWithRoomAssignedButNoSensorAndShowIn(document.getElementById('devicesContainer'));
}

function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      ipc.send('rename-device',deviceID,name);
      //dbHelper.renameDevice(button.parentNode.id,name,remote.getCurrentWindow());
    }
  });
}

function onDeviceAssignSensorButtonClick(button){
  ipc.send('sensor_assignation_button_pressed',button.parentNode.id);
}
