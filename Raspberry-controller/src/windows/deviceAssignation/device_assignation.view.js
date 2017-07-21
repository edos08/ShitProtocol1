var dbHelper = require('../main/DBHelper');
var Dialogs = require('dialogs');
var dialogs = Dialogs();

var remote = require('electron').remote;

function setUpComponents(){
  console.log("Setting components up");
  dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn(document.getElementById('devicesContainer'));
}

function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      dbHelper.renameDevice(button.parentNode.id,name,remote.getCurrentWindow());
    }
  });
}

function onDeviceAssignToRoomButton(button){
  openModal();
}

function openModal() {
  let win = new remote.BrowserWindow({
    parent: remote.getCurrentWindow(),
    modal: true
  })

  var theUrl = 'file://' + __dirname + '/choose_room_dialog.html'
  console.log('url', theUrl);

  win.loadURL(theUrl);
}
