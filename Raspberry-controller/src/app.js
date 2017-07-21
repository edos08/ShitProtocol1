const {app,BrowserWindow} = require('electron');
var ipc = require('electron').ipcMain;

var smalltalk = require('smalltalk');

var registration = require('./registration_process');

var dbHelper =require('./windows/main/DBHelper');

registration.onEnd = onRegistrationEnd;



let window;
let deviceAssignationWindow;
var registrationActive = false;

app.on('ready', function(){
  window = new BrowserWindow({
    width: 1024,
    height: 768
  });

  deviceAssignationWindow = new BrowserWindow({parent: window, modal: true, show:false});
  deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html')
  window.loadURL('file://' + __dirname + '/windows/main/main.html');
  window.openDevTools();

  window.on('closed',() =>{
    window = null;
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
  deviceAssignationWindow.show();
}
