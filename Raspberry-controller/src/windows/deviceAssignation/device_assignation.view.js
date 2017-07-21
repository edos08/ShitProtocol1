var dbHelper = require('../main/DBHelper');
var Dialogs = require('dialogs');
var dialogs = Dialogs();

function setUpComponents(){
  dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn(document.getElementById('devicesContainer'));
}

onDeviceRenameButtonClick(id){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      dbHelper.renameDevice(id,name);
    }
  });
}
