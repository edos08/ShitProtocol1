const {app,BrowserWindow,dialog} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./serial/registration_process');
var handshake = require('./serial/Handshake_process');
var dbHelper =require('./windows/main/DBHelper');

let window;
let deviceAssignationWindow;
let chooseRoomWindow;
let chooseSensorWindow;
let sensorsAssignationWindow;

let registrationActive = false;
let currentDeviceForWhichTheRoomIsBeingChosen = -1;
let currentRoomInWhichTheSensorsAreHeld = -1;
let currentSensorTowhichTheDeviceIsBeingConnected = -1;
let currentDeviceWhichValueIsBeingChanged = -1;
let currentValueThatIsBeingChanged = -1;
let selectSensorAfterwardsTrigger = false;

let devicePingingDone = false;

app.on('ready', function(){
  handshake.init(initMain);
});

function initMain(){
  window = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: false
  });

  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  //window.openDevTools();

  window.on('closed',() =>{
    window = null;
  });

  registration.init(pingCallback);
  checkDevicesStatus();
}

app.on('window-all-closed', () => {
  app.quit()
});

app.on('quit',()=>{
    registration.terminate();
})

ipc.on('test-ping',() => {
  registration.sendCheckSensorStatePacket(0x95bdb63d);
})

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
  registrationActive = false;
  deviceAssignationWindow = new BrowserWindow({parent: window, modal: true});
  //deviceAssignationWindow.openDevTools();
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');
}

ipc.on('check-first-startup',function(event,filler){
  dbHelper.checkFirstStartupOfSystem(filler);
})

ipc.on('fill-rooms-screen',function(event){
  dbHelper.fillRoomsScreen((rooms) =>{
      event.sender.send('rooms-filled',rooms);
  });

})

ipc.on('fill_room_view',(event,roomID) => {
  dbHelper.fillContentDivWithDevices(roomID,(devices) =>{
    event.sender.send('devices-loaded',devices,roomID)
  });
});

ipc.on('delete-room',(event,roomID) => {
  dbHelper.deleteRoom(roomID,() => {
    window.reload();
  })
});

ipc.on('gather-device-info',(event,deviceID) => {
  gatherDeviceInfo(event,deviceID);
})

function gatherDeviceInfo(event,deviceID){
  console.log("device id " + deviceID);
  dbHelper.getDeviceInfo(deviceID,(device) => {
    console.log("sending event back");
    event.sender.send('device-info-gathered',device);
  })
}

ipc.on('invalid-value-inserted',(event) => {
  dialog.showErrorBox("Valore inserito non valido", "Il valore di luminosità deve essere tra 0 e 1023")
})

ipc.on('change-light-value',(event,newValue,deviceID) => {
  currentDeviceWhichValueIsBeingChanged = deviceID;
  currentValueThatIsBeingChanged = newValue;
  console.log("change light value " + deviceID + " " + newValue );
  registration.setAction(onLightChangedAction);
  dbHelper.getAddressForController(deviceID,(address) => {
    registration.sendLightValueChangedPacket(address,newValue);
  })
})

function onLightChangedAction(result){
  if(result == 1){
    dbHelper.changeLightValue(currentDeviceWhichValueIsBeingChanged, currentValueThatIsBeingChanged, () => {
      displaySuccessDialog("Luminosità aggiornata correttamente");
    });
  }else{
    dialog.showErrorBox("Azione non riuscita", "Il dispositivo non sembra essere raggiungibile");
  }
}

ipc.on('insert_new_room',function(event,roomName){
  dbHelper.insertRoomIntoDB(roomName,window,() => {
      dialog.showErrorBox("Valore inserito non valido", "Il nome non può essere ripetuto")
  });
})


ipc.on("register_devices_pressed",function(event){
  console.log("Congratualtions, you have pressed the register devices button");
  event.sender.send('dev-no-dialog');
});

ipc.on('registration-device-start',(event,devicesNumber) => {
  registration.start(onRegistrationEnd,devicesNumber);
  registrationActive = true;
})

ipc.on("insert_room_button_pressed", function(){
  console.log("Button rooms pressed");
});

ipc.on('assign_devices_button_pressed',function(){
  deviceAssignationWindow = new BrowserWindow({
    parent: window,
    modal: true
  });
  //deviceAssignationWindow.openDevTools();
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');
});


ipc.on('assign_sensor_button_pressed',function(){
  sensorsAssignationWindow = new BrowserWindow({
    parent: window,
    modal: true,
  });
  var sensorsAssignationURL = 'file://' + __dirname + '/windows/sensorsAssignation/sensorsAssignation.html';
  sensorsAssignationWindow.loadURL(sensorsAssignationURL);
})

ipc.on('room_assignation_button_pressed',function(event,deviceID){
  selectRoomFunction(deviceID,false);
})

ipc.on('room_assignation_ok_button_pressed',function(event,roomID){
  console.log("Ok button pressed with device = " + currentDeviceForWhichTheRoomIsBeingChosen + " and room " + roomID);
  dbHelper.assignDeviceToRoom(currentDeviceForWhichTheRoomIsBeingChosen,roomID);
  chooseRoomWindow.on('closed',() =>{
      if(deviceAssignationWindow && !deviceAssignationWindow.isDestroyed())
        deviceAssignationWindow.reload();
      else
        window.reload();
      if(selectSensorAfterwardsTrigger){
        selectSensorFunction(currentDeviceForWhichTheRoomIsBeingChosen,roomID);
      }else {
        currentDeviceForWhichTheRoomIsBeingChosen = -1;
      }
  })
  chooseRoomWindow.close();

})

ipc.on('sensor_assignation_button_pressed',function(event,deviceID){
  dbHelper.checkIfHasRoomAssignedAndSelectSensor(deviceID,selectRoomFunction,selectSensorFunction);
})

ipc.on('sensor_assignation_ok_button_pressed',function(event,sensorID){

  currentSensorTowhichTheDeviceIsBeingConnected = sensorID;

  registration.setAction(onSensorSubmissionAction);

  dbHelper.getAddressesForControllerAndSensor(currentDeviceForWhichTheRoomIsBeingChosen,sensorID,(devAddress,sensAddress) => {
    registration.sendSensorSubmissionPacket(devAddress,sensAddress);
  })

  chooseSensorWindow.on('closed',() =>{
    currentDeviceForWhichTheRoomIsBeingChosen = -1;
    currentRoomInWhichTheSensorsAreHeld = -1;
    if(sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed())
      sensorsAssignationWindow.reload();
    else
      window.reload();
  });
})

function onSensorSubmissionAction(result){
  if(result == 1){
    dbHelper.assignSensorToController(currentDeviceForWhichTheRoomIsBeingChosen,currentSensorTowhichTheDeviceIsBeingConnected);
    displaySuccessDialog("Sensore aggiornato correttamente");
  }else{
    dialog.showErrorBox("Azione non riuscita", "Il dispositivo non sembra essere raggiungibile");
  }
  chooseSensorWindow.close();
}

ipc.on('room_id_request',function(event){
  //event.sender.send('room_response',currentRoomInWhichTheSensorsAreHeld);
  dbHelper.fillRoomNameContainer(currentRoomInWhichTheSensorsAreHeld,(name) => {
    event.sender.send('room_name_response',name);
  });
  dbHelper.fillSensorsList(currentRoomInWhichTheSensorsAreHeld,(sensors) => {
    event.sender.send('sensors-response',sensors);
  });
})

ipc.on('room-request',(event) => {
  dbHelper.fillRoomsList((rooms) => {
    event.sender.send('room-response',rooms);
  });
})

ipc.on('cancel',function(){
  BrowserWindow.getFocusedWindow().close();
})

ipc.on('devices-with-no-room-request',(event) => {
  dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn((devices) => {
    event.sender.send('devices-with-no-room-response',devices);
  });
})

ipc.on('devices-with-no-sensor-request',(event) => {
  dbHelper.queryAllDevicesWithRoomAssignedButNoSensorAndShowIn((devices) => {
    event.sender.send('devices-with-no-sensor-response',devices);
  });
})

ipc.on('rename-device',(event,deviceID,name) => {
  dbHelper.renameDevice(deviceID,name,() => {
    if(sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed())
      sensorsAssignationWindow.reload();
    else if(deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed())
      deviceAssignationWindow.reload();
    else
      window.reload();
  },() => {
      dialog.showErrorBox("Valore inserito non valido", "Il nome non può essere ripetuto")
  });
})

function selectRoomFunction(deviceID,selectSensorAfterwards){
    chooseRoomWindow = new BrowserWindow({
      parent: deviceAssignationWindow,
      modal: true,
      width:600,
      height: 200
    })

    var chooseRoomWindowURL = 'file://' + __dirname + '/windows/deviceAssignation/choose_room_dialog.html';
    chooseRoomWindow.loadURL(chooseRoomWindowURL);
    currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
    selectSensorAfterwardsTrigger = selectSensorAfterwards;
}

function selectSensorFunction(deviceID,roomID){
    chooseSensorWindow = new BrowserWindow({
      parent: deviceAssignationWindow,
      modal: true,
      width: 600,
      height: 200
    });

    currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
    currentRoomInWhichTheSensorsAreHeld = roomID;

    var chooseSensorWindowURL = 'file://' + __dirname + '/windows/deviceAssignation/choose_sensor_dialog.html';
    chooseSensorWindow.loadURL(chooseSensorWindowURL);
}

function displaySuccessDialog(success_message){
  dialog.showMessageBox(window,{
    type: "info",
    buttons: ["Ok"],
    title: "Azione riuscita",
    message: success_message
  })
}

function checkDevicesStatus(){
    dbHelper.queryAllDevicesAddresses(pingAllDevices);
}

function pingAllDevices(devices){
  var hasSentPing = false;
  for(var a = 0; a < devices.length; a++){
    if(!hasSentPing){
      console.log("Pinging device: " + (devices[a].Address >>> 0).toString(16));
      devicePingingDone = false;
      hasSentPing = true;
      if(devices.Type == 3)
        registration.sendCheckSensorStatePacket(devices[a].Address);
      else if (devices.Type == 2) {
        registration.sendCheckControllerStatePacket(devices[a].Address);
      }
    }
    if(!devicePingingDone){
      a--;
    }
  }
  setTimeout(checkDevicesStatus, 1000 * 60 * 5);
}

function pingCallback(){
  devicePingingDone = true;
}
