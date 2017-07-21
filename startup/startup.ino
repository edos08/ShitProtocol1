#include <SPI.h>
#include <RegistrationProtocol.h>
//#include <EEPROM.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define RETRY_WAITING_TIME 8000
#define TYPE DEVICE_TYPE_CONTROLLER

bool idSent = false;
bool idAccepted = false;
bool idDenied = false;
bool registrationDenied = false;
bool registrationResumed = false;
bool waitingTimedOut = false;

uint32_t randomAddress;
unsigned long long timerStartTime = 0;

void setup() {
  Serial.begin(9600);
  while(!Serial);
  //TODO: controllare EPROM
  //Serial.print("Memory content ");
  //Serial.println(readEEPROM(),HEX);
  randomSeed(analogRead(0));
  randomAddress = generateRandomAddress();
  initLoRa(randomAddress, 8, 4, 3);
  subscribeToReceivePacketEvent(handleResponsePacket);
}

void loop() {
  if(!registrationDenied){
    if(!idAccepted){

      if(idDenied){
        Serial.println("Id denied");
        randomAddress = generateRandomAddress();
        changeAddress(randomAddress);
        idSent = false;
        idDenied = false;
      } else if(waitingTimedOut){
          idSent = false;
          waitingTimedOut = false;
      }

      if(!idSent){
        delay(generateRandomWaitingTime());
        int result = sendPacket(RegistrationPacket(NODE_ADDRESS,randomAddress,TYPE));
        Helpers::printResponseMessage(result);
        Serial.print("My ID 0x");
        Serial.println(randomAddress,HEX);
        idSent = true;
        timerStartTime = millis();
      }else{
        if(millis() - timerStartTime > RETRY_WAITING_TIME)
          waitingTimedOut = true;
      }
    }else{
      Serial.print("My ID 0x");
      Serial.print(randomAddress,HEX);
      Serial.println(" has been accepted, I SOULD now write it in my EPROM and start my regular program");
      //TODO: write to EPROM
      //TODO: send type to NODE
      /*int result = sendPacket(TypeSubmissionPacket(NODE_ADDRESS,randomAddress,TYPE));
      Helpers::printResponseMessage(result);*/
      while(true);
    }
  }else{
      if(registrationResumed)
        registrationDenied = false;
      else
        delay(2);
  }
}


uint32_t generateRandomAddress(){
  uint32_t randomNumber = 0;
  uint16_t leftHalf = random(1,0xFFFF);
  uint16_t rightHalf = random(1,0xFFFF);
  randomNumber |= ((uint32_t)(leftHalf)) << 16;
  randomNumber |= rightHalf;
  Serial.print("ID generated = ");
  Serial.println(randomNumber, HEX);
  return randomNumber;
}

int generateRandomWaitingTime(){
  return random(500, 1501);
}

void handleResponsePacket(Packet response){

  if(!isRegistrationResponsePacket(response.type, response.packetLenght))
    return;
  Serial.print("Packet received ");
  switch(response_result((uint8_t)response.body[0])){
    case REGISTRATION_RESPONSE_ID_DENIED:
      Serial.println("ID denied");
      idDenied = true;
      break;
    case REGISTRATION_RESPONSE_ID_ACCEPTED:
      Serial.println("ID accepted");
      idAccepted = true;
      break;
    case REGISTRATION_RESPONSE_REGISTRATION_DENIED:
      Serial.println("Registration denied");
      registrationDenied = true;
      break;
    case REGISTRATION_RESPONSE_REGISTRATION_RESUMED:
      Serial.println("Registration resumed");
      if(registrationDenied)
        registrationResumed = true;
      break;
  }
}

/*uint32_t readEEPROM(){
    uint32_t result = 0;
    int shifter = 24;
    for(int a = 0; a < 4; a++){
        uint8_t c_byte = EEPROM.read(a);
        result |= (((uint32_t)c_byte) << shifter);
        shifter -= 8;
    }
    return result;
}*/
