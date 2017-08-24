#include <stdint.h>
#include "LoRa.h"
#include <SPI.h>


#define PACKET_TYPE_MASK 124

#define PACKET_TYPE_ACK 0
#define PACKET_TYPE_NORM 128
#define PACKET_TYPE_REQUESTS_ACK 1
#define PACKET_TYPE_REGISTRATION 4
#define PACKET_TYPE_SENSOR_SUBMISSION 8
#define PACKET_TYPE_SENSOR_VALUE 12
#define PACKET_TYPE_LIGHT_VALUE_CHANGED 16
#define PACKET_TYPE_PING 20

#define QOS_REQUEST_ACK 1

#define PACKET_SENDING_ERROR 0
#define SUCCESFUL_RESPONSE 1
#define HOST_UNREACHABLE_RESPONSE 2

#define ACK_WAITING_MILLIS 200

#define BROADCAST 0x0


//Class packet
class Packet{
    public:
     uint32_t dest;
     uint32_t sender;
     uint8_t type;
     uint8_t packetNumber;
     char body[245];
     int packetLength;
     Packet(uint32_t _dest, uint32_t _sender, uint8_t _type, uint8_t _packetNumber, char* _body, int _packetLength){
         dest = _dest;
         sender = _sender;
         type = _type;
         packetNumber = _packetNumber;
         for(int a = 0; a < _packetLength; a++)
            body[a] = _body[a];
         packetLength = _packetLength;
     }
     Packet(){
        dest = -1; sender = 0; type = -1; packetNumber = -1; packetLength = 0;
     }

    bool operator == ( const Packet &rhs) {
            if(packetLength != rhs.packetLength)
                return false;
            for(int a = 0; a < packetLength; a++)
                if(body[a] != rhs.body[a])
                    return false;

            return dest == rhs.dest && sender == rhs.sender && type == rhs.type && packetNumber == rhs.packetNumber;
    }

	bool isAck() {
		return (type & 128) == PACKET_TYPE_ACK;
	}

	bool requestsAck() {
		return (type & 3) == QOS_REQUEST_ACK;
	}

    bool operator != (const Packet& rhs){return !(*this == rhs);}

	bool isUninitialized(){
		return dest == -1;
	}
};


//Struct helpers
typedef struct Helpers {
	static uint32_t read32bitInt(uint8_t bytes[]) {
		int shifter = 24;
		uint32_t result = 0;
		for (int a = 0; a < 4; a++) {
			result |= (((uint32_t)bytes[a]) << shifter);
			shifter -= 8;
		}
		return result;
	}

	static void write32bitIntToPacket(uint32_t value) {
		LoRa.write((value & 0xFF000000) >> 24);
		LoRa.write((value & 0x00FF0000) >> 16);
		LoRa.write((value & 0x0000FF00) >> 8);
		LoRa.write(value & 0x000000FF);
	}

	static void read4BytesInto(uint8_t buffer[]) {
		for (int a = 0; a < 4; a++)
			buffer[a] = LoRa.read();
	}

	static void printResponseMessage(int response_code) {
		switch (response_code) {
		case PACKET_SENDING_ERROR:
			Serial.println("There was an error sending the message");
			break;
		case HOST_UNREACHABLE_RESPONSE:
			Serial.println("Host is unreachable, it could be powered off or broken");
			break;
		case SUCCESFUL_RESPONSE:
			Serial.println("Operation completed succesfully");
			break;
		default:
			Serial.println("Unknown response code");
				break;
		}
	}

	static Packet readInputPacket() {
		Packet result = Packet();
		uint8_t buffer[4];
		read4BytesInto(buffer);
		result.dest = read32bitInt(buffer);
		read4BytesInto(buffer);
		result.sender = read32bitInt(buffer);
		result.type = (uint8_t)LoRa.read();
		result.packetNumber = (uint8_t)LoRa.read();
		result.packetLength = (uint8_t)LoRa.read();
		return result;
	}

}Helpers;

typedef struct hasReceivedAckHolder {
	bool hasAck = false;
	Packet ack = Packet();
}AckHolder;


//to pass funtions around for subscriptions
typedef void(*functionCall)(Packet arg);

//exposed variables
extern uint8_t packetCounter;
extern functionCall subscribedFunction;

//exposed functions
void initLoRa(uint32_t _myAddress, int csPin, int resetPin, int irqPin);

void checkIncoming();

int sendPacket(Packet packet);

void receivePacket(int packetSize);

void changeAddress(uint32_t newAddress);

//subscribe to received packet event

void subscribeToReceivePacketEvent(functionCall function);

//Packet factory
static Packet MessagePacket(uint32_t dest, uint32_t sender, char body[], uint8_t packetLength) {
	return Packet(dest, sender, PACKET_TYPE_NORM, packetCounter, body, packetLength);
}

static Packet MessageAckPacket(uint32_t dest, uint32_t sender, char body[], uint8_t packetLength) {
	return Packet(dest, sender, PACKET_TYPE_NORM | PACKET_TYPE_REQUESTS_ACK, packetCounter, body, packetLength);
}

static Packet AckPacket(uint32_t dest, uint32_t sender, uint8_t reponsePacketNumber) {
	return Packet(dest, sender, PACKET_TYPE_ACK, reponsePacketNumber, "", 0);
}
