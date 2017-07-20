const {app,BrowserWindow} = require('electron');
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

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
}
