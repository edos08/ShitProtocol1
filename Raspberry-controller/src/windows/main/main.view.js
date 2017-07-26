var ipc = require('electron').ipcRenderer;

var Dialogs = require('dialogs');

var dialogs = Dialogs();

window.onload = setUpElements;


ipc.on('rooms-filled',(event,rooms) =>{
  console.log("refresh");
  var content = "";
  for(var a = 0; a < rooms.length; a++){
    content+= "<hr>";
    content += "<li class = \"room_element\" id=\""+ rooms[a].ID +"\" onClick = \""+ "onRoomClicked" + "(this.id)\">" + rooms[a].Description + " </li>";
    content += "<hr>";
  }
  document.getElementById('rooms_container').innerHTML = content;
})

ipc.on('dev-no-dialog',(event) => {
  dialogs.prompt('Inserisci il numero di dispositivi da registrare','1',(deviceNumber) => {
    ipc.send('registration-device-start',deviceNumber);
  })
});

function setUpElements(){
  setupRegisterDevicesButton();
  setupInsertRoomButton();
  ipc.send('check-first-startup',displayEmptyDBMessage);
  ipc.send('fill-rooms-screen');
}


function setupRegisterDevicesButton(){
  var registerDevicesButton = document.getElementById('register_devices_button');
  registerDevicesButton.addEventListener('click',function(){
    ipc.send('register_devices_pressed');
  });
}

function setupInsertRoomButton(){
  var insertRoomButton = document.getElementById('insert_room_button');
  insertRoomButton.addEventListener('click',function(){
    ipc.send('insert_room_button_pressed');
    dialogs.prompt("Inserisci il nome della nuova pagina"," ",function(ok){
      if(ok != null && ok != "" && ok != " " && ok != undefined){
        console.log(ok);
        ipc.send('insert_new_room',ok);
      }
    });
  });
}

function onAssignButtonCLick(){
    ipc.send('assign_devices_button_pressed');
}

function onSensorAssignButtonClick(){
  ipc.send('assign_sensor_button_pressed');
}

function displayEmptyDBMessage(){
  document.getElementById('empty_db_message').innerHTML = "Non ci sono ancora dispositivi registrati. Premi il pulsante sottostante per iniziare il processo di registrazione dei dispositivi";
}

function onRoomClicked(id){
  console.log("Congratulations, you clicked on the room!");
  ipc.send('fill_room_view',id);
}

ipc.on('devices-loaded',(event,devices) =>{
  var content = "<ul>";
  for(var a = 0; a < devices.length; a++){
    content += createDeviceItemForList(devices[a]);
  }
  content += "</ul>";
  document.getElementById('content').innerHTML = content;
})


function createDeviceItemForList(device){
    return "<li"
    + " id = \"" + device.ID + "\""
    + ((device.type == 2)?"onClick = \"onDeviceClicked(this)\"":"")
    + "> "
    + ((device.desc != null)?device.desc:"Dispositivo senza nome")
    + " ("
    + device.dev_type
    + ")"
    + "</li>";
}

function onDeviceClicked(device){
  console.log("Device clicked");
  ipc.send('gather-device-info',device.id);
}

ipc.on('device-info-gathered',(event,device) => {
  console.log("Displaying infoos");
  content = "Dispositivo: " + device.description + "</br>"
  + "Sensore: " + ((device.sensorID != null)?((device.sensor != null)?device.sensor:"sensore senza nome"):"Nessun sensore collegato") + "</br>"
  + "Valore corrente: </br>"
  + "<form onsubmit=\"handleValueSubmission()\" id=\"" + device.id + "\">"
  + "Valore (0 - 1023): <input type=\"number\" id = \"lightValue\" value = \"" + device.value + "\">"
  + "<input type=\"submit\" >"
  + "</form>"
  document.getElementById('content').innerHTML = content;

})

function handleValueSubmission(){
  var valueInserted = document.getElementById('lightValue').value;
  if(valueInserted < 0 || valueInserted > 1023){
    ipc.send('invalid-value-inserted');
  }else{
    var deviceID = document.getElementById('lightValue').parentNode.id;
    ipc.send('change-light-value',valueInserted,deviceID);
  }
}
