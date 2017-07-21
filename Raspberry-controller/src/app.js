const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var smalltalk = require('smalltalk');

var registration = require('./registration_process');

var dbHelper =require('./windows/main/DBHelper');

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
  smalltalk.prompt("Nuova stanza","Inserisci il nome della nuova pagina").then(function(name){
    console.log("Nome inserito " + name);
    dbHelper.insertRoomIntoDB(name);
  });
});

function onRegistrationEnd(result){
  console.log("Registration succesful: " + result);
  registrationActive = false;
}
