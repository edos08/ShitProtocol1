var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;
var ipc = require('electron').ipcRenderer;

var chooseSensorDialog = require('./choose_sensor_dialog.view.js');
var chooseRoomDialog = require('./choose_room_dialog.view.js');


function setUpComponents(){
  console.log("Setting components up");
  ipc.send('devices-with-no-room-request');
}

ipc.on('devices-with-no-room-response',(event,devices) => {
    console.log("loading");
    var content = "";
    if(devices.length > 0){
      content = "<ul class = \"list-group\">";
      for(var a = 0; a < devices.length; a++){
          content += populateListItemWithDeviceInfo(devices[a]);
      }
      content += "</ul>";
    }else {
      content = "Nessun dispositivo da collegare ad altre stanze";
    }
    $('#devicesContainer').html(content);
})

function populateListItemWithDeviceInfo(device){
  var content = "<li id = \"" + device.id +"\" class = \"list-group-item dev-inf\"> "
  + "<div class=\"mb-3\" >"
    + ((device.dev_desc != null)?device.dev_desc:"Dispositivo senza nome")
    + " - " + device.dev_type
  + "</div>"
  + "<div class=\"btn-group\" role=\"group\">"
    + "<button onClick=\"onDeviceRenameButtonClick(this)\" class = \"btn btn-secondary\"> Rinomina dispositivo </button>"
    + "<button onClick=\"onDeviceAssignToRoomButtonClick(this)\" class = \"btn btn-secondary\"> Assegna ad una stanza </button>"
    + ((device.dev_type_id == 2)?"<button onClick =\"onDeviceAssignSensorButtonClick(this)\" class = \"btn btn-secondary\"> Assegna un sensore </button>":"")
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

function onDeviceAssignToRoomButtonClick(button){
    ipc.send('room_assignation_button_pressed',button.parentNode.parentNode.id);
}

function onDeviceAssignSensorButtonClick(button){
    ipc.send('sensor_assignation_button_pressed',button.parentNode.parentNode.id);
}

ipc.on('open_sensor_modal',() => {
  if($('#assignSensorModal').html() == ""){
    $('#assignSensorModal').load('./choose_sensor_dialog.html',() => {
      $('#assignSensorModal').modal();
      chooseSensorDialog.setUpComponents();
    });
  } else {
    $('#assignSensorModal').modal();
    chooseSensorDialog.setUpComponents();
  }
})


ipc.on('open_room_modal',() => {
  if($('#assignRoomModal').html() == ""){
    $('#assignRoomModal').load('./choose_room_dialog.html',() => {
      $('#assignRoomModal').modal();
      chooseRoomDialog.setUpComponents();
    });
  } else {
    $('#assignRoomModal').modal();
    chooseRoomDialog.setUpComponents();
  }
});

