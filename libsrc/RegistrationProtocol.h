/**
* Protocollo per la registrazione
* @file RegistrationProtocol.h 
*/

#pragma once

#include "LoRaProtocol.h"


#define REGISTRATION_RESPONSE_ID_DENIED 0                  /**< Valore del payload di un pacchetto il cui ID è stato rifiutato*/
#define REGISTRATION_RESPONSE_ID_ACCEPTED 1                /**< Valore del payload di un pacchetto il cui ID è stato accettato*/
#define REGISTRATION_RESPONSE_REGISTRATION_DENIED 2        /**< Valore del payload di un pacchetto a cui è stata rifuitata la registrazione (non utilizzato)*/
#define REGISTRATION_RESPONSE_REGISTRATION_RESUMED 3       /**< Valore del payload di un pacchetto per cui è stata ripresa la registrazione (non utilizzato)*/

#define DEVICE_TYPE_NODE 1                                 /**< Valore del tipo di dispositivo: nodo centrale*/
#define DEVICE_TYPE_CONTROLLER 2                           /**< Valore del tipo di dispositivo: lampada*/
#define DEVICE_TYPE_SENSOR 3                               /**< Valore del tipo di dispositivo: sensore*/

/**
* Crea un pacchetto di registrazione di un dispositivo.
* @param dest destinatario (nodo centrale)
* @param sender mittente
* @param type tipo del dispositivo
* @return il pacchetto creato (non richiede ACK).  
*/
static Packet RegistrationPacket(uint32_t dest, uint32_t sender,uint8_t type) {
	char body[1];
	body[0] = type;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

/**
* Crea un pacchetto per rifiutare l'ID di un dispositivo.
* @param dest destinatario (dispositivo che ha inviato l'ID)
* @param sender mittente
* @return il pacchetto creato (non richiede ACK).  
*/
static Packet RegistrationIDDeniedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_ID_DENIED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

/**
* Crea un pacchetto per accettare l'ID di un dispositivo.
* @param dest destinatario (dispositivo che ha inviato l'ID)
* @param sender mittente
* @return il pacchetto creato (richiede ACK).  
*/
static Packet RegistrationIDAcceptedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_ID_ACCEPTED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REQUESTS_ACK | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

/**
* Crea un pacchetto per riprendere la registrazione.
* @param dest destinatario (broadcast)
* @param sender mittente
* @return il pacchetto creato (non richiede ACK).  
*/
static Packet RegistrationResumedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_REGISTRATION_RESUMED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

/**
* Crea un pacchetto per interrompere la registrazione.
* @param dest destinatario (broadcast)
* @param sender mittente
* @return il pacchetto creato (non richiede ACK).  
*/
static Packet RegistrationUnavailablePacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_REGISTRATION_DENIED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

/**
* Crea un pacchetto per iscrivere una lampada ad un sensore.
* @param dest destinatario (lampada)
* @param sender mittente
* @param sensor indirizzo del sensore
* @return il pacchetto creato (richiede ACK).  
*/
static Packet SensorSubmissionPacket(uint32_t dest,uint32_t sender,uint32_t sensor){
	char body[4];
	body[0] = ((sensor & 0xFF000000) >> 24);
	body[1] = ((sensor & 0x00FF0000) >> 16);
	body[2] = ((sensor & 0x0000FF00) >> 8);
	body[3] = ((sensor & 0x000000FF) >> 0);
	return Packet(dest,sender,PACKET_TYPE_NORM | PACKET_TYPE_SENSOR_SUBMISSION | PACKET_TYPE_REQUESTS_ACK, packetCounter,body,4);
}

/**
* Determina se il pacchetto è di tipo iscrizione ad un sensore.
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se il pacchetto è del tipo iscrizione ad un sensore, `false` altrimenti  
*/
static bool isSensorSubmissionPacket(uint8_t type, uint8_t packetLength){
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_SENSOR_SUBMISSION) && packetLength == 4;
}

/**
* Determina se il pacchetto è di tipo risposta a richiesta di registrazione.
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se il pacchetto è del tipo risposta a richiesta di registrazione, `false` altrimenti  
*/
static bool isRegistrationResponsePacket(uint8_t type, uint8_t packetLength){
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_REGISTRATION) && packetLength == 1;
}

/**
* Determina se il pacchetto è di tipo richiesta di registrazione.
* @param type il tipo del pacchetto
* @param packetLength la lunghezza del payload del pacchetto
* @return `true` se il pacchetto è del tipo richiesta di registrazione, `false` altrimenti  
*/
static bool isRegistrationRequestPacket(uint8_t type, uint8_t packetLength) {
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_REGISTRATION) && packetLength == 1;
}

/**
* Estrapola la riposta ad una richiesta di registrazione dal payload.
* @param il payload del pacchetto ricevuto
* @return la risposta contenuta nel pachetto
*/
static int response_result(uint8_t payload) {
	return payload & 3;
}
