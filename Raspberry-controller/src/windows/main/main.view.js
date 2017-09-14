var ipc = require('electron').ipcRenderer;

var Dialogs = require('dialogs');

var dialogs = Dialogs();

var chooseSensorDialog = require('../deviceAssignation/choose_sensor_dialog.view.js');

window.onload = setUpElements;

ipc.on('rooms-filled',(event,rooms) =>{
  var content = "";
  for(var a = 0; a < rooms.length; a++){
    content += "<button class = \"list-group-item list-group-item-action room\" id=\""+ rooms[a].ID +"\" onClick = \""+ "onRoomClicked" + "(this.id)\">" + rooms[a].Description + " </button>";
  }
  $('#rooms_container').html(content);
  $('#content').html("Clicca sul nome della stanza per vedere l'elenco dei dispositivi contenuti");
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
  var registerDevicesButton = $('#register_devices_button').click(function(){
    ipc.send('register_devices_pressed');
  });
}

function setupInsertRoomButton(){
  $('#insert_room_button').click(() =>{
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

ipc.on('devices-loaded',(event,roomName,devices,roomID) =>{
  var content = "<h3>" + roomName + "</h3>";
  if(devices.length > 0){
    content += "<div class=\"list-group\">";
    for(var a = 0; a < devices.length; a++){
      content += createDeviceItemForList(devices[a]);
    }
    content += "</div>";
  }else{
    content += "<p> Nessun dispositivo assegnato a questa stanza </p>";
  }
  content += "<button id = \"" + roomID +"\" class = \"btn btn-secondary\" onClick=\"deleteRoomButton(this)\" > Elimina la stanza </button>";
  $('#content').html(content);
})

function deleteRoomButton(button){
  ipc.send('delete-room',button.id);
}


function createDeviceItemForList(device){
    return "<button class=\"list-group-item list-group-item-action\""
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
  + (showManangingInfos(device))
  + (showStatInfo(device));
  
  $('#content').html(content);
  return content;
}

function showManangingInfos(device){
  return (
    
       "<div class =\"card card-outline-primary mb-3\" padding-bottom=15px>"
        + "<div class = \"card-header\">"
          + "<h3 class = \"card-title\"> " + device.description.trim() + " </h3>"
        + "</div>"
        + "<div class = \"card-block\">"
          + "Dispositivo: " + device.description + "</td> <td><button id = \"" + device.id + "\" onClick=\"onDeviceRenameButtonClick(this)\" class=\"btn btn-secondary\"> Rinomina </button></br> "
          + ((device.type == 2)?showDeviceSensorInfo(device):"")
          + ((device.type == 2)?showDeviceValueForm(device):"")
          + "<button id = \"" + device.id + "\" onClick=\"onDeviceAssignToRoomButtonClick(this)\" class=\"btn btn-secondary\"> Cambia stanza </button> </br>"
        + "</div>"  
      + "</div>");
    
}

function showDeviceSensorInfo(device){
  return ("Sensore: " + ((device.sensorID != null)?((device.sensor != null)?device.sensor:"sensore senza nome"):"Nessun sensore collegato") + "<br/>"
  + "<button id = \"" + device.id + "\" onClick =\"onDeviceAssignSensorButtonClick(this)\" class=\"btn btn-secondary\"> Cambia sensore </button></br>");
}

function showDeviceValueForm(device){
  return ("Valore corrente: " + device.value +"</br>"
    + "<div class = \"form-group\">"  
      + "<form onsubmit=\"return handleValueSubmission()\" id=\"" + device.id + "\">"
      + "<label for=\"lightValue\">Inserisci un nuovo valore (0 - 1023): </label>"
      + "<input class=\"form-control\" type=\"number\" id = \"lightValue\" placeholder=\"" + device.value + "\"/>"
      + "<button type=\"submit\" class=\"btn btn-secondary\">Cambia</button>"
    + "</div>"
  + "</form>");
}

function showStatInfo(device){
  
  var statDate = new Date(String(device.statTime));
  statDate.setHours(statDate.getHours() + 2); //la locale della raspberry è sballata di 2 ore

  return (
    "<div class =\"card card-outline-" + (chooseCardColor(device)) +" mb-3\">"
      + "<div class = \"card-header\">"   
        + "<h3 class = \"card-title\"> Informazioni </h3>"
      + "</div>"
      + "<div class = \"card-block\">"
        + (printStatus(device))
        + "<br/>"
        + (printLastValue(device))
        + "<br/>"
        + "Ultimo controllo: <br/>"
        + (isFinite(statDate)? statDate.toLocaleString("it-it") : "Ancora nessun controllo effettuato su questo dispositivio")
      + "</div>"
  + "</div>"
  );
}

function chooseCardColor(device){
  if(device.statValue != null){
    if(device.statValue <= 1023)
      return "success";
    else
      return "danger";
  } else {
    return "info";
  }
}

function printLastValue(device){
  if(device.statValue != null){
    if (device.statValue <= 1023) 
      return "Ultimo valore registrato: " + device.statValue;
    else 
      return "Ultimo valore registrato: Irraggiungibile";
  } else {
    return "Ultimo valore registrato: Attendere"
  }
}

function printStatus(device){
  var status = "Stato: ";
  if(device.statValue != null){
    if(device.statValue > 1023){
      status += "<font color=\"red\"> IRRAGGIUNGIBILE </font>";
    } else {
      status += "<font color = \"green\"> ATTIVO </font>";
    }
  } else {
    status += "Attendere il prossimo controllo";
  }
  return status;
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
  var valueInserted = $('#lightValue').val();
  if(valueInserted < 0 || valueInserted > 1023){
    ipc.send('invalid-value-inserted');
  }else{
    var deviceID = $('#lightValue').parent().attr('id');
    ipc.send('change-light-value',valueInserted,deviceID);
  }
  return false;
}

ipc.on('open_sensor_modal',() => {
  $('#assignSensorModal').load('../deviceAssignation/choose_sensor_dialog.html',() => {
    $('#assignSensorModal').modal();
    chooseSensorDialog.setUpComponents();
  });
})