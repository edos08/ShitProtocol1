#pragma once

#include "LoRaProtocol.h"


#define REGISTRATION_RESPONSE_ID_DENIED 0
#define REGISTRATION_RESPONSE_ID_ACCEPTED 1
#define REGISTRATION_RESPONSE_REGISTRATION_DENIED 2
#define REGISTRATION_RESPONSE_REGISTRATION_RESUMED 3

#define DEVICE_TYPE_NODE 1
#define DEVICE_TYPE_CONTROLLER 2
#define DEVICE_TYPE_SENSOR 3

static Packet RegistrationPacket(uint32_t dest, uint32_t sender,uint8_t type) {
	char body[1];
	body[0] = type;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

static Packet RegistrationIDDeniedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_ID_DENIED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

static Packet RegistrationIDAcceptedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_ID_ACCEPTED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REQUESTS_ACK | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

static Packet RegistrationResumedPacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_REGISTRATION_RESUMED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

static Packet RegistrationUnavailablePacket(uint32_t dest, uint32_t sender) {
	char body[1];
	body[0] = REGISTRATION_RESPONSE_REGISTRATION_DENIED;
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REGISTRATION, packetCounter, body, 1);
}

static Packet SensorSubmissionPacket(uint32_t dest,uint32_t sender,uint32_t sensor){
	char body[4];
	body[0] = ((sensor & 0xFF000000) >> 24);
	body[1] = ((sensor & 0x00FF0000) >> 16);
	body[2] = ((sensor & 0x0000FF00) >> 8);
	body[3] = ((sensor & 0x000000FF) >> 0);
	return Packet(dest,sender,PACKET_TYPE_NORM | PACKET_TYPE_SENSOR_SUBMISSION | PACKET_TYPE_REQUESTS_ACK, packetCounter,body,4);
}

static bool isSensorSubmissionPacket(uint8_t type, uint8_t packetLength){
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_SENSOR_SUBMISSION) && packetLength == 4;
}

static bool isRegistrationResponsePacket(uint8_t type, uint8_t packetLength){
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_REGISTRATION) && packetLength == 1;
}

static bool isRegistrationRequestPacket(uint8_t type, uint8_t packetLength) {
	return ((type & PACKET_TYPE_MASK) == PACKET_TYPE_REGISTRATION) && packetLength == 1;
}

static int response_result(uint8_t payload) {
	return payload & 3;
}
