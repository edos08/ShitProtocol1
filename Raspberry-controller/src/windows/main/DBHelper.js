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

function isFirstStartupOfSystem(){
  var result;
  knex.select().table('Devices').then(function(devices){
    result = devices;
  });
  console.log("Select result: " + result);
  return result.length;
}

module.exports = {
  isFirstStartupOfSystem
}
