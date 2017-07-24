const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./registration_process');

var dbHelper =require('./windows/main/DBHelper');

let window;
let deviceAssignationWindow;
let chooseRoomWindow;
let chooseSensorWindow;

let registrationActive = false;
let currentDeviceForWhichTheRoomIsBeingChosen = -1;
let currentRoomInWichTheSensorsAreHeld = -1;
let selectSensorAfterwardsTrigger = false;

app.on('ready', function(){
  window = new BrowserWindow({
    width: 1024,
    height: 768
  });

  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  //window.openDevTools();

  window.on('closed',() =>{
    window = null;
  });

  window.on('will-quit',() =>{
    registration.terminate();
  });
});

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
  registrationActive = false;
  deviceAssignationWindow = new BrowserWindow({parent: window, modal: true});
  //deviceAssignationWindow.openDevTools();
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');
}

ipc.on("register_devices_pressed",function(){
  console.log("Congratualtions, you have pressed the register devices button");
  registration.start(onRegistrationEnd);
  registrationActive = true;
});

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

ipc.on('room_assignation_button_pressed',function(event,deviceID){
  selectRoomFunction(deviceID,false);
})

ipc.on('room_assignation_ok_button_pressed',function(event,roomID){
  console.log("Ok button pressed with device = " + currentDeviceForWhichTheRoomIsBeingChosen + " and room " + roomID);
  dbHelper.assignDeviceToRoom(currentDeviceForWhichTheRoomIsBeingChosen,roomID);
  chooseRoomWindow.on('closed',() =>{
      deviceAssignationWindow.reload();
      if(selectSensorAfterwardsTrigger){
        currentRoomInWichTheSensorsAreHeld = roomID;
        selectSensorFunction(currentDeviceForWhichTheRoomIsBeingChosen);
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
  dbHelper.assignSensorToController(currentDeviceForWhichTheRoomIsBeingChosen,sensorID);
  chooseSensorWindow.on('closed',() =>{
    currentDeviceForWhichTheRoomIsBeingChosen = -1;
    currentRoomInWichTheSensorsAreHeld = -1;
  });
  chooseSensorWindow.close();
})

ipc.on('room_id_request',function(event){
  event.returnValue = currentRoomInWichTheSensorsAreHeld;
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

function selectSensorFunction(deviceID){
    chooseSensorWindow = new BrowserWindow({
      parent: deviceAssignationWindow,
      modal = true,
      width: 600,
      height, 200
    });

    var chooseSensorWindowURL = 'file://' + __dirname + '/windows/deviceAssignation/choose_sensor_dialog.html';
    chooseSensorWindow.loadURL(chooseSensorWindowURL);
    currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
}
