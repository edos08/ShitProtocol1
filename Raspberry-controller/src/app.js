const {app,BrowserWindow} = require('electron');
var dialogs = require('dialogs');
var ipc = require('electron').ipcMain;

var registration = require('./registration_process');

registration.onEnd = onRegistrationEnd;



let mainWindow;
var registrationActive = false;

app.on('ready', function(){
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768
  });

  mainWindow.loadURL('file://' + __dirname + '/windows/main/main.html');
  mainWindow.openDevTools();

  mainWindow.on('closed',() =>{
    mainWindow = null;
  })
});

ipc.on("register_devices_pressed",function(){
  console.log("Congratualtions, you have pressed the register devices button");
  registration.start();
  registrationActive = true;
});

ipc.on("insert_room_button_pressed", function(){
  console.log("Button rooms pressed");
  dialogs.prompt('Nome della stanza','Stanza01',function(ok){
    console.log("Ok? " + ok);
  })
});

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
  registrationActive = false;
}
