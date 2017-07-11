#include "LoRaProtocol.h"

//int csPin = 8;          
//int resetPin = 4;       
//int irqPin = 3;   
Packet lastReceivedPacket;
int myAddress;
//lastReceivedPacket = Packet();
void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin){
    myAddress = _myAddress;
    lastReceivedPacket = Packet();
    LoRa.setPins(csPin, resetPin, irqPin);// set CS, reset, IRQ pin

    if (!LoRa.begin(915E6)) {             // initialize ratio at 915 MHz
        Serial.println("LoRa init failed. Check your connections.");
        while (true);                       // if failed, do nothing
    }

  LoRa.onReceive(receivePacket);
  Serial.println("LoRa init succeeded.");
}

int sendPacket(Packet packet){

	Serial.println("Sent to: 0x" + String(packet.dest, HEX));
    LoRa.beginPacket();                         // start packet
    LoRa.write(packet.dest & 0xFF000000);       //
	LoRa.write(packet.dest & 0x00FF0000);       // Destination
	LoRa.write(packet.dest & 0x0000FF00);       //
	LoRa.write(packet.dest & 0x000000FF);       //

	LoRa.write(packet.sender & 0xFF00000000);   //
	LoRa.write(packet.sender & 0x00FF000000);   // SENDER
	LoRa.write(packet.sender & 0x000000FF00);   //
	LoRa.write(packet.sender & 0x00000000FF);   //

    LoRa.write(packet.type);                 // add message ID
	LoRa.write(packet.packetNumber);
    LoRa.write(packet.packetLenght);        // add payload length
    LoRa.print(String(packet.body));                 // add payload
    return LoRa.endPacket();                     // finish packet and send it
    //Serial.println("Packet sent");
}

void activateReceiveMode(){
    LoRa.receive();
}

void receivePacket(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return

  // read packet header bytes:
  lastReceivedPacket = Packet();
  byte buffer[4];
  LoRa.readBytes(buffer, 4);
  lastReceivedPacket.dest = read32bitInt(buffer[0], buffer[1], buffer[2], buffer[3]);
  lastReceivedPacket.sender = read32bitInt(LoRa.read(), LoRa.read(),LoRa.read(),LoRa.read());
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

  Serial.println("Position " + String(position));

  
  if((lastReceivedPacket.packetLenght) != position){
      Serial.println("Attenzione, pacchetto corrotto");
      return;
  }

  // if message is for this device, or broadcast, print details:
  Serial.println("Received from: 0x" + String(lastReceivedPacket.sender, HEX));
  Serial.println("Sent to: 0x" + String(lastReceivedPacket.dest, HEX));
  Serial.println("Message ID: " + String(lastReceivedPacket.packetNumber));
  Serial.println("Message length: " + String(lastReceivedPacket.packetLenght));
  Serial.println("Message: " + lastReceivedPacket.body[position]);
  Serial.println();
}

uint32_t read32bitInt(byte byte1, byte byte2, byte byte3, byte byte4){
    uint32_t result = 0;
    result |= (byte1 << 24);
    result |= (byte2 << 16);
    result |= (byte3 << 8);
    result |= (byte4);
    return result;
}