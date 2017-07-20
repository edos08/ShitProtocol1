var knex = require('knex')({
  client: 'pg',
  version: '9.4',
  connection: {
    host : '127.0.0.1',
    user : 'pi',
    password : 'raspberry',
    database : 'LoRaServices'
  }
});

function checkFirstStartupOfSystem(action){
  knex.select().table('Devices').then(function(devices){
    console.log("devices: " + devices);
    if(devices.length == 0)
        action();
  });
}

module.exports = {
  checkFirstStartupOfSystem: checkFirstStartupOfSystem
}
