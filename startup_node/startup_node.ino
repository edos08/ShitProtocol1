#include <SPI.h>
#include <LoRa.h>
#include <WorkingProtocol.h>
#include <SerialHelpers.h>
//!!!!! Da mettere solo se la scheda è una Feather M0 !!!!!!
#define Serial SERIAL_PORT_USBVIRTUAL

#define NODE_ADDRESS 0xFFFFFFFF
#define SERIAL_BUFFER_SIZE 15

char serialBuffer[SERIAL_BUFFER_SIZE];

void setup() {
  Serial.begin(9600);
  while(!Serial);
  initLoRa(NODE_ADDRESS, 8,4, 3);
  subscribeToReceivePacketEvent(handleSubmissionPacket);
}

void loop() {

  if(Serial.available()){
    serialEvent();
  }

  if(handshakeCompleted){

    if(hasReceivedNumberOfDevicesToRegister){
      if(!stream_ended){

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
                  delay(50);
                  return;
                }
                if(identified_devices < devices_to_register){
                  int result = sendPacket(RegistrationIDAcceptedPacket(devices_ids[identified_devices],NODE_ADDRESS));
                  sendDeviceTypeToSerial();
                  delay(50);
                  return;
                }else{
                  sendDevicesStreamEndMessage();
                  stream_ended = true;
                }
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
      if(isRegistrationRequestPacket(idSubmissionPacket.type, idSubmissionPacket.packetLength)){
        if(devices_ids_index >= devices_to_register && devices_to_register != -1){ //redundant packet, already have al that i need
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
      }
   } else {
    Serial.println("Waitinn");
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

  if(isResetMessage(serialBuffer,serialMessageLength)){
    sendHandshakeMessage();
    handshakeCompleted = false;
    return;
  }
  if(!handshakeCompleted){
    if(isHandshakeResponseMessage(serialBuffer,serialMessageLength)){
      handshakeCompleted = true;
      sendHandShakeEndMessage();
      return;
    }
  }
  if(isEnterRegistrationModeMessage(serialBuffer,serialMessageLength)){
    enterRegistrationMode();
    int result = sendPacket(RegistrationResumedPacket(BROADCAST,NODE_ADDRESS));
    return;
  }
  if(!hasReceivedNumberOfDevicesToRegister){
    if(isDevicesCountMessage(serialBuffer,serialMessageLength)){
      hasReceivedNumberOfDevicesToRegister = true;
      devices_to_register = (uint8_t)serialBuffer[1];
      devices_ids = new uint32_t[devices_to_register];
      devices_types = new uint8_t[devices_to_register];
      Serial.println("Dev no received");
      return;
    }
  }
  if(isWaitingForDeviceIDCheck){
    if(isIDCheckResponse(serialBuffer,serialMessageLength)){
      isWaitingForDeviceIDCheck = false;
      int idCheckResult = serialBuffer[1];
      if(idCheckResult == 0){
        addIDToValidIDsList();
      } else{
        doubled_ID = idToCheck;
        alertDoubledDevicesTrigger = true;
      }
      return;
    }
  }

  if(isSensorSubmissionMessage(serialBuffer,serialMessageLength)){
    uint32_t controllerAddress = Helpers::read32bitInt((uint8_t*)(serialBuffer + 1));
    uint32_t sensorAddress = Helpers::read32bitInt((uint8_t*)(serialBuffer + 5));
    Serial.println("Submission: controller: ");
    Serial.println(controllerAddress,HEX);
    Serial.println("Submission: sensor: ");
    Serial.println(sensorAddress,HEX);

    int result = sendPacket(SensorSubmissionPacket(controllerAddress,NODE_ADDRESS,sensorAddress));
    //Helpers::printResponseMessage(result);
    sendResultMessage(result);
  }

  if (isLightValueChangedMessage(serialBuffer,serialMessageLength)){
    uint32_t controllerAddress = Helpers::read32bitInt((uint8_t*)(serialBuffer + 1));
    uint16_t lightValue = (((uint16_t)(serialBuffer[5])) << 8 );
    lightValue |= (uint16_t)serialBuffer[6];
    Serial.print("Controller: ");
    Serial.println(controllerAddress,HEX);
    Serial.print("LightValue: ");
    Serial.print(lightValue);
    int result = sendPacket(LightValueChangedPacket(controllerAddress,NODE_ADDRESS,serialBuffer + 5));
    //Helpers::printResponseMessage(result);
    sendResultMessage(result);

  } else {
    Serial.println("unrecognized");
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
