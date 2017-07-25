var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;
var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  console.log("Setting components up");
  ipc.send('devices-with-no-room-request');
}

ipc.on('devices-with-no-room-response',(event,devices) => {
    var content = "";
    if(devices.length > 0){
      content = "<ul>";
      for(var a = 0; a < devices.length; a++){
          content += populateListItemWithDeviceInfo(devices[a]);
      }
      content += "</ul>";
    }else {
      content = "Nessun dispositivo da collegare ad altre stanze";
    }
    document.getElementById('devicesContainer').innerHTML = content;
})

function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      ipc.send('rename-device',button.parentNode.id,name);
    }
  });
}

function onDeviceAssignToRoomButtonClick(button){
  ipc.send('room_assignation_button_pressed',button.parentNode.id);
}

function onDeviceAssignSensorButtonClick(button){
  ipc.send('sensor_assignation_button_pressed',button.parentNode.id);
}
