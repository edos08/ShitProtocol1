#include <SPI.h>
#include <LoRa.h>
#include <RegistrationProtocol.h>

#define NODE_ADDRESS 0xFFFFFFFF
#define RETRY_WAITING_TIME 8000 

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
  randomSeed(analogRead(0));
  randomAddress = generateRandomAddress();
  initLoRa(randomAddress, 8, 4, 3);
  subscribeToReceivePacketEvent(handleResponsePacket);
}

void loop() {
  if(!registrationDenied){
    if(!idAccepted){
  
      if(idDenied){
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
        int result = sendPacket(RegistrationPacket(NODE_ADDRESS,randomAddress,"",0));
        Helpers::printResponseMessage(result);
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
  randomNumber |= leftHalf << 16;
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
  switch(response_result((uint8_t)response.body[0])){
    case REGISTRATION_RESPONSE_ID_DENIED:
      idDenied = true;
      break;
    case REGISTRATION_RESPONSE_ID_ACCEPTED:
      idAccepted = true;
      break;
    case REGISTRATION_RESPONSE_REGISTRATION_DENIED:
      registrationDenied = true;
      break;
    case REGISTRATION_RESPONSE_REGISTRATION_RESUMED:
      registrationResumed = true;
  }
}



