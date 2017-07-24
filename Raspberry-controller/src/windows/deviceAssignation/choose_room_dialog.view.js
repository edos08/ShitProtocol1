var ipc = require('electron').ipcRenderer;
var dbHelper = require('../main/DBHelper');

function setUpComponents(){
   fillRoomsList();
}

function fillRoomsList(){
    dbHelper.fillRoomsList(document.getElementById('rooms_list'));
}

function addOkButtonClickLIstener(){
  var okButton = document.getElementById('ok_button');
  okButton.addEventListener('click',function(){
    var roomList = document.getElementById('rooms_list');
    var roomID = roomList.options[roomList.selectedIdex].value;
    ipc.send('room_assignation_ok_button_pressed',roomID);
  })
}
