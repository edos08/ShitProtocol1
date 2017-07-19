#include <SPI.h>
#include <LoRa.h>
#include <RegistrationProtocol.h>
#include <SerialHelpers.h>
//!!!!! Da mettere solo se la scheda è una Feather M0 !!!!!!
#define Serial SERIAL_PORT_USBVIRTUAL

#define NODE_ADDRESS 0xFFFFFFFF
#define SERIAL_BUFFER_SIZE 15
//#define devices_to_register 1 //TODO: receive info from raspberry

char serialBuffer[SERIAL_BUFFER_SIZE];

uint8_t devices_to_register = 0;
uint32_t* devices_ids;
uint32_t* devices_types;
int devices_ids_index = 0;
uint32_t doubled_ID;
uint8_t idCheckResult = 0;

bool handshakeCompleted = false;
bool hasReceivedNumberOfDevicesToRegister = false;
bool isWaitingForDeviceIDCheck = false;
bool alertDoubledDevicesTrigger = false;
bool notifyDevicesTrigger = false;
bool hasReceivedType = false;
uint8_t type_received = -1;

void setup() {
  Serial.begin(9600);
  while(!Serial);
  sendHandshakeMessage();
  initLoRa(NODE_ADDRESS, 8,4, 3);
  subscribeToReceivePacketEvent(handleSubmissionPacket);
}

void loop() {

  if(Serial.available()){
    serialEvent();
  }
  if(handshakeCompleted){
    if(hasReceivedNumberOfDevicesToRegister){
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
        sendDevicesStreamStartMessage();
        for(int a = 0; a <devices_ids_index; a++){
            int result = sendPacket(RegistrationIDAcceptedPacket(devices_ids[a],NODE_ADDRESS));
            Helpers::printResponseMessage(result);
            while(!hasReceivedType);
            devices_types[a] = type_received;
            hasReceivedType = false;
            if(result == SUCCESFUL_RESPONSE)
                identified_devices++;
            sendDeviceInfoPacket(devices_ids[a],type_received);
            delay(1);
        }
        sendDevicesStreamEndMessage();
        while(true);
      }
    }
  }
}


void handleSubmissionPacket(Packet idSubmissionPacket){
  if(isRegistrationRequestPacket(idSubmissionPacket.type, idSubmissionPacket.packetLenght)){
    if(devices_ids_index >= devices_to_register){ //redundant packet, already have al that i need
      notifyDevicesTrigger = true;
      return;
    }
    bool duplicatesFound = isDuplicateId(idSubmissionPacket.sender);
    if(!duplicatesFound){
      devices_ids[devices_ids_index] = idSubmissionPacket.sender;
      devices_ids_index++;
      if(devices_ids_index >= devices_to_register)
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

bool isDuplicateId(uint32_t receivedId){
  int idsFound = 0;
  for(int a = 0; a < devices_ids_index; a++){
    if(devices_ids[a] == receivedId){
      idsFound++;
    }
  }
  if(idsFound > 0)
      return true;
  isWaitingForDeviceIDCheck = true;
  sendIDCheckMessage(receivedId);
  while(isWaitingForDeviceIDCheck);
  return idCheckResult != MESSAGE_ID_VALID;
}

void serialEvent(){
  int serialIndex = 0;
  while(Serial.available()){
    serialBuffer[serialIndex] = (char)Serial.read();
    serialIndex++;
  }
  if(!handshakeCompleted){
    if(isHandshakeResponseMessage(serialBuffer,serialIndex)){
      handshakeCompleted = true;
      int result = sendPacket(RegistrationResumedPacket(BROADCAST,NODE_ADDRESS));
      //Helpers::printResponseMessage(result);
      sendHandShakeEndMessage();
    }
    return;
  }else if(!hasReceivedNumberOfDevicesToRegister){
    if(isDevicesCountMessage(serialBuffer,serialIndex)){
      hasReceivedNumberOfDevicesToRegister = true;
      devices_to_register = (uint8_t)serialBuffer[1];
      devices_ids = new uint32_t[devices_to_register];
      devices_types = new uint32_t[devices_to_register];
    }
    return;
  } else if(isWaitingForDeviceIDCheck){
    Serial.println("Wainting for check");
    if(isIDCheckResponse(serialBuffer,serialIndex)){
      Serial.println("checked");
      isWaitingForDeviceIDCheck = false;
      idCheckResult = serialBuffer[1];
    }
  }
}
