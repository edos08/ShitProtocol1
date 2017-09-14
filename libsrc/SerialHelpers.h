/** 
* Protocollo SerialProtocol. Descrive il protocollo utlizzato per la trasmissione seriale tra nodo e raspberry
* @file SerialHelpers.h
*/

#ifndef SERIAL_HELPERS_H
#define SERIAL_HELPERS_H

#define HANDSHAKE_MESSAGE 'H'                             /**< Valore del payload di un pacchetto di handshake*/
#define HANDSHAKE_VALID_RESPONSE 'W'                      /**< Valore del payload di un pacchetto di risposta all'hndshake*/
#define HANDSHAKE_END_MESSAGE 'A'                         /**< Valore del payload di un pacchetto fine handshake*/
#define HANDSHAKE_RESET 'R'                               /**< Valore del payload di un pacchetto di reset dell'handshake*/

#define MESSAGE_TYPE_DEVICES_COUNT 0                      /**< Valore dell'header di un pacchetto contenente il numero di dispositivi da registrare.*/
#define MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE 1          /**< Valore dell'header di un pacchetto contenente la richiesta o risposta di registrazine di un dispositivo.*/
#define MESSAGE_TYPE_DEVICES_SUBMISSION 2                 /**< Valore dell'header di un pacchetto contenente segnali relativi ad uno stream di dispositivi.*/
#define MESSAGE_TYPE_ENTER_REGISTRATION_MODE 3            /**< Valore dell'header di un pacchetto contenente il comando di iniziare la fase di registrazione.*/
#define MESSAGE_TYPE_SENSOR_SUBMISSION 4                  /**< Valore dell'header di un pacchetto contenente il comando di iscrivere una lampada ad un sensore.*/
#define MESSAGE_TYPE_LIGHT_VALUE_CHANGED 5                /**< Valore dell'header di un pacchetto contenente il comando di cambiare la luminosità.*/
#define MESSAGE_TYPE_SEND_RESULT 6                        /**< Valore dell'header di un pacchetto contenente la risposta ad un comado dato ad un dispositivo.*/
#define MESSAGE_TYPE_CHECK_SENSOR_STATUS 7                /**< Valore dell'header di un pacchetto contenente il comando di ping a sensore.*/   
#define MESSAGE_TYPE_CHECK_CONTROLLER_STATUS 8            /**< Valore dell'header di un pacchetto contenente il comando di ping a lampada.*/   

#define MESSAGE_ID_VALID 0                                /**< Valore del body di un pacchetto contenente il segnale di ID valido.*/
#define MESSAGE_ID_INVALID 1                              /**< Valore del body di un pacchetto contenente il segnale di ID duplicato.*/

#define MESSAGE_DEVICES_STREAM_START 0                    /**< Valore del payload di un pacchetto contenente il segnale di inizio stream di disposaitivi.*/
#define MESSAGE_DEVICES_STREAM_END 255                    /**< Valore del payload di un pacchetto contenente il segnale di fine stream di disposaitivi.*/

uint8_t devices_to_register = -1;                         /**< Numero di dispositivi da registrare.*/
uint32_t* devices_ids;                                    /**< id dei dispositivi (indirizzi LoRa).*/
uint8_t* devices_types;                                   /**< tipi dei dispositivi.*/
int devices_ids_index = 0;                                /**< indice per `devices_ids` e `devices_types`.*/

bool isWaitingForDeviceIDCheck = false;                   /**< flag che segna se sta aspettando il controllo dell'id di un dispositivo*/
uint32_t idToCheck = 0;                                   /**< l'id da controllare*/
uint8_t typeOfIdToCheck = -1;                             /**< tipo del dispositivo per cui controllare l'ID*/

bool alertDoubledDevicesTrigger = false;                  /**< trigger per l'evento: segnala ID duplicato*/
uint32_t doubled_ID;                                      /**< L'ID duplicato (se trovato)*/
bool notifyDevicesIDsAcceptedTrigger = false;             /**< trigger per l'evento: notifica i dispositivi che i loro ID sono corretti*/

uint8_t identified_devices = 0;                           /**< numero di dispositivi che hanno risposto all'evento: notifica i dispositivi che i loro ID sono corretti*/

bool handshakeCompleted = false;                          /**< flag per indicare se l'hadshake è stato terminato*/    
bool hasReceivedNumberOfDevicesToRegister = false;        /**< flag che indica se il raspberry ha indicato quanti dispositivi vuole registrare*/
bool stream_started = false;                              /**< flag che indica se lo stram dei dispositivi è iniziato*/
bool stream_ended = false;                                /**< flag che indica se lo stram dei dispositivi è finito*/

/**
* Funzioni per la gestione della scrittura di byte
*/
typedef struct SerialHelpers{

  /**
  * Scrive 4 bytes in un array
  * I byte sono considerati con MSB a sinistra.
  * @param buffer il buffer (di dimensione minima 4) che conterrà i 4 bytes
  * @param valueToWrite i 4 bytes da scrivere nel buffer
  */
  static void write32bitIntegerIntoBuffer(char* buffer,uint32_t valueToWrite){
    buffer[1] = (char)((valueToWrite & 0xFF000000) >> 24);
		buffer[2] = (char)((valueToWrite & 0x00FF0000) >> 16);
		buffer[3] = (char)((valueToWrite & 0x0000FF00) >> 8);
		buffer[4] = (char)(valueToWrite & 0x000000FF);
  }
};

/**
  * Scrive il messaggio di hanshake `HANDSHAKE_MESSAGE` in seriale
  */
static void sendHandshakeMessage(){
  Serial.write(HANDSHAKE_MESSAGE);
  Serial.flush();
  delay(1);
}

/**
  * Scrive il messaggio di inizio registrazione `MESSAGE_TYPE_ENTER_REGISTRATION_MODE` in seriale
  */
static void sendRegistrationModeStartedMessage(){
  Serial.write(MESSAGE_TYPE_ENTER_REGISTRATION_MODE);
  Serial.flush();
  delay(1);
}

/**
  * Inizializza le veriabili per la registrazione
  */
void enterRegistrationMode(){
  if(devices_ids != NULL)
      delete[] devices_ids;
  if(devices_types != NULL)
    delete[] devices_types;
  hasReceivedNumberOfDevicesToRegister = false;
  devices_to_register = -1;
  devices_ids_index = 0;
  isWaitingForDeviceIDCheck = false;
  idToCheck = 0;
  typeOfIdToCheck = -1;
  alertDoubledDevicesTrigger = false;
  notifyDevicesIDsAcceptedTrigger = false;
  identified_devices = 0;
  stream_started = false;
  stream_ended = false;
  sendRegistrationModeStartedMessage();
}

/**
* Determina se un messaggio è un messaggio di reset
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo reset, `false` altrimenti
*/
static bool isResetMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_RESET;
}

/**
* Determina se un messaggio è un messaggio di inizio registrazione
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo inizio registrazione, `false` altrimenti
*/
static bool isEnterRegistrationModeMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 1 && dataBuffer[0] == MESSAGE_TYPE_ENTER_REGISTRATION_MODE;
}

/**
* Determina se un messaggio è un messaggio di risposta all'handshake
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo risposta all'handshake, `false` altrimenti
*/
static bool isHandshakeResponseMessage(char dataBuffer[], int buffer_size){
 return buffer_size == 1 && dataBuffer[0] == HANDSHAKE_VALID_RESPONSE;
}

/**
* Determina se un messaggio è un messaggio di numero dispositivi
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo numero dispositivi, `false` altrimenti
*/
static bool isDevicesCountMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 2 && dataBuffer[0] == MESSAGE_TYPE_DEVICES_COUNT;
}

/**
* Determina se un messaggio è un messaggio di risposta a controllo ID
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo risposta a controllo ID, `false` altrimenti
*/
static bool isIDCheckResponse(char dataBuffer[], int buffer_size){
  return buffer_size == 2 &&  dataBuffer[0] == MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
}

/**
* Determina se un messaggio è un messaggio di iscrizione di una lamapada a sensore
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo iscrizione di una lamapada a sensore, `false` altrimenti
*/
static bool isSensorSubmissionMessage(char dataBuffer[],int buffer_size){
  return buffer_size == 9 && dataBuffer[0] == MESSAGE_TYPE_SENSOR_SUBMISSION;
}

/**
* Determina se un messaggio è un messaggio di variazione luminosità
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo variazione luminosità, `false` altrimenti
*/
static bool isLightValueChangedMessage(char dataBuffer[], int buffer_size){
  return buffer_size == 7 && dataBuffer[0] == MESSAGE_TYPE_LIGHT_VALUE_CHANGED;
}

/**
* Determina se un messaggio è un messaggio di ping a sensore
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo ping a sensore, `false` altrimenti
*/
static bool isCheckSensorStatePacket(char dataBuffer[], int buffer_size){
  return buffer_size == 5 && dataBuffer[0] == MESSAGE_TYPE_CHECK_SENSOR_STATUS;
}

/**
* Determina se un messaggio è un messaggio di ping a lampada
* @param dataBuffer il messaggio ricevuto
* @param buffer_size la dimensione del messaggio
* @return `true` se il messaggio è di tipo ping a lampada, `false` altrimenti
*/
static bool isCheckControllerStatePacket(char dataBuffer[], int buffer_size){
  return buffer_size == 5 && dataBuffer[0] == MESSAGE_TYPE_CHECK_CONTROLLER_STATUS;
}

/**
* Invia in seriale il risultato di un ping a sensore
* @param address l'indirizzo del sensore pingato
* @param value il valore di ritorno del ping
*/
static void sendSensorStatePacket(uint32_t address, uint16_t value){
  char buffer[7];
  buffer[0] = MESSAGE_TYPE_CHECK_SENSOR_STATUS;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,address);
  buffer[5] = ((value & 0xFF00) >> 8);
  buffer[6] = ((value & 0x00FF) >> 0);
  Serial.write(buffer,7);
  Serial.flush();
  delay(1);
}

/**
* Invia in seriale il risultato di un ping a lampada
* @param address l'indirizzo della lampada pingata
* @param value il valore di ritorno del ping
*/
static void sendControllerStatePacket(uint32_t address, uint16_t value){
  char buffer[7];
  buffer[0] = MESSAGE_TYPE_CHECK_CONTROLLER_STATUS;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,address);
  buffer[5] = ((value & 0xFF00) >> 8);
  buffer[6] = ((value & 0x00FF) >> 0);
  Serial.write(buffer,7);
  Serial.flush();
  delay(1);
}

/**
* Invia in seriale la richiesta di controllo di un ID
* @param ID l'id da controllare
*/
static void sendIDCheckMessage(uint32_t ID){
  char buffer[5];
  buffer[0] = MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,ID);
  Serial.write(buffer,5);
  Serial.flush();
  delay(1);
}

/**
* Invia un messaggio di handshake in seriale
*/
static void sendHandShakeEndMessage(){
  Serial.write(HANDSHAKE_END_MESSAGE);
  Serial.flush();
  delay(1);
}

/**
* Invia un messaggio di inizio stream di dispositivi in seriale
*/
static void sendDevicesStreamStartMessage(){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  buffer[1] = MESSAGE_DEVICES_STREAM_START;
  Serial.write(buffer,2);
  Serial.flush();
  delay(1);
}

/**
* Invia un messaggio di fine stream di dispositivi in seriale
*/
static void sendDevicesStreamEndMessage(){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  buffer[1] = MESSAGE_DEVICES_STREAM_END;
  Serial.write(buffer,2);
  Serial.flush();
  delay(1);
}

/**
* Invia un messaggio contenente i dati di un dispositivo all'interno di uno stream in seriale
* @param ID l'ID del dispositivo
* @param type il tipo del dispositivo 
*/
static void sendDeviceInfoPacket(uint32_t ID, uint8_t type){
  char buffer[6];
  buffer[0] = MESSAGE_TYPE_DEVICES_SUBMISSION;
  SerialHelpers::write32bitIntegerIntoBuffer(buffer,ID);
  buffer[5] = type;
  Serial.write(buffer,6);
  Serial.flush();
  delay(1);
}

/**
* Invia il risulatato di un comando dato ad un dispositivo in seriale
* @param result il risultato del comando
*/
static void sendResultMessage(int result){
  char buffer[2];
  buffer[0] = MESSAGE_TYPE_SEND_RESULT;
  buffer[1] = result;
  Serial.write(buffer,2);
  Serial.flush();
  delay(1);
}

#endif
