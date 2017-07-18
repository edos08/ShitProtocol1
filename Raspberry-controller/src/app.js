const {app,BrowserWindow} = require('electron');

let mainWindow

app.on('ready', function(){
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768
  });

  mainWindow.loadURL('file://' + __dirname + '/windows/main/main.html');
  mainWindow.openDevTools();
})
