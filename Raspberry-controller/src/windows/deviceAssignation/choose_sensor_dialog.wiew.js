var ipc = require('electron').ipcRenderer;
var dbHelper = require('../main/DBHelper');

function setUpComponents(){
  fillDevicesListAndRoomName();
  addOkButtonClickListener();
}

function fillDevicesListAndRoomName(){
    ipc.send('room_id_request');
    dbHelper.fillSensorsList(document.getElementById('sensors_list'));
}

function addOkButtonClickListener(){
  var okButton = document.getElementById('ok_button');
  okButton.addEventListener('click',function(){
    var sensorsList = document.getElementById('sensors_list');
    var sensorID = sensorsList.options[sensorsList.selectedIndex].value;
    ipc.send('sensor_assignation_ok_button_pressed',sensorID);
    console.log('ok button clicked');
  });
}

ipc.on('room_response',function(event,room){
  console.log('Room ID received');
  dbHelper.fillRoomNameContainer(room,document.getElementById('room_name'));
})
