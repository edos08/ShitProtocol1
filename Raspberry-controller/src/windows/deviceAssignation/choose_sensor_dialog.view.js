var ipc = require('electron').ipcRenderer;

function setUpComponents(){
  fillDevicesListAndRoomName();
  addOkButtonClickListener();
}

function fillDevicesListAndRoomName(){
    ipc.send('room_id_request');
}

function addOkButtonClickListener(){
  $('#ok_button').click(function(){
    //var sensorsList = document.getElementById('sensors_list');
    var sensorID = $('#sensors_list').find(':selected').val();
    console.log(sensorID);
    ipc.send('sensor_assignation_ok_button_pressed',sensorID);
    console.log('ok button clicked');
  });
}

ipc.on('room_name_response',(event,name) => {
  $('#room_name').append(name);
})

ipc.on('sensors-response',(event,sensors) => {
  var content = "";
  for(var a = 0; a < sensors.length; a++){
    content += "<option value = \"" + sensors[a].ID + "\"> " + sensors[a].Description + "</option>";
  }
  $('#sensors_list').html(content);
})


function cancel(){
  ipc.send('cancel');
}


module.exports = {
  setUpComponents
}