const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./registration_process');

var dbHelper =require('./windows/main/DBHelper');

let window;
let deviceAssignationWindow;
let chooseRoomWindow;

var registrationActive = false;
var currentDeviceForWhichTheRoomIsBeingChosen = -1;

app.on('ready', function(){
  window = new BrowserWindow({
    width: 1024,
    height: 768
  });

  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  window.openDevTools();

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
  deviceAssignationWindow.openDevTools();
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
  deviceAssignationWindow.openDevTools();
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');
});

ipc.on('room_assignation_button_pressed',function(event,deviceID){

  chooseRoomWindow = new BrowserWindow({
    parent: deviceAssignationWindow,
    modal: true,
    width:600,
    height: 200
  })

  var chooseRoomWindowURL = 'file://' + __dirname + '/windows/deviceAssignation/choose_room_dialog.html';
  chooseRoomWindow.loadURL(chooseRoomWindowURL);
  currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
})

ipc.on('room_assignation_ok_button_pressed'function(event,roomID)){
  dbHelper.assignDeviceToRoom(currentDeviceForWhichTheRoomIsBeingChosen,roomID);
}
