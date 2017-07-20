#include "LoRaProtocol.h"

//int csPin = 8;
//int resetPin = 4;
//int irqPin = 3;

// Global varialbles

Packet* lastPacket;
uint32_t myAddress;
uint8_t packetCounter = 0;
AckHolder ackHolder;
functionCall subscribedFunction = NULL;
//Global functions not declared in LoRaProtocol.h

int sendPacketAck(Packet packet, int retries);
int sendNonAckPacket(Packet packet);
int sendPacketAck(Packet packet, int retries);

//Function bodies

void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin){
    myAddress = _myAddress;
	  lastPacket = new Packet();
    LoRa.setPins(csPin, resetPin, irqPin);// set CS, reset, IRQ pin
    if (!LoRa.begin(866E6)) {             // initialize ratio at 866 MHz
        //Serial.println("LoRa init failed. Check your connections.");
        while (true);                       // if failed, do nothing
    }

  LoRa.onReceive(receivePacket);
  //Serial.println("LoRa init succeeded.");
}

void changeAddress(uint32_t newAddress) {
	myAddress = newAddress;
}

int sendPacket(Packet packet){
	//if(!packet.isAck())
	//	Serial.println("Sending packet");
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
	LoRa.write(packet.packetLenght);
	for (int a = 0; a < packet.packetLenght; a++)
		LoRa.write(packet.body[a]);
	int result = LoRa.endPacket();
	if (result == SUCCESFUL_RESPONSE)
		packetCounter++;
	activateReceiveMode();
	return result;
}


int sendPacketAck(Packet packet, int retries){
	if (sendNonAckPacket(packet) == PACKET_SENDING_ERROR)
		return PACKET_SENDING_ERROR;
	unsigned long long currTime = millis();
	while (!ackHolder.hasAck && millis() - currTime < ACK_WAITING_MILLIS);
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

void activateReceiveMode(){
    LoRa.receive();
}

void receivePacket(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return
  Packet receivedPacket = Helpers::readInputPacket();
  if(receivedPacket == (*lastPacket)) return;
  //Serial.println("Packet received");
  //Serial.print("Dest: 0x");
  //Serial.println(receivedPacket.dest,HEX);
  if (myAddress != receivedPacket.dest && receivedPacket.dest != 0x00000000) {
    //Serial.println("This message is not for me.");
    return;
  }

  int position = 0;
  while (LoRa.available()) {
	  receivedPacket.body[position] = (char)LoRa.read();      // add bytes one by one
    position++;
  }

  if((receivedPacket.packetLenght) != position){
      return;
  }

  if (receivedPacket.requestsAck()) {
	  Packet ackPacket = Packet(receivedPacket.sender, myAddress, PACKET_TYPE_ACK, receivedPacket.packetNumber, "", 0);
	  sendPacket(AckPacket(receivedPacket.sender,myAddress,receivedPacket.packetNumber));
  }

  if (receivedPacket.isAck()) {
	  ackHolder.hasAck = true;
	  ackHolder.ack = receivedPacket;
  }

  if (subscribedFunction != NULL && !receivedPacket.isAck()) {
	  subscribedFunction(receivedPacket);
  }
  *lastPacket = receivedPacket;
   return;
}

void subscribeToReceivePacketEvent(functionCall function) {
	subscribedFunction = function;
}
