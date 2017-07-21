
#include <SPI.h>
#include <LoRa.h>
#include <RegistrationProtocol.h>
#include <SerialHelpers.h>
//!!!!! Da mettere solo se la scheda è una Feather M0 !!!!!!
#define Serial SERIAL_PORT_USBVIRTUAL

#define NODE_ADDRESS 0xFFFFFFFF
#define SERIAL_BUFFER_SIZE 15

char serialBuffer[SERIAL_BUFFER_SIZE];

uint8_t devices_to_register = 0;
uint32_t* devices_ids;
uint8_t* devices_types;
int devices_ids_index = 0;


bool handshakeCompleted = false;
bool hasReceivedNumberOfDevicesToRegister = false;
bool isWaitingForDeviceIDCheck = false;
uint32_t idToCheck = 0;
uint8_t typeOfIdToCheck = -1;

bool alertDoubledDevicesTrigger = false;
uint32_t doubled_ID;
bool notifyDevicesIDsAcceptedTrigger = false;

bool hasReceivedType = false;
uint8_t type_received = -1;

bool stream_started = false;
bool waitingForType = false;
bool stream_ended = false;

uint8_t identified_devices = 0;

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

              // ID denied block

              if(alertDoubledDevicesTrigger){
                alertDoubledDevicesTrigger = false;
                int result = sendPacket(RegistrationIDDeniedPacket(doubled_ID,NODE_ADDRESS));
                Helpers::printResponseMessage(result);
                removeDoubledIDFromList();
              }

              //IDs accepted block

              if(notifyDevicesIDsAcceptedTrigger){
                if(!stream_started){
                  sendDevicesStreamStartMessage();
                  stream_started = true;
                }
                if(identified_devices < devices_to_register){
                  int result = sendPacket(RegistrationIDAcceptedPacket(devices_ids[identified_devices],NODE_ADDRESS));
                  sendDeviceTypeToSerial();
                  delay(50);
                  return;
                }else{
                  sendDevicesStreamEndMessage();
                  stream_ended = true;
                  while(true);
                }
            }
    }
  }
}

void removeDoubledIDFromList(){
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

void sendDeviceTypeToSerial(){
    sendDeviceInfoPacket(devices_ids[identified_devices],devices_types[identified_devices]);
    identified_devices++;
}


void handleSubmissionPacket(Packet idSubmissionPacket){
    if(!isWaitingForDeviceIDCheck){
      if(isRegistrationRequestPacket(idSubmissionPacket.type, idSubmissionPacket.packetLenght)){
        if(devices_ids_index >= devices_to_register){ //redundant packet, already have al that i need
          Serial.println("Ridondante");
          notifyDevicesIDsAcceptedTrigger = true;
          return;
        }
        if(!isDuplicateId(idSubmissionPacket.sender)){
          idToCheck = idSubmissionPacket.sender;
          typeOfIdToCheck = idSubmissionPacket.body[0];
          sendIDCheckMessage(idToCheck);
          isWaitingForDeviceIDCheck = true;
          return;
        }else{
          doubled_ID = idSubmissionPacket.sender;
          alertDoubledDevicesTrigger = true;
        }
      }else{
        /*Serial.println("Received packet");
        if(notifyDevicesIDsAcceptedTrigger && isTypeSubmissionPacket(idSubmissionPacket.type, idSubmissionPacket.packetLenght)){
          Serial.println("TYPE");
          hasReceivedType = true;
          type_received = idSubmissionPacket.body[0];
        }*/
     }
   }
}


bool isDuplicateId(uint32_t receivedId){
  int idsFound = 0;
  for(int a = 0; a < devices_ids_index; a++){
    if(devices_ids[a] == receivedId){
      idsFound++;
    }
  }
  return (idsFound > 0);
}

void serialEvent(){
  int serialMessageLength = readSerialContent();

  if(!handshakeCompleted){
    if(isHandshakeResponseMessage(serialBuffer,serialMessageLength)){
      handshakeCompleted = true;
      int result = sendPacket(RegistrationResumedPacket(BROADCAST,NODE_ADDRESS));
      sendHandShakeEndMessage();
    }
    return;
  }else if(!hasReceivedNumberOfDevicesToRegister){
    if(isDevicesCountMessage(serialBuffer,serialMessageLength)){
      hasReceivedNumberOfDevicesToRegister = true;
      devices_to_register = (uint8_t)serialBuffer[1];
      devices_ids = new uint32_t[devices_to_register];
      devices_types = new uint8_t[devices_to_register];
    }
    return;
  } else if(isWaitingForDeviceIDCheck){
    if(isIDCheckResponse(serialBuffer,serialMessageLength)){
      isWaitingForDeviceIDCheck = false;
      int idCheckResult = serialBuffer[1];
      if(idCheckResult == 0){
        addIDToValidIDsList();
      } else{
        doubled_ID = idToCheck;
        alertDoubledDevicesTrigger = true;
      }
    }
  }
}

int readSerialContent(){
  int serialIndex = 0;
  while(Serial.available()){
    serialBuffer[serialIndex] = (char)Serial.read();
    serialIndex++;
  }
  return serialIndex;
}

void addIDToValidIDsList(){
    devices_ids[devices_ids_index] = idToCheck;
    devices_types[devices_ids_index] = typeOfIdToCheck;
    devices_ids_index++;
    if(devices_ids_index >= devices_to_register){
      notifyDevicesIDsAcceptedTrigger = true;
    }
}
