#include "LoRaProtocol.h"

//int csPin = 8;          
//int resetPin = 4;       
//int irqPin = 3;   
Packet lastReceivedPacket;
Packet oldPacket;
int myAddress;
//lastReceivedPacket = Packet();
void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin){
    myAddress = _myAddress;
    lastReceivedPacket = Packet();
	oldPacket = Packet();
    LoRa.setPins(csPin, resetPin, irqPin);// set CS, reset, IRQ pin

    if (!LoRa.begin(866E6)) {             // initialize ratio at 866 MHz
        Serial.println("LoRa init failed. Check your connections.");
        while (true);                       // if failed, do nothing
    }

  LoRa.onReceive(receivePacket);
  Serial.println("LoRa init succeeded.");
}

int sendPacket(Packet packet){
    LoRa.beginPacket();                         // start packet
	Helpers.write32bitIntToPacket(packet.dest);
	Helpers.write32bitIntToPacket(packet.source);
    LoRa.write(packet.type);                 
	LoRa.write(packet.packetNumber);
    LoRa.write(packet.packetLenght);        
	for (int a = 0; a < packet.packetLenght; a++)
		LoRa.write(packet.body[a]);
    return LoRa.endPacket();        
}

int sendPacketAck(Packet packet) {
	return sendPacketAck(packet, 0);
}

int sendPacketAck(Packet packet, int retries){
	sendPacket(packet);
	activateReceiveMode();
	while (!hasReceivedPacket() || !lastReceivedPacket.isAck());
	LoRa.idle();
	if (lastReceivedPacket.sender == packet.dest && lastReceivedPacket.packetNumber == packet.packetNumber) {
		return SUCCESFUL_RESPONSE;
	}
	if(retries < 3)
		sendPacketAck(packet);
	return HOST_UNREACHABLE_RESPONSE;
}

bool hasReceivedPacket() {
	return lastReceivedPacket != oldPacket;
}

void activateReceiveMode(){
    LoRa.receive();
}

void receivePacket(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return

  // read packet header bytes:
  oldPacket = lastReceivedPacket;
  lastReceivedPacket = Packet();
  byte buffer[4];
  LoRa.readBytes(buffer, 4);
  lastReceivedPacket.dest = Helpers.read32bitInt(buffer);
  LoRa.readBytes(buffer, 4);
  lastReceivedPacket.sender = Helpers.read32bitInt(buffer);
  lastReceivedPacket.type = LoRa.read();
  lastReceivedPacket.packetNumber = LoRa.read();
  lastReceivedPacket.packetLenght = LoRa.read(); 

  if (myAddress != lastReceivedPacket.dest && lastReceivedPacket.dest != 0x00000000) {
    Serial.println("This message is not for me.");
    return;
  }
                                        
  int position = 0;
  while (LoRa.available()) {
    lastReceivedPacket.body[position] = (char)LoRa.read();      // add bytes one by one
    position++;
  }
  
  if((lastReceivedPacket.packetLenght) != position){
      Serial.println("Attenzione, pacchetto corrotto");
      return;
  }

  // if message is for this device, or broadcast, print details:
  Serial.println("Received from: 0x" + String(lastReceivedPacket.sender, HEX));
  Serial.println("Sent to: 0x" + String(lastReceivedPacket.dest, HEX));
  Serial.println("Message ID: " + String(lastReceivedPacket.packetNumber));
  Serial.println("Message length: " + String(lastReceivedPacket.packetLenght));
  Serial.println("Message: " + String(lastReceivedPacket.body));
  Serial.println();

  if (lastReceivedPacket.requestsAck()) {
	  Packet ackPacket = Packet(lastReceivedPacket.sender, myAddress, PACKET_TYPE_ACK, lastReceivedPacket.packetNumber, "", 0);
	  sendPacket(ackPacket);
  }

  //TODO: test ack packets

}



