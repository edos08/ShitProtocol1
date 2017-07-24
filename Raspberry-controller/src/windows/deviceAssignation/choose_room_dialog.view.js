var ipc = require('electron').ipcRenderer;
var dbHelper = require('../main/DBHelper');

function setUpComponents(){
   fillRoomsList();
   addOkButtonClickListener();
}

function fillRoomsList(){
    dbHelper.fillRoomsList(document.getElementById('rooms_list'));
}

function addOkButtonClickListener(){
  var okButton = document.getElementById('ok_button');
  okButton.addEventListener('click',function(){
    var roomsList = document.getElementById('rooms_list');
    var roomID = roomsList.options[roomsList.selectedIndex].value;
    ipc.send('room_assignation_ok_button_pressed',roomID);
    console.log('ok button clicked');
  });
}
