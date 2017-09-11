/**
* Protocollo LoRaProtocol
* @file LoRaProtocol.cpp
*/

#include "LoRaProtocol.h"

//int csPin = 8;
//int resetPin = 4;  // default values used.
//int irqPin = 3;

// Global varialbles

uint32_t myAddress;                                    /**< Indirizzo del dispositivo nella rete.*/
uint8_t packetCounter = 0;                             
AckHolder ackHolder;                                   /**< Struttura che contiene gli ACK ricevuti.*/
functionCall subscribedFunction = NULL;               
int notificationPin = 7;                               /**< Pin a cui si può collegare un buzzer per avere una notifica uditiva della ricezione di messaggi.*/
//Global functions not declared in LoRaProtocol.h

/** Invia un pacchetto e si aspetta un ACK in risposta (usata internamente).
* @param packet il pacchetto da inviare
* @param retries il numero di tentativi fatti (fino a 3)
* @return il risultato dell'operazione
* @see `sendPacket()`
*/
int sendPacketAck(Packet packet, int retries);

/** Invia un pacchetto senza aspettarsi un ACK in risposta (usata internamente).
* @param packet il pacchetto da inviare
* @return il risultato dell'operazione
* @see `sendPacket()`
*/
int sendNonAckPacket(Packet packet);

//Function bodies

void initLoRa(uint32_t _myAddress, int csPin, int resetPin, int irqPin){
  myAddress = _myAddress;
  LoRa.setPins(csPin, resetPin, irqPin);// set CS, reset, IRQ pin
  pinMode(notificationPin,OUTPUT);
  if (!LoRa.begin(866E6)) {             // initialize ratio at 866 MHz
      Serial.println("LoRa init failed. Check your connections.");
      tone(notificationPin,1000);
      //digitalWrite(notificationPin,HIGH);
      while (true);                       // if failed, do nothing
  }

  //Serial.println("LoRa init succeeded.");
}

void changeAddress(uint32_t newAddress) {
	myAddress = newAddress;
}

int sendPacket(Packet packet){
	if (packet.requestsAck())
		return sendPacketAck(packet,0);
	return sendNonAckPacket(packet);

}

int sendNonAckPacket(Packet packet) {
	LoRa.beginPacket();                         // start packet
	Helpers::write32bitIntToPacket(packet.dest);
	Helpers::write32bitIntToPacket(packet.sender);
	LoRa.write(packet.type);
	LoRa.write(packet.packetNumber);
	LoRa.write(packet.packetLength);
	for (int a = 0; a < packet.packetLength; a++)
		LoRa.write(packet.body[a]);
	int result = LoRa.endPacket();
	if (result == SUCCESFUL_RESPONSE)
		packetCounter++;
	return result;
}


int sendPacketAck(Packet packet, int retries){
	if (sendNonAckPacket(packet) == PACKET_SENDING_ERROR)
		return PACKET_SENDING_ERROR;
	unsigned long long currTime = millis();

	while (!ackHolder.hasAck && millis() - currTime < ACK_WAITING_MILLIS)
		checkIncoming();
		
	ackHolder.hasAck = false;
	LoRa.idle();
	if (ackHolder.ack.sender == packet.dest && ackHolder.ack.packetNumber == packet.packetNumber) {
		return SUCCESFUL_RESPONSE;
	}
	if (retries < 3) {
		packetCounter--; // added 1 in sendNonAckPacket function
		return sendPacketAck(packet, retries + 1);
	}
	return HOST_UNREACHABLE_RESPONSE;
}

void checkIncoming(){
	int packetSize = LoRa.parsePacket();
	if(packetSize == 0)
		return;
	receivePacket(packetSize);
}

void receivePacket(int packetSize) {
  tone(notificationPin,1000,200);
  Packet* receivedPacket = Helpers::readInputPacket();
  if (myAddress != receivedPacket->dest && receivedPacket->dest != 0x00000000) {
    while(LoRa.available())
		LoRa.read();
	delete receivedPacket;
    return;
  }

  int position = 0;
  while (LoRa.available()) {
	  receivedPacket->body[position] = (char)LoRa.read();      // add bytes one by one
    position++;
  }

  if((receivedPacket->packetLength) != position){
	delete receivedPacket;  
	return;
  }

  if (receivedPacket->requestsAck()) {
	  sendPacket(AckPacket(receivedPacket->sender,myAddress,receivedPacket->packetNumber));
  }

  if (receivedPacket->isAck()) {
	  ackHolder.hasAck = true;
	  ackHolder.ack = *receivedPacket;
  } else if (subscribedFunction != NULL) {
	//receivedPacket->printPacket();
	subscribedFunction(*receivedPacket);
  }
  //receivedPacket->printPacket();
  delete receivedPacket;
}

void subscribeToReceivePacketEvent(functionCall function) {
	subscribedFunction = function;
}
