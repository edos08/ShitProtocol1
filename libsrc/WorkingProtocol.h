#ifndef WORKING_PROTOCOL_H
#define WORKING_PROTOCOL_H

#include "RegistrationProtocol.h"

static Packet SensorValuePacket(uint32_t sender,uint16_t sensorValue){
  char body[2];
  body[0] = ((sensorValue & 0xFF00) >> 8);
  body[1] = ((sensorValue & 0x00FF) >> 0);
  return Packet(0x0,sender,PACKET_TYPE_NORM | PACKET_TYPE_SENSOR_VALUE,packetCounter,body,2);
}

static bool isSensorValuePacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_SENSOR_VALUE && packetLength == 2;
}

static Packet LightValueChangedPacket(uint32_t dest, uint32_t sender, char* lightValue){
    char body[2];
    body[0] = lightValue[0];
    body[1] = lightValue[1];
    return Packet(sender,dest,PACKET_TYPE_NORM | PACKET_TYPE_LIGHT_VALUE_CHANGED | PACKET_TYPE_REQUESTS_ACK,packetCounter,body,2);
}

static bool isLightValueChangedPacket(uint8_t type, uint8_t packetLength){
  return (type & PACKET_TYPE_MASK) == PACKET_TYPE_LIGHT_VALUE_CHANGED && packetLength == 2;
}

#endif