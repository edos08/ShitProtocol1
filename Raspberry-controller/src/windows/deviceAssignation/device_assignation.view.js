var dbHelper = require('../main/DBHelper');
var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;

function setUpComponents(){
  console.log("Setting components up");
  dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn(document.getElementById('devicesContainer'));
}

function onDeviceRenameButtonClick(id){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      dbHelper.renameDevice(id,name,remote.getCurrentWindow());
    }
  });
}
