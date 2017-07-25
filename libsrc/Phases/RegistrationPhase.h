#include "AbstractPhase.h"

class RegistrationPhase : public AbstractPhase{

private:
  bool active;
  uint32_t* devices_ids;
  uint8_t* devices_types;

  uint8_t devices_ids_index;

  bool isWaitingForDeviceIDCheck = false;
  uint32_t idToCheck;
  uint8_t typeOfIdToCheck;


  bool alertDoubledDevicesTrigger;
  uint32_t doubled_ID;
  bool notifyDevicesIDsAcceptedTrigger;

  uint8_t identified_devices;

  uint8_t devices_to_register;
  bool stream_started;

  void reset(){
    active = false;
    if(devices_ids != NULL)
      delete[] devices_ids;
    if(devices_types != NULL)
      delete[] devices_types;
    devices_ids_index = 0;
    isWaitingForDeviceIDCheck = false;
    idToCheck = 0;
    typeOfIdToCheck = -1;
    alertDoubledDevicesTrigger = false;
    doubled_ID = 0;
    notifyDevicesIDsAcceptedTrigger = false;
    identified_devices = 0;
    stream_started = false;
    devices_to_register = -1;
  }

public:

  RegistrationPhase(){
    reset();
  }

  void action(){
      if(alertDoubledDevicesTrigger){
          alertDoubledDevicesTrigger = false;
          int result = sendPacket(RegistrationIDDeniedPacket(doubled_ID,NODE_ADDRESS));
          Helpers::printResponseMessage(result);
          removeDoubledIDFromList();
          return;
      }

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
          stop();
        }
    }

  }

  void handleLoRaPacket(Packet packet){
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
      }
    }
  }

  void handleSerialPacket(char serialBuffer[],int bufferSize){

    if(isEnterRegistrationModeMessage(serialBuffer,serialMessageLength)){
      enterRegistrationMode();
      return;
    }

    if(devices_to_register == -1){
      if(isDevicesCountMessage(serialBuffer,serialMessageLength)){
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
    }else {
      Serial.println("unrecognized");
    }
  }

  void start(){
    active = true;
    reset();
  }
  void stop(){
    active = false;
  }
  bool isActive(){
    return active;
  }


}
