#include <SPI.h>
#include <LoRa.h>
#include <RegistrationProtocol.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define DEVICES_TO_REGISTER 1

Pair_p devices_ids[DEVICES_TO_REGISTER];
Pair_p* doubled_devices;
int devices_ids_index = 0;
int doubled_devices_index = 0;

bool alertDoubledDevicesTrigger = false;
bool notifyDevicesTrigger = false;

void setup() {
  Serial.begin(9600);
  while(!Serial);
  initLoRa(NODE_ADDRESS, 8, 4, 3);
  subscribeToReceivePacketEvent(handleSubmissionPacket);
  int result = sendPacket(RegistrationResumedPacket(BROADCAST,NODE_ADDRESS));
  Helpers::printResponseMessage(result);
}

void loop() {

  if(alertDoubledDevicesTrigger){
    alertDoubledDevicesTrigger = false;
    for(int a = 0; a < doubled_devices_index; a++){
      Pair_p to_find = doubled_devices[a];
      int result = sendPacket(RegistrationIDDeniedPacket(to_find.ID,NODE_ADDRESS));
      Helpers::printResponseMessage(result);
      int double_index;
      do{ 
        double_index = -1;
        for(int b = 0; b < devices_ids_index; b++){
            if(devices_ids[b].ID == to_find.ID){
                double_index = b;
                break;
            }
        }

        for(int b = double_index; b < devices_ids_index - 1; b++)
            devices_ids[b] = devices_ids[b+1];

        devices_ids_index--;
        
      }while(double_index != -1);
    }
  }

  if(notifyDevicesTrigger){
    for(int a = 0; a <devices_ids_index; a++){
        int result = sendPacket(RegistrationIDAcceptedPacket(devices_ids[a].ID,NODE_ADDRESS));
        Helpers::printResponseMessage(result);
    }
    Serial.println("All devices identified succesfully!!!");
    Serial.println("Now I should start my normal lyfecycle");
    Serial.println("Here is a list of all the ids: ");
    for(int a = 0; a < devices_ids_index; a++){
        Serial.print("0x");
        Serial.println(devices_ids[a].ID, HEX);  
    }

    while(true);
  }
  
}


void handleSubmissionPacket(Packet idSubmissionPacket){
  if(isRegistrationRequestPacket(idSubmissionPacket.type, idSubmissionPacket.packetLenght)){
    if(devices_ids_index >= DEVICES_TO_REGISTER){ //redundant packet, already have al that i need
      notifyDevicesTrigger = true;
      return;
    }
    Pair_p receivedId_p(idSubmissionPacket.sender, idSubmissionPacket.packetNumber);
    doubled_devices = findDuplicateIds(receivedId_p, &doubled_devices_index);
    if(doubled_devices_index == 1){ // id is not duplicated, accept
      devices_ids[devices_ids_index] = receivedId_p;
      devices_ids_index++;
      if(devices_ids_index >= DEVICES_TO_REGISTER){ 
        notifyDevicesTrigger = true;
      }
    } else
      alertDoubledDevicesTrigger = true;
  }
}


Pair_p* findDuplicateIds(Pair_p receivedId_p, int* returnLenght){
  Pair_p* doubles = new Pair_p[devices_ids_index];
  int arrayLenght = 1;
  doubles[0] = receivedId_p;
  for(int a = 0; a < devices_ids_index; a++){
    if(wasResent(devices_ids[a], receivedId_p))
        continue;
    if(devices_ids[a].ID == receivedId_p.ID){
      doubles[arrayLenght] = devices_ids[a];
      arrayLenght++;
    }
  }
  *returnLenght = arrayLenght;
  return doubles;
}


