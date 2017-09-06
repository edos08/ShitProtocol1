var SerialPort = require('serialport');

/** Valore dell'header di un pacchetto che contiene il numero di dispositivi da registrare. 
 * @constant { int } */
const DEVICES_NUMBER_PACKET = 0;

/** Valore dell'header di un pacchetto che contiene un indirizzo da controllare. 
 * @constant { int } */
const ID_CHECK_PACKET = 1;

/** Valore del body di un pacchetto che conferma l'indirizzo di un dispositivo. 
 * @constant { int } */
const ID_CONFIRMED_PACKET = 2;

/** Valore del body di un pacchetto che inizia uno stream di invio di indirizzi dei dispositivi. 
 * @constant { int } */
const ID_CONFIRMATION_PROCESS_START = 0;

/** body di un pacchetto che finisce uno stream di invio di indirizzi dei dispositivi. 
 * @constant { int } */
const ID_CONFIRMATION_PROCESS_END = 255;

/** Contenuto del pacchetto di risposta all'handshake. 
 * @constant { int } */
const HANDSHAKE_RESPONSE = 'W';

/** Contenuto del pacchetto di fine handshake. 
 * @constant { int } */
const HANDSHAKE_END = 'A';

/** Contenuto del pacchetto di handshake. 
 * @constant { int } */
const HANDSHAKE_MESSAGE = 'H';

/** Contenuto del pacchetto per resettare l'handshake. 
 * @constant { int } */
const HANDSHAKE_RESET = 'R';

/** Valore dell'header di un pacchetto che contiene il comando di iniziare la registrazione. 
 * @constant { int } */
const MESSAGE_TYPE_ENTER_REGISTRATION_MODE = 3;

/** Valore dell'header di un pacchetto che contiene un nuovo sensore per un controllore. 
 * @constant { int } */
const SENSOR_SUBMISSION_PACKET = 4;

/** Valore dell'header di un pacchetto che contiene il nuovo valore di luminosità per un controllore. 
 * @constant { int } */
const LIGHT_VALUE_CHANGED_PACKET = 5;

/** Valore dell'header di un pacchetto che contiene il risultato dell'esecuzione di un comando. 
 * @constant { int } */
const SEND_RESULT_PACKET = 6;

/** Valore dell'header di un pacchetto che contiene il comando di valutare lo stato di un sensore. 
 * @constant { int } */
const CHECK_SENSOR_STATE_PACKET = 7;

/** Valore dell'header di un pacchetto che contiene il comando di valutare lo stato di un controller. 
 * @constant { int } */
const CHECK_CONTROLLER_STATE_PACKET = 8;

/** Maschere per estrapolare 1 byte da una variabile di 4 bytes. 
 * @constant { int[] } */
const masks = [
  0xFF000000,
  0x00FF0000,
  0x0000FF00,
  0x000000FF
]

/** Oggetto che rappresenta la porta a cui il nodo è connesso.
 * @type { SerialPort }
 */
let port;

/** Oggetto che rappresenta il numero della porta a cui si cerca di connettersi
 * @type { int }
*/
var portNumber = 0;

/** Variabile che indica se si è in fase di registrazione o meno
 * @type { bool }
 */
var registrationMode = false;

/** Handler per i messaggi di handshake
 * @type { Object }
 */
var handshakeHandler;

/** Handler per i messaggi di fine handshake
 * @type { Object }
 */
var handshakeEndHandler;

/** Handler per i messaggi di controllo dell'indirizzo
 * @type { Object }
 */
var idCheckRequestHandler;

/** Handler per i messaggi di inizio stream di indirizzi
 * @type { Object }
 */
var idStreamStartHandler;

/** Handler per i messaggi dello stram di indirizzi
 * @type { Object }
 */
var idStreamValueHandler;

/** Handler per i messaggi di fine stream di indirizzi
 * @type { Object }
 */
var idStreamEndHandler;

/** Handler per i messaggi di inizio registrazione
 * @type { Object }
 */
var registrationModeEnteredHandler;

/** Handler per i messaggi di risultato di un comando
 * @type { Object }
 */
var sendResultHandler;

/** Handler per i messaggi di controllo dello stato di un sensore
 * @type { Object }
 */
var checkSensorStateHandler;

/** Handler per i messaggi di controllo dello stato di un controller
 * @type { Object }
 */
var checkControllerStateHandler;

/** Funzione da richiamare una volta che si è aperta una connessione seriale */
var onOpenFunction;

/** Inizializza la connessione seriale
 * @param { Object } handlers gli handler da passare
 * @param { function } onOpenCallback la funzione da richiamare all'apertura della porta seriale
 */
function init(handlers,onOpenCallback){
  connectHandlers(handlers);
  onOpenFunction = onOpenCallback;

  if(port != null && port.isOpen)
      return;

  openPort();
}

/** Connette gli handler passati a quelli globali
 *  @param { Object } handlers gli handler
 */
function connectHandlers(handlers){
  handshakeHandler = handlers.handshakeHandler;
  idCheckRequestHandler = handlers.idCheckRequestHandler;
  idStreamStartHandler = handlers.idStreamStartHandler;
  idStreamValueHandler = handlers.idStreamValueHandler;
  idStreamEndHandler = handlers.idStreamEndHandler;
  handshakeEndHandler = handlers.handshakeEndHandler;
  registrationModeEnteredHandler = handlers.registrationModeEnteredHandler;
  sendResultHandler = handlers.sendResultHandler;
  checkSensorStateHandler = handlers.checkSensorStateHandler;
  checkControllerStateHandler = handlers.checkControllerStateHandler;
}

/** Prova ad aprire una connessione sulle prime 20 porte seriali. Se non riesce il programma si blocca. */
function openPort(){
    var portPath = '/dev/ttyACM' + portNumber;

    //console.log("Testing " + portPath);

    port = new SerialPort(portPath,{
      baudRate: 9600,
      autoOpen: false
    });
    portNumber++;
    port.open(onPortOpened);
}

/** Funzione richiamata una volta che si è aperta una porta. Imposta le chiamate agli eventi
 * @param { error } err l'eventale errore trovato
 */
function onPortOpened(err){
  if(err != null){
      console.log("Serial port error: ",err.message);
      port = null;
      if(portNumber < 20)
        openPort();
      return;
  }

  console.log("Port " + this.path + " opened succesfully");
  port.on('data',(data) =>{
    console.log('Received: \"' + data + "\"");
    console.log('lenght = ' + Buffer.byteLength(data));
    callPacketHandler(data);
  });

  port.on('error',(error) =>{
    Console.log('Errore di connessione seriale ' + error);
  });

  port.on('close',(error) =>{
    port = null;
  });

  if(onOpenFunction)
    onOpenFunction();
}

/** Funzione richiamata ad ogni ricezione di un pacchetto.
 * @param { Buffer } data i dati ricevuti in seriale
 * @return il valorerestituito dalle funzioni chiamate (se restituiscono qualcosa)
 */
function callPacketHandler(data){
  if(isHandshakePacket(data) && handshakeHandler){
    return handshakeHandler();
  }
  if(isHandshakeEndPacket(data) && handshakeEndHandler){
    return handshakeEndHandler();
  }
  if(isIDCheckRequest(data) && idCheckRequestHandler){
    var _id = read32bitInt(data,1);
    return idCheckRequestHandler(_id);
  }
  if (isIDStreamStartPacket(data) && idStreamStartHandler) {
    return idStreamStartHandler();
  }
  if (isIDStreamEndPacket(data) && idStreamEndHandler) {
    return idStreamEndHandler();
  }
  if (isIDStreamValuePacket(data) && idStreamValueHandler) {
    var _id = read32bitInt(data,1);
    var _type = data[5];
    return idStreamValueHandler(_id,_type);
  }
  if(isRegistrationModeEnteredPacket(data) && registrationModeEnteredHandler){
    return registrationModeEnteredHandler();
  }
  if(isSendResultPacket(data) && sendResultHandler){
    return sendResultHandler(data[1]);
  }
  if(isCheckSensorStatePacket(data) && checkSensorStateHandler){
    var address = read32bitInt(data,1);
    var value = data[5] << 8;
    value |= data[6];
    return checkSensorStateHandler(address,value);
  }
  if(isCheckControllerStatePacket(data) && checkControllerStateHandler){
    var address = read32bitInt(data,1);
    var value = data[5] << 8;
    value |= data[6];
    return checkControllerStateHandler(address,value);
  }
  console.log("Unrecognized serial");

}

/** Legge 32 bit da un buffer a partire da un indice dato
 * @param { Buffer } data il buffer da cui leggere i valori
 * @param { int } startIndex l'indice da cui inizialre la lettura
 * @return { int32 } i 4 byte letti in un'unica variabile
 */
function read32bitInt(data,startIndex){
  var _id = 0;
  var shifter = 24;
  for(var a = startIndex; a < startIndex+4; a++){
    _id |= (data[a] << shifter);
    shifter -= 8;
  }
  return _id;
}

/** Scrive 4 bytes in un buffer all'indice dato
 * @param { int[] } buffer il buffer su cui scrivere i byte
 * @param { int } offset la posizione da cui iniziare a scrivere sul buffer
 * @param { int32 } address i 4 bytes da scrivere sul buffer
 */
function write32BitInt(buffer,offset,address){
  for(var a = 0; a < 4; a++){
    buffer[offset + a] = ((address & masks[a]) >> (8 * (3-a)));
  }
}

/** Controlla se un pacchetto ricevuto è di handhsake
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isHandshakePacket(data){
  return data == HANDSHAKE_MESSAGE;
}

/** Controlla se un pacchetto ricevuto è risultato di un comando
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isSendResultPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == SEND_RESULT_PACKET;
}

/** Controlla se un pacchetto ricevuto è di inizio stream di indirizzi
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isIDStreamStartPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_START;
}

/** Controlla se un pacchetto ricevuto è di fine stream di indirizzi
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isIDStreamEndPacket(data){
  return Buffer.byteLength(data) == 2 && data[0] == ID_CONFIRMED_PACKET && data[1] == ID_CONFIRMATION_PROCESS_END;
}

/** Controlla se un pacchetto ricevuto è di indirizzo nello stream
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isIDStreamValuePacket(data){
  return Buffer.byteLength(data) == 6 && data[0] == ID_CONFIRMED_PACKET;
}

/** Controlla se un pacchetto ricevuto è di controllo di un indirizzo
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isIDCheckRequest(data){
  return Buffer.byteLength(data) == 5 && data[0] == ID_CHECK_PACKET;
}

/** Controlla se un pacchetto ricevuto è di fine handshake
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isHandshakeEndPacket(data){
  return data == HANDSHAKE_END;
}

/** Controlla se un pacchetto ricevuto è di inizio registrazione
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isRegistrationModeEnteredPacket(data){
  return data[0] == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
}

/** Controlla se un pacchetto ricevuto è di controllo dello stato di un sensore
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isCheckSensorStatePacket(data){
  return data[0] == CHECK_SENSOR_STATE_PACKET && Buffer.byteLength(data) == 7;
}

/** Controlla se un pacchetto ricevuto è di controllo dello stato di un controller
 * @param { Buffer } data il pacchetto ricevuto
 * @return { bool } true se lo è, false altrimenti
 */
function isCheckControllerStatePacket(data){
  return data[0] == CHECK_CONTROLLER_STATE_PACKET && Buffer.byteLength(data) == 7;
}

/** Risponde alla richiesta di controllo di un indirizzo con la risposta contenente l'informazione sulla sua duplicazione
 * @param { int } result il risultato del controllo
 * @return { Buffer } il buffer inviato in seriale
 */
function answerToIDCheckRequest(result){
  var buf = Buffer.alloc(2);
  buf[0] = ID_CHECK_PACKET;
  buf[1] = result;
  port.write(buf);
  return buf;
}

/** Invia il numero di dispositivi da registrare
 * @param { int } devicesNumber il numero di dispositivi da controllare
 * @return { Buffer } il buffer inviato in seriale
 */
function sendDevicesNumberPacket(devicesNumber){
  var buf = Buffer.alloc(2);
  buf[0] = DEVICES_NUMBER_PACKET;
  buf[1] = devicesNumber;
  port.write(buf);
  return buf;
}

/** Risponde ad un messaggio di handshake
* @return { Buffer } il buffer inviato in seriale
*/
function answerToHandshake(){
  var buf = Buffer.alloc(1,HANDSHAKE_RESPONSE);
  port.write(buf);
  return buf;
}

/** Invia il comando di entrare in modalità registrazione
 * @return { Buffer } il buffer inviato in seriale
 */
function sendEntrerRegistrationModeMessage(){
  var buf = Buffer.alloc(1,MESSAGE_TYPE_ENTER_REGISTRATION_MODE);
  port.write(buf);
  return buf;
}

/** Se si è connessi ad una porta chiama sendEnterRegistrationModeMessage()
 */
function startRegistration(){
  if(port != null && port.isOpen){
    sendEntrerRegistrationModeMessage();
  }
}

/** Invia il pacchetto con il nuovo sensore per un controllore
 * @param { int32 } controllerID il controller destinantario
 * @param { int32 } sensorID il sensore da scoltare
 * @return { Buffer } il buffer inviato in seriale
 */
function sendSensorSubmissionPacket(controllerID,sensorID){
  var buf = Buffer.alloc(9);
  buf[0] = SENSOR_SUBMISSION_PACKET;
  write32BitInt(buf,1,controllerID);
  write32BitInt(buf,5,sensorID);
  port.write(buf);
  return buf;
}

/**
 * Chiude la connessione alla porta seriale
 */
function terminate(){
  if(port != null){
    port.close();
  }
}

/**
 * Invia il messaggio di reset della connessione
 * @return { Buffer } il buffer inviato in seriale
 */
function sendResetMessage(){
  var buf = Buffer.alloc(1,HANDSHAKE_RESET);
  port.write(buf);
  return buf;
}

/** Invia il pacchetto con il nuovo valore di luminosità per un controllore
 * @param { int32 } controllerAddress il controller destinantario
 * @param { int16 } newValue il nuovo valore di luminosità
 * @return { Buffer } il buffer inviato in seriale
 */
function sendLightValueChangedPacket(controllerAddress,newValue){
  var buf = Buffer.alloc(7);
  buf[0] = LIGHT_VALUE_CHANGED_PACKET;
  write32BitInt(buf,1,controllerAddress);
  buf[5] = ((newValue & 0xFF00) >> 8);
  buf[6] = ((newValue & 0x00FF) >> 0);
  port.write(buf);
  return buf;
}

/**
 * Invia il comando di controllare lo stato di un sensore
 * @param { int32 } sensorAddress il sensore da controllare
 * @return { Buffer } il buffer inviato in seriale 
 */
function sendCheckSensorStatePacket(sensorAddress){
  var buf = Buffer.alloc(5);
  buf[0] = CHECK_SENSOR_STATE_PACKET;
  write32BitInt(buf,1,sensorAddress);
  port.write(buf);
  return buf;
}

/**
 * Invia il comando di controllare lo stato di un controllore
 * @param { int32 } controllerAddress il controllore da controllare 
 * @return { Buffer } il buffer inviato in seriale 
 */
function sendCheckControllerStatePacket(controllerAddress){
  var buf = Buffer.alloc(5);
  buf[0] = CHECK_CONTROLLER_STATE_PACKET;
  write32BitInt(buf,1,controllerAddress);
  port.write(buf);
  return buf;
}

module.exports = {
  init,
  answerToHandshake,
  sendDevicesNumberPacket,
  answerToIDCheckRequest,
  terminate,
  startRegistration,
  sendSensorSubmissionPacket,
  sendResetMessage,
  sendLightValueChangedPacket,
  sendCheckSensorStatePacket,
  sendCheckControllerStatePacket,
  //for testing purposes
  write32BitInt,
  callPacketHandler
}
