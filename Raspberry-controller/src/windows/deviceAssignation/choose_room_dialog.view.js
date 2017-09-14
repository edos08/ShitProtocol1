var ipc = require('electron').ipcRenderer;

function setUpComponents(){
   fillRoomsList();
}

function fillRoomsList(){
    ipc.send('room-request');
}

ipc.on('room-response',(event,rooms) => {
    var content = "";
    for(var a = 0; a < rooms.length; a++){
      content += "<option value = \"" + rooms[a].ID + "\"> " + rooms[a].Description + "</option>";
    }
    document.getElementById('rooms_list').innerHTML = content;
})

function roomOkListener() {
    var roomsList = document.getElementById('rooms_list');
    var roomID = roomsList.options[roomsList.selectedIndex].value;
    ipc.send('room_assignation_ok_button_pressed',roomID);
    console.log("ok button pressed - room");
}

function cancel(){
  ipc.send('cancel');
}

module.exports = {
  setUpComponents
}
