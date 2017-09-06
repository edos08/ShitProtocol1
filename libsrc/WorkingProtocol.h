/** 
* Protocollo WorkingProtocol. Descrive il protocollo utlizzato dai dispositivi nella loro esecuzione a regime
* @file WorkingProtocol.h
*/

#ifndef WORKING_PROTOCOL_H
#define WORKING_PROTOCOL_H

#include "RegistrationProtocol.h"

/**
* Crea un pacchetto per l'invio dei dati letti dal sensore
* @param sender il sensore che invia il pacchetto
* @param sensorValue il valore letto
* @return il pacchetto creato
*/
static Packet SensorValuePacket(uint32_t sender,uint16_t sensorValue){
  char body[2];
  body[0] = ((sensorValue & 0xFF00) >> 8);
  body[1] = ((sensorValue & 0x00FF) >> 0);
  return Packet(0x0,sender,PACKET_TYPE_NORM | PACKET_TYPE_SENSOR_VALUE,packetCounter,body,2);
}

/**
* Determina se un pacchetto lora è un pacchetto di dati di un sensore
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se lo è,`false` altrimenti
*/
static bool isSensorValuePacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_SENSOR_VALUE && packetLength == 2;
}


/**
* Crea un pacchetto per l'invio della variazione delle impostazioni di luminosità per una lampada
* @param dest la lampada a cui è destinato il pacchetto
* @param sender chi invia il pacchetto (nodo)
* @param lightValue il nuovo valore di luminosità 
* @return il pacchetto creato 
*/
static Packet LightValueChangedPacket(uint32_t dest, uint32_t sender, char* lightValue){
    char body[2];
    body[0] = lightValue[0];
    body[1] = lightValue[1];
    return Packet(dest,sender,PACKET_TYPE_NORM | PACKET_TYPE_LIGHT_VALUE_CHANGED | PACKET_TYPE_REQUESTS_ACK,packetCounter,body,2);
}

/**
* Determina se un pacchetto lora è un pacchetto cambio del valore di luminosità
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se lo è,`false` altrimenti
*/
static bool isLightValueChangedPacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_LIGHT_VALUE_CHANGED && packetLength == 2;
}

/**
* Determina se un pacchetto lora è un pacchetto richiesta di ping
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se lo è,`false` altrimenti
*/
static bool isPingRequestPacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_PING && packetLength == 0;
}

/**
* Determina se un pacchetto lora è un pacchetto di risposta ad un ping
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se lo è,`false` altrimenti
*/
static bool isPingResponsePacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_PING && packetLength == 2;
}

/**
* Crea un pacchetto per l'invio di un ping ad una lampada
* @param dest il destinatario del pacchetto (lampada)
* @param chi invia il pacchetto (nodo)
* @param value lightValue il valore di luminosità corrente 
* @return il pacchetto creato 
*/
static Packet PingRequestPacket(uint32_t dest, uint32_t sender){
  return Packet(dest,sender,PACKET_TYPE_NORM | PACKET_TYPE_PING,packetCounter,"",0);
}

/**
* Crea un pacchetto per l'invio della risposta ad un ping da parte di una lampada
* @param dest il destinatario del pacchetto (nodo)
* @param la lampada che invia il pacchetto
* @param value lightValue il valore di luminosità corrente 
* @return il pacchetto creato 
*/
static Packet PingResponsePacket(uint32_t dest, uint32_t sender,uint16_t value){
  char body[2];
  body[0] = (value & 0xFF00) >> 8;
  body[1] = (value & 0x00FF) >> 0;
  return Packet(dest,sender,PACKET_TYPE_NORM | PACKET_TYPE_PING,packetCounter,body,2);
}

#endif
