var dbHelper = require('../main/DBHelper');
var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;
var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  console.log("Setting components up");
  ipc.send('devices-with-no-room-request');
}

ipc.on('devices-with-no-room-response'(event,devices) => {
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

function populateListItemWithDeviceInfo(device){
  var content = "<li id = \"" + device.id +"\"> "
  + ((device.dev_desc != null)?device.dev_desc:"Dispositivo senza nome")
  + " - " + device.dev_type
  + "<button onClick=\"onDeviceRenameButtonClick(this)\"> Rinomina dispositivo </button>"
  + "<button onClick=\"onDeviceAssignToRoomButtonClick(this)\"> Assegna ad una stanza </button>"
  + ((device.dev_type_id == 2)?"<button onClick =\"onDeviceAssignSensorButtonClick(this)\"> Assegna un sensore </button>":"")
  + " </li>";
  return content;
}

function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      dbHelper.renameDevice(button.parentNode.id,name,remote.getCurrentWindow());
    }
  });
}

function onDeviceAssignToRoomButtonClick(button){
  ipc.send('room_assignation_button_pressed',button.parentNode.id);
}

function onDeviceAssignSensorButtonClick(button){
  ipc.send('sensor_assignation_button_pressed',button.parentNode.id);
}
