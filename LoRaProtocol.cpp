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

void sendPacket(Packet packet){
    LoRa.beginPacket();                   // start packet
    LoRa.print(packet.dest);              // add destination address
    LoRa.print(packet.sender);             // add sender address
    LoRa.write(packet.type);                 // add message ID
    LoRa.write(packet.packetLenght);        // add payload length
    LoRa.print(packet.body);                 // add payload
    LoRa.endPacket();                     // finish packet and send it
    Serial.println("Packet sent");
}

void activateReceiveMode(){
    LoRa.receive();
}

void receivePacket(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return
  // read packet header bytes:
  lastReceivedPacket.dest = read32bitInt(LoRa.read(),LoRa.read(), LoRa.read(), LoRa.read());
  lastReceivedPacket.sender = read32bitInt(LoRa.read(), LoRa.read(),LoRa.read(),LoRa.read());
  lastReceivedPacket.type = LoRa.read();
  lastReceivedPacket.packetNumber = LoRa.read();
  lastReceivedPacket.packetLenght = LoRa.read(); 

  
  Serial.println("Sent to: 0x" + String(lastReceivedPacket.dest, HEX));
  
  if (myAddress != lastReceivedPacket.dest && lastReceivedPacket.dest != 0x00000000) {
    Serial.println("This message is not for me.");
    return;
  }
                                        
  int position = 0;
  while (LoRa.available()) {
    lastReceivedPacket.body[position] = (char)LoRa.read();      // add bytes one by one
    position++;
  }
  
  if(lastReceivedPacket.packetLenght != position){
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

uint32_t read32bitInt(uint8_t byte1, uint8_t byte2, uint8_t byte3, uint8_t byte4){
    uint32_t result = 0;
    result |= (byte1 << 24);
    result |= (byte2 << 16);
    result |= (byte3 << 8);
    result |= (byte4);
    return result;
}