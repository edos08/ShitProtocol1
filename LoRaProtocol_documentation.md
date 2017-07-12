# LoRa protocol

Questo protocollo è stato creato per l'utilizzo all'interno di una rete LoRa per la comunicazione wireless tra vari dispositivi

Legenda:

I bit vengono considerati ordinati da sinistra a desta in questo modo:

>1 BYTE
         
| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |

Il bit 1 è il più significativo (128)

***

## Descrizione del formato del pacchetto

Il pacchetto è diviso in due parti:

* Header
* Payload

L'insieme di queste due parti non può superare i 255 byte.

### Header

L'header di un pacchetto LoRa è formato da 11 bytes:

 * 4 bytes per l'indirizzo del destinatario
 * 4 bytes per l'indirizzo del mittente
 * 1 byte per il tipo di messaggio
 * 1 byte per il numero di sequenza del pacchetto
 * 1 byte per la lunghezza del payload (par avere un leggero controllo d'integrità, considerare l'uso di un crc16 o 32)

Descrizione del byte riservato per il tipo di messaggio: 

 * bit 1  : indica se il pacchetto contiene un messaggio (bit settato a 1) oppure se è un messaggio ACK (bit settato a 0)
 * bit 2-6: riservati per usi futuri per indicare il tipo di messaggio (status report, comando, keep alive...)
 * bit 7-8: indicano il livello di QoS utilizzato: 0 = no ACK, 1 = ACK, 2 = ACK a tre passi
 
### Payload

Il payload del masseaggio varia a seconda del tipo di pacchetto scelto.

Per i pacchetti ACK il payload è vuoto ed il byte di lunghezza del payload deve essere settato a 0

I pacchetti non ack avranno un payload diverso a seconda del tipo spacificato dei bit 2-6 del campo tipo (Il loro formato non è ancora stato deciso)

***

## Documentazione tecnica della libreria LoRaProtocol

`class Packet`: rappresenta un pacchetto spedito od inviato tramite LoRa.    
Attributi:

* `dest` : il destinatario del pacchetto
* `sender` : il mittente del pacchetto
* `type` : il tipo di pacchetto
* `packetLenght`: la lunghezza del payload
* `packetNumber` : il numero di sequenza del pacchetto
* `body` : il payload del pacchetto

Metodi:

* `isAck()` : controlla se il pacchetto è un'ack
* `requestsAck()`: controlla se il pacchetto richiede un ack in risposta

***

`struct Helpers`: medodi helpers per scrivere interi a più bytes nel flusso in uscita e leggerli dal flusso in entrata

***

`Packet lastReceivedPacket` : contiene le informazioni sul pacchetto ricevuto    

`void initLoRa(int _myAddress, int csPin, int resetPin, int irqPin)` : inizializza la scheda LoRa sui pin dati ed imposta il proprio indirizzo per lo scambio di messaggio    

`int sendPacket(Packet packet)` : invia un pacchetto e ritorna: 1 se il pacchetto &egrave; stato inviato, 0 altrimenti    

`int sendPacketAck(Packet packet)` : invia un pacchetto aspettandosi un ACK di conferma. ritorna `SUCCESFUL_RESPONSE` in caso di successo, `HOST_UNREACHABLE` in caso di insuccesso dopo aver provato il reinvio per 3 volte    

`void activateReceiveMode()` : mette la scheda in modalità ascolto (da usare dopo ogni invio di pacchetto)

`void receivePacket(int packetSize)` : chiamata automaticamente quando un pacchetto viene ricevuto in modalità ascolto, risponde con un ack se necessario













