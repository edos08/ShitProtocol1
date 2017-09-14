const {app,BrowserWindow,dialog} = require('electron');
var ipc = require('electron').ipcMain;

var registration = require('./serial/registration_process');
var handshake = require('./serial/Handshake_process');
var dbHelper =require('./windows/main/DBHelper');

let window;
let deviceAssignationWindow;
let sensorsAssignationWindow;

let registrationActive = false;
let currentDeviceForWhichTheRoomIsBeingChosen = -1;
let currentRoomInWhichTheSensorsAreHeld = -1;
let currentSensorTowhichTheDeviceIsBeingConnected = -1;
let currentDeviceWhichValueIsBeingChanged = -1;
let currentValueThatIsBeingChanged = -1;
let selectSensorAfterwardsTrigger = false;

let devicesList = [];
let deviceIndex  = 0;

let unreachableDevicesList = [];

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
  setTimeout(checkDevicesStatus, 1000 * 10);
}

app.on('window-all-closed', () => {
  app.quit()
});

app.on('quit',()=>{
    registration.terminate();
})

function onRegistrationEnd(registered,requested){
  var result = (registered == requested);
  console.log("Registration succesful: " + (result));
  
  
  registrationActive = false;
  
  if(result){
    displaySuccessDialog("Registrazione completata per " + registered + " dispositivi");
    
    deviceAssignationWindow = new BrowserWindow({parent: window, modal: true});
    //deviceAssignationWindow.openDevTools();
    deviceAssignationWindow.loadURL('file://' + __dirname + '/windows/deviceAssignation/device_assignation.html');

  } else {
    dialog.showErrorBox("Azione non completamente riuscita", 
                        "Sono stati registrati " + registered + " dispositivi su " + requested + ".\n"
                        + "I dispositivi non registrati non sono raggiungibili al momento.");
  }
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
  dbHelper.fillContentDivWithDevices(roomID,(roomName,devices) =>{
    event.sender.send('devices-loaded',roomName,devices,roomID)
  });
});

ipc.on('delete-room',(event,roomID) => {
  dbHelper.deleteRoom(roomID,() => {
    dbHelper.fillRoomsScreen((rooms) =>{
      event.sender.send('rooms-filled',rooms);
    });
  })
});

ipc.on('gather-device-info',(event,deviceID) => {
  gatherDeviceInfo(event,deviceID);
})

function gatherDeviceInfo(event,deviceID){
  dbHelper.getDeviceInfo(deviceID,(device) => {
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
      dbHelper.getDeviceInfo(currentDeviceWhichValueIsBeingChanged,(device) => {
        window.webContents.send('device-info-gathered',device);
      });
    });
  }else{
    dialog.showErrorBox("Azione non riuscita", "Il dispositivo non sembra essere raggiungibile");
  }
}

ipc.on('insert_new_room',function(event,roomName){
  dbHelper.insertRoomIntoDB(roomName,() => {
    dbHelper.fillRoomsScreen((rooms) =>{
      event.sender.send('rooms-filled',rooms);
    });
  },() => {
      dialog.showErrorBox("Valore inserito non valido", "Il nome non può essere ripetuto")
  });
})


ipc.on("register_devices_pressed",function(event){
  event.sender.send('dev-no-dialog');
});

ipc.on('registration-device-start',(event,devicesNumber) => {
  console.log("registration started");
  registration.start(onRegistrationEnd,devicesNumber);
  registrationActive = true;
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
  dbHelper.assignDeviceToRoom(currentDeviceForWhichTheRoomIsBeingChosen,roomID,() => {
    if(deviceAssignationWindow && !deviceAssignationWindow.isDestroyed()){
      if(selectSensorAfterwardsTrigger){
        selectSensorFunction(currentDeviceForWhichTheRoomIsBeingChosen,roomID);
      } else {
        dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn((devices) => {
          deviceAssignationWindow.webContents.send('devices-with-no-room-response',devices);
        }); 
      }
    } else {
      dbHelper.fillContentDivWithDevices(roomID,(roomName,devices) =>{
        window.webContents.send('devices-loaded',roomName,devices,roomID)
      });
    }
  });
  if(!selectSensorAfterwardsTrigger){
    currentDeviceForWhichTheRoomIsBeingChosen = -1;
  }

})

ipc.on('sensor_assignation_button_pressed',function(event,deviceID){
  dbHelper.checkIfHasRoomAssignedAndSelectSensor(deviceID,selectRoomFunction,selectSensorFunction);
})

ipc.on('sensor_assignation_ok_button_pressed',function(event,sensorID){

  currentSensorTowhichTheDeviceIsBeingConnected = sensorID;

  registration.setAction(onSensorSubmissionAction);
  dbHelper.getAddressesForControllerAndSensor(currentDeviceForWhichTheRoomIsBeingChosen,sensorID,(devAddress,sensAddress) => {
    registration.sendSensorSubmissionPacket(devAddress,sensAddress); //This will call onSensorSubmissionAction once it's done
  })

})

function onSensorSubmissionAction(result){
  if(result == 1){
    dbHelper.assignSensorToController(currentDeviceForWhichTheRoomIsBeingChosen,currentSensorTowhichTheDeviceIsBeingConnected,(controllerID) =>{
      if(sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed()){
        dbHelper.queryAllDevicesWithRoomAssignedButNoSensorAndShowIn((devices) => {
          sensorsAssignationWindow.webContents.send('devices-with-no-sensor-response',devices);
        }); 
      } else if (deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed()) {
        console.log("response received, trigger is  " + selectSensorAfterwardsTrigger);
        if(selectSensorAfterwardsTrigger){
          selectSensorAfterwardsTrigger = false;
          dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn((devices) => {
            deviceAssignationWindow.webContents.send('devices-with-no-room-response',devices);
          });
        }
      }else {
        dbHelper.getDeviceInfo(controllerID,(device) => {
          window.webContents.send('device-info-gathered',device);
        });
      }
    });
    displaySuccessDialog("Sensore aggiornato correttamente");
    
  }else{
    if (deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed()) {
      console.log("response received, trigger is  " + selectSensorAfterwardsTrigger);
      if(selectSensorAfterwardsTrigger){
        selectSensorAfterwardsTrigger = false;
        dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn((devices) => {
          deviceAssignationWindow.webContents.send('devices-with-no-room-response',devices);
        });
      }
    }
    dialog.showErrorBox("Azione non riuscita", "Il dispositivo non sembra essere raggiungibile");
  }

  currentDeviceForWhichTheRoomIsBeingChosen = -1;
  currentRoomInWhichTheSensorsAreHeld = -1;

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
    if(sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed()){
      dbHelper.queryAllDevicesWithRoomAssignedButNoSensorAndShowIn((devices) => {
        sensorsAssignationWindow.webContents.send('devices-with-no-sensor-response',devices);
      });
    } else if(deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed()){
      dbHelper.queryAllDevicesWithNoRoomAssignedAndShowIn((devices) => {
        deviceAssignationWindow.webContents.send('devices-with-no-room-response',devices);
      });
    } else{
      dbHelper.getDeviceInfo(deviceID,(device) => {
        window.webContents.send('device-info-gathered',device);
      });
    }
  },() => {
      dialog.showErrorBox("Valore inserito non valido", "Il nome non può essere ripetuto")
  });
})

function selectRoomFunction(deviceID,selectSensorAfterwards){
    currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
    selectSensorAfterwardsTrigger = selectSensorAfterwards;
    if(deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed()){
      deviceAssignationWindow.webContents.send('open_room_modal');
    } else {
      console.log("sending to window");
      window.webContents.send('open_room_modal');
    }
}

function selectSensorFunction(deviceID,roomID){

    currentDeviceForWhichTheRoomIsBeingChosen = deviceID;
    currentRoomInWhichTheSensorsAreHeld = roomID;
    if(deviceAssignationWindow != null && !deviceAssignationWindow.isDestroyed()){
      deviceAssignationWindow.webContents.send('open_sensor_modal');
    } else if (sensorsAssignationWindow != null && !sensorsAssignationWindow.isDestroyed()){
      sensorsAssignationWindow.webContents.send('open_sensor_modal');
    } else {
      window.webContents.send('open_sensor_modal');
    }
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
  unreachableDevicesList = [];
  devicesList = devices;
  deviceIndex = 0;
  if(deviceIndex < devicesList.length){
    pingDevice(devicesList[deviceIndex]);
  }
}

function pingCallback(value){
  if(value == 65535){
    unreachableDevicesList.push(devicesList[deviceIndex]);
  }
  deviceIndex++;
  if(deviceIndex < devicesList.length){
    pingDevice(devicesList[deviceIndex]);
  }else{
    console.log("Pinging ended");
    if(unreachableDevicesList.length > 0){
      var unreachableDevicesText = "";
      for(var a = 0; a < unreachableDevicesList.length; a++){
        var deviceName = (unreachableDevicesList[a].Description != null)?(unreachableDevicesList[a].Description).trim():"Dispositivo senza nome";
        unreachableDevicesText += deviceName + " (" + (unreachableDevicesList[a].T_Description).trim() + ")\n";
      }
      dialog.showErrorBox('Alcuni dispositivi non risultano raggiungigbili',unreachableDevicesText);
    }
    setTimeout(checkDevicesStatus, 1000 * 60 * 5);
  }
}

function pingDevice(device){
  console.log("Pinging device: 0x" + (device.Address >>> 0).toString(16));
  if(device.Type == 3)
    registration.sendCheckSensorStatePacket(device.Address);
  else if (device.Type == 2) {
    registration.sendCheckControllerStatePacket(device.Address);
  }
}
