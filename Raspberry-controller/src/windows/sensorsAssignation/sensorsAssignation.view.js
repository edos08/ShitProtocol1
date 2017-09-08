var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;
var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  console.log("Setting components up");
  ipc.send('devices-with-no-sensor-request');
}

ipc.on('devices-with-no-sensor-response',(event,devices) => {
    var content = "";
    if(devices.length > 0){
      content = "<ul class = \"list-group\">";
      for(var a = 0; a < devices.length; a++){
          content += populateListItemWithDeviceInfo(devices[a],false);
      }
      content += "</ul>";
    }else {
      content = "Nessun dispositivo da collegare ad altre stanze";
    }
    document.getElementById('devicesContainer').innerHTML = content;
})

function populateListItemWithDeviceInfo(device){
  var content = "<li id = \"" + device.id +"\" class = \"list-group-item\"> "
  + ((device.dev_desc != null)?device.dev_desc:"Dispositivo senza nome")
  + " - " + device.dev_type
  + "<div class=\"btn-group\" role=\"group\">"
  + "<button onClick=\"onDeviceRenameButtonClick(this)\" class = \"btn btn-default\"> Rinomina dispositivo </button>"
  + ((device.dev_type_id == 2)?"<button class = \"btn btn-default\" onClick =\"onDeviceAssignSensorButtonClick(this)\"> Assegna un sensore </button>":"")
  + "</div>"
  + " </li>";
  return content;
}


function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      ipc.send('rename-device',button.parentNode.parentNode.id,name);
    }
  });
}

function onDeviceAssignSensorButtonClick(button){
  ipc.send('sensor_assignation_button_pressed',button.parentNode.parentNode.id);
}
