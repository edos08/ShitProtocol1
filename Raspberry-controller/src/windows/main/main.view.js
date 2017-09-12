var ipc = require('electron').ipcRenderer;

var Dialogs = require('dialogs');

var dialogs = Dialogs();

window.onload = setUpElements;

ipc.on('rooms-filled',(event,rooms) =>{
  var content = "";
  for(var a = 0; a < rooms.length; a++){
    content += "<button type=\"button\" class = \"list-group-item\" id=\""+ rooms[a].ID +"\" onClick = \""+ "onRoomClicked" + "(this.id)\">" + rooms[a].Description + " </button>";
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
  //document.getElementById('empty_db_message').innerHTML = "Non ci sono ancora dispositivi registrati. Premi il pulsante sottostante per iniziare il processo di registrazione dei dispositivi";
}

function onRoomClicked(id){
  console.log("loading room " + id);
  ipc.send('fill_room_view',id);
}

ipc.on('devices-loaded',(event,devices,roomID) =>{
  var content = "";
  if(devices.length > 0){
    content += "<ul class=\"list-group\">";
    for(var a = 0; a < devices.length; a++){
      content += createDeviceItemForList(devices[a]);
    }
    content += "</ul>";
  }else{
    content += "<p> Nessun dispositivo assegnato a questa stanza </p>";
  }
  content += "<button id = \"" + roomID +"\" class = \"btn btn-default\" onClick=\"deleteRoomButton(this)\" > Elimina la stanza </button>";
  document.getElementById('content').innerHTML = content;
})

function deleteRoomButton(button){
  ipc.send('delete-room',button.id);
}


function createDeviceItemForList(device){
    return "<button class=\"list-group-item\""
    + " id = \"" + device.ID + "\""
    + ((device.type != 1)?"onClick = \"onDeviceClicked(this)\"":"")
    + "> "
    + ((device.desc != null)?device.desc:"Dispositivo senza nome")
    + " ("
    + device.dev_type
    + ")"
    + "</button>";
}

function onDeviceClicked(device){
  console.log("Loading device: " + device.id);
  ipc.send('gather-device-info',device.id);
}

ipc.on('device-info-gathered',(event,device) => {
  showDeviceInfos(device);
})

function showDeviceInfos(device){
  console.log("Displaying infos for device " + device.id);
  
  content = ""
  + "<td> Dispositivo: " + device.description + "</td> <td><button id = \"" + device.id + "\" onClick=\"onDeviceRenameButtonClick(this)\" class=\"btn btn-default\"> Rinomina </button></td></br> "
  + ((device.type == 2)?showDeviceSensorInfo(device):"")
  + ((device.type == 2)?showDeviceValueForm(device):"")
  + "<td><button id = \"" + device.id + "\" onClick=\"onDeviceAssignToRoomButtonClick(this)\" class=\"btn btn-default\"/> Cambia stanza </button> </br></td>"
  + "<br/> <br/>"
  + (showStatInfo(device));
  
  document.getElementById('content').innerHTML = content;
  return content;
}

function showManangingInfos(device){
  return (
  + "<div  class =\"panel panel-default\">"
    + "<div class = \"panel-heading\">"
      + "<h3 class = \"panel-title\"> Gestione </h3>"
    + "</div>"
    + "<div class = \"panel-body\">"
      + "<td> Dispositivo: " + device.description + "</td> <td><button id = \"" + device.id + "\" onClick=\"onDeviceRenameButtonClick(this)\" class=\"btn btn-default\"> Rinomina </button></td></br> "
      + ((device.type == 2)?showDeviceSensorInfo(device):"")
      + ((device.type == 2)?showDeviceValueForm(device):"")
      + "<td><button id = \"" + device.id + "\" onClick=\"onDeviceAssignToRoomButtonClick(this)\" class=\"btn btn-default\"/> Cambia stanza </button> </br></td>"
    + "</div>"  
  + "</div>");
}

function showDeviceSensorInfo(device){
  return ("<td>Sensore: " + ((device.sensorID != null)?((device.sensor != null)?device.sensor:"sensore senza nome"):"Nessun sensore collegato") + "</td>"
  + "<td><button id = \"" + device.id + "\" onClick =\"onDeviceAssignSensorButtonClick(this)\" class=\"btn btn-default\"> Cambia sensore </button></td></br>");
}

function showDeviceValueForm(device){
  return ("<td>Valore corrente: </td></br>"
  + "<form onsubmit=\"return handleValueSubmission()\" id=\"" + device.id + "\">"
  + "Valore (0 - 1023): <input type=\"number\" id = \"lightValue\" value = \"" + device.value + "\"/>"
  + "<input type=\"submit\" class=\"btn btn-default\"/>"
  + "</form>");
}

function showStatInfo(device){
  
  var statDate = new Date(String(device.statTime));
  statDate.setHours(statDate.getHours() + 2); //la locale della raspberry è sballata di 2 ore

  return (
    "<div class =\"panel panel-default\">"
      + "<div class = \"panel-heading\">"   
        + "<h3 class = \"panel-title\"> Informazioni </h3>"
      + "</div>"
      + "<div class = \"panel-body\">"
        + "Stato: "
        + ((device.statValue > 1023) ? "<fontcolor=\"red\"> IRRAGGIUNGIBILE </font>" : "<font color = \"green\"> ATTIVO </font>")
        + "<br/>"
        + ((device.statValue < 1023) ? "Ultimo valore registrato: " + device.statValue : "" )
        + "<br/>"
        + "Ultimo controllo: <br/>"
        + statDate.toLocaleString("it-it")
      + "</div>"
  + "</div>"
  );
}

function onDeviceRenameButtonClick(button){
  dialogs.prompt("Inserisci il nuovo nome per il dispositivo: ",function(name){
    if(name != null && name != undefined && name != "" && name != " "){
      ipc.send('rename-device',button.id,name);
    }
  });
}

function onDeviceAssignToRoomButtonClick(button){
  ipc.send('room_assignation_button_pressed',button.id);
}

function onDeviceAssignSensorButtonClick(button){
  ipc.send('sensor_assignation_button_pressed',button.id);
}

function handleValueSubmission(){
  console.log("value-changed");
  var valueInserted = document.getElementById('lightValue').value;
  if(valueInserted < 0 || valueInserted > 1023){
    ipc.send('invalid-value-inserted');
  }else{
    var deviceID = document.getElementById('lightValue').parentNode.id;
    ipc.send('change-light-value',valueInserted,deviceID);
  }
  return false;
}

module.exports = {
  handleValueSubmission,
  showDeviceInfos,
  window
}
