#include <stdint.h>    
#include "LoRa.h"
#include <SPI.h>

#define PACKET_TYPE_ACK 0
#define PACKET_TYPE_NORM 128
#define PACKET_TYPE_REQUESTS_ACK 1 

#define QOS_REQUEST_ACK 1

#define PACKET_SENDING_ERROR 0
#define SUCCESFUL_RESPONSE 1
#define HOST_UNREACHABLE_RESPONSE 2



class Packet{
    public:
     uint32_t dest;
     uint32_t sender;
     uint8_t type;
     uint8_t packetNumber;
     char body[245];
     int packetLenght;
     Packet(uint32_t _dest, uint32_t _sender, uint8_t _type, uint8_t _packetNumber, char* _body, int _packetLenght){
         dest = _dest;
         sender = _sender;
         type = _type;
         packetNumber = _packetNumber;
         for(int a = 0; a < _packetLenght; a++)
            body[a] = _body[a];
         packetLenght = _packetLenght;
     }
     Packet(){
        dest = 0; sender = 0; type = -1; packetNumber = -1; packetLenght = 0;
     }

    bool operator == ( const Packet &rhs) {
            if(packetLenght != rhs.packetLenght)
                return false;
            for(int a = 0; a < packetLenght; a++)
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
};

typedef struct Helpers {
	static uint32_t read32bitInt(byte[] bytes) {
		int shifter = 24;
		uint32_t result = 0;
		for (int a = 0; a < 4; a++) {
			result |= (bytes[a] << shifter);
			shifter -= 8;
		}
		return result;
	}

	static void write32bitIntToPacket(uint32_t value) {
		LoRa.write(value & 0xFF000000);
		LoRa.write(value & 0x00FF0000);
		LoRa.write(value & 0x0000FF00);
		LoRa.write(value & 0x000000FF);
	}

}Helpers;

extern Packet lastReceivedPacket;

void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin);
void activateReceiveMode();

int sendPacket(Packet packet);
void receivePacket(int packetSize);


uint32_t read32bitInt(uint8_t byte1, uint8_t byte2, uint8_t byte3, uint8_t byte4);






