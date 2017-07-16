# Pacchetti di comunicazione della tipologia del dispositivo

* [LoRa](LoRaProtocol_documentation.html)
* [Registrazione](Registrazione.html)
* [Seriale](SerialProtocol.html)

Questi pacchetti hanno 1 byte di payload e richiedono un'ACK in risposta. Il contenuto del byte del payload è il seguente:

| Codice | Tipo | Descrizione |
|------|--------|-----|
|  1   |  Nodo  | Dispositivo collegato alla raspeberry in seriale |
|  2   |  Controllore | Dispositivo che controlla la luminosità di una lampada |
|  3   |  Sensore | Sensore di luminosità |

***

## Documentazione tecnica

`static Packet TypeSubmissionPacket(uint32_t dest, uint32_t sender, uint8_t device_type)`

Crea un pacchetto per l'invio dell'informazione sulla tipologia del dispositivo. Il campo `device_type` deve contenere uno dei seguenti valori contenuti in `RegistrationProtocol.h`:

* DEVICE_TYPE_SENSOR
* DEVICE_TYPE_NODE
* DEVICE_TYPE_CONTROLLER
