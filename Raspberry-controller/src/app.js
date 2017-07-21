const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./registration_process');

var dbHelper =require('./windows/main/DBHelper');




let window;
let deviceAssignationWindow;
var registrationActive = false;

app.on('ready', function(){
  window = new BrowserWindow({
    width: 1024,
    height: 768
  });

  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  window.openDevTools();

  window.on('closed',() =>{
    window = null;
  })
});

ipc.on("register_devices_pressed",function(){
  console.log("Congratualtions, you have pressed the register devices button");
  registration.start(onRegistrationEnd);
  registrationActive = true;
});

ipc.on("insert_room_button_pressed", function(){
  console.log("Button rooms pressed");
});

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
  registrationActive = false;
  deviceAssignationWindow = new BrowserWindow({parent: window, modal: true});
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');
}
