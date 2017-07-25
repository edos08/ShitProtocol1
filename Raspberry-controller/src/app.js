const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./registration_process');
var handshake = require('./Handshake_process');

var dbHelper =require('./windows/main/DBHelper');

let window;
let deviceAssignationWindow;
let chooseRoomWindow;
let chooseSensorWindow;
let sensorsAssignationWindow;

let registrationActive = false;
let currentDeviceForWhichTheRoomIsBeingChosen = -1;
let currentRoomInWhichTheSensorsAreHeld = -1;
let selectSensorAfterwardsTrigger = false;

app.on('ready', function(){
  handshake.init(initMain);
});

function initMain(){
  window = new BrowserWindow({
    width: 1024,
    height: 768
  });

  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  //window.openDevTools();

  window.on('closed',() =>{
    window = null;
  });
}

app.on('window-all-closed', () => {
  app.quit()
});

app.on('quit',()=>{
    registration.terminate();
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
    event.sender.send('devices-loaded',devices)
  });
});

ipc.on('insert_new_room',function(event,roomName){
  dbHelper.insertRoomIntoDB(roomName,window);
})


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
      deviceAssignationWindow.reload();
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
  dbHelper.assignSensorToController(currentDeviceForWhichTheRoomIsBeingChosen,sensorID);
  chooseSensorWindow.on('closed',() =>{
    currentDeviceForWhichTheRoomIsBeingChosen = -1;
    currentRoomInWhichTheSensorsAreHeld = -1;
    if(sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed())
      sensorsAssignationWindow.reload();
  });
  chooseSensorWindow.close();
})

ipc.on('room_id_request',function(event){
  //event.sender.send('room_response',currentRoomInWhichTheSensorsAreHeld);
  dbHelper.fillRoomNameContainer(currentRoomInWhichTheSensorsAreHeld,(name) => {
    event.sender.send('room_name_response',name);
  });
  dbHelper.fillSensorsList(room,(sensors) => {
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
    if(deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed())
      deviceAssignationWindow.reload();
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
