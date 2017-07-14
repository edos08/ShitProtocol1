#include <SPI.h>
#include <LoRa.h>
#include <RegistrationProtocol.h>

//TODO: Implement all serial communication (already done on test sketch)

#define NODE_ADDRESS 0xFFFFFFFF
#define DEVICES_TO_REGISTER 1 //TODO: receive info from raspberry

uint32_t devices_ids[DEVICES_TO_REGISTER];
uint32_t devices_types[DEVICES_TO_REGISTER];
int devices_ids_index = 0;
uint32_t doubled_ID;

bool alertDoubledDevicesTrigger = false;
bool notifyDevicesTrigger = false;
bool hasReceivedType = false;
uint8_t type_received = -1;

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
    int result = sendPacket(RegistrationIDDeniedPacket(doubled_ID,NODE_ADDRESS));
    Helpers::printResponseMessage(result);
    int double_index = -1;
    for(int b = 0; b < devices_ids_index; b++){
        if(devices_ids[b] == doubled_ID){
            double_index = b;
            break;
        }
    }

    for(int b = double_index; b < devices_ids_index - 1; b++)
        devices_ids[b] = devices_ids[b+1];

    devices_ids_index--;
  }

  if(notifyDevicesTrigger){
    int identified_devices = 0;
    for(int a = 0; a <devices_ids_index; a++){
        int result = sendPacket(RegistrationIDAcceptedPacket(devices_ids[a],NODE_ADDRESS));
        Helpers::printResponseMessage(result);
        while(!hasReceivedType);
        devices_types[a] = type_received;
        hasReceivedType = false;
        if(result == SUCCESFUL_RESPONSE)
            identified_devices++;
        delay(1);
    }
    Serial.println(String(identified_devices) + "/" + String(DEVICES_TO_REGISTER) + " devices identified succesfully!!!");
    Serial.println("Now I should start my normal lyfecycle");
    Serial.println("Here is a list of all the ids: ");
    for(int a = 0; a < devices_ids_index; a++){ // this loop should send the devices ids and types to the raspberry
        Serial.print("0x");
        Serial.println(devices_ids[a], HEX);
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
    bool duplicatesFound = findDuplicateIds(idSubmissionPacket.sender);
    if(!duplicatesFound){
      devices_ids[devices_ids_index] = idSubmissionPacket.sender;
      devices_ids_index++;
      if(devices_ids_index >= DEVICES_TO_REGISTER)
        notifyDevicesTrigger = true;
    } else{
      doubled_ID = idSubmissionPacket.sender;
      alertDoubledDevicesTrigger = true;
    }
  }
  if(notifyDevicesTrigger && isTypeSubmissionPacket(idSubmissionPacket.type, idSubmissionPacket.packetLenght)){
    hasReceivedType = true;
    type_received = idSubmissionPacket.body[1];
  }

}


bool findDuplicateIds(uint32_t receivedId){
  int idsFound = 0;
  for(int a = 0; a < devices_ids_index; a++){
    if(devices_ids[a] == receivedId){
      idsFound++;
    }
  }
  //TODO: query to ID DB
  return idsFound != 0;
}
