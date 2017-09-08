var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  fillDevicesListAndRoomName();
  addOkButtonClickListener();
}

function fillDevicesListAndRoomName(){
    ipc.send('room_id_request');
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

ipc.on('room_name_response',(event,name) => {
  document.getElementById('room_name').innerHTML += name;
})

ipc.on('sensors-response',(event,sensors) => {
  var content = "";
  for(var a = 0; a < sensors.length; a++){
    content += "<option value = \"" + sensors[a].ID + "\"> " + sensors[a].Description + "</option>";
  }
  document.getElementById('sensors_list').innerHTML = content;
})


function cancel(){
  ipc.send('cancel');
}
