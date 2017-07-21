# Documentazione relativa allo scambio di messaggi tra arduino e raspberry tramite porta seriale

* [LoRa](LoRaProtocol_documentation.html)
* [Registrazione](Registrazione.html)
* [Seriale](SerialProtocol.html)

## Sezione relativa all'Arduino

L'arduino può essere collegato tramite porta USB alla raspberry per la comunicazione ma sarebbe pù consigliato collegarlo tramite i canali RX e TX presenti sulla board sia dell'arduino che della raspberry. Qui si trova spiegato il procedimento:

[Collegare arduino a rasperry via seriale](https://gist.github.com/ajfisher/8880882)

Questo tutorial non usa la stessa libreria che utilizzo ma il concetto di base per l'hardware è lo stesso.

!!Attenzione!!

Collegandosi via seriale con il cavo USB con la scheda FEATHER M0 occorre utilizzare la seguente definizione

`#define Serial SERIAL_PORT_USBVIRTUAL`

Da notare anche che in questo caso la funzione `serialEvent()` non viene richiamata in automatico ma occorre utilizzare il seguente snippet all'interno della funzione `loop()`:

```c
if(serial.available())
    serialEvent()

```

Dove `serialEvent()` è la funzione in cui si gestisce la ricezione di un messaggio via seriale.

Non usare `Serial.println()` per scrivere sul seriale perchè fase le ricezioni sucessive. Utilizzare invece `Serial.print()` o `Serial.write()`.


## Sezione relativa alla Raspberry

La comunicazione seriale viene gestita da javascript da Node.js perchè semplice e perchè l'applicazione di monitoraggio verrà scritta in javascript/electron. La libreria utilizzata è questa: [Libreria seriale](https://github.com/EmergingTechnologyAdvisors/node-serialport).

Per entrambi la comunicazione seriale è gestita ad una frquenza di 9600 baud

## Protocollo di comunicazione

La raspberry attende che l'arduino le mandi un messaggio prima di iniziare la comunicazione. Tale messaggio di handshake è costituito da un singolo byte contenente il carattere 'H' (Hello), a cui la raspberry dovrà rispondere con un messaggio lungo 1 byte contenente il carattere 'W' (Welcome). A questo l'arduino dovrà rispondere con un messaggio lungo 1 byte contenente il carattere 'A' (accepted). Dopo questo passaggio di handshake i due componenti possono iniziare a comunicare.

! L'handshake va eseguito ogni volta che l'arduino viene riacceso

Ogni messaggio scambiato tra arduino e raspberry conterrà 1 byte di header ed un payload di lunghezza variabile, dipendente dal contenuto dell'header

## Comunicazione seriale durante la fase di Registrazione

Durante la fase di registrazione l'arduino dovrà comunicare alla raspberry gli ID nuovi arrivati, e la raspberry dovrà consultare il suo database per verificare che non siano duplicati. Lo scambio di messaggi in seriale avverà in questo modo:

* 0 Il raspberry invia all'arduino un pacchetto in cui gli comunica quanti dispositivi vuole connettere. Il formato di tale pacchetto è:

    |Header (1 byte)| Payload(1 byte)|
    |---------------|-----------------|
    | 0   |   N di dispositivi |

* 1 L'arduino riceve un nuovo ID
* 2 L'arduino controlla che non sia un duplicato delgi id degli altri arduini che stanno facendo la registrazione
    * 2.a Se questo passaggio viene superato senza trovare riscontri allora l'arduino invierà il seguente messaggio al raspberry:

        | Header (1 byte) | Payload (4 bytes) |
        |-----------------|-------------------|
        | 1               | ID                |  
    In cui 1 sta a significare 'PACCHETTO DI REGISTRAZIONE ID' e nel payload i 32 bytes di ID del dispositivo da registrare
    * 2.b Dopo aver fatto la query al mongoDB con il relativo ID la raspberry invierà il seguente pacchetto di risposta all'arduino:

        | Header (1 byte)| payload (1 byte)|
        |------|-------|
        |   1  |   RESPONSE |
    Dove RESPONSE avrà valore 0 se l'ID è valido, 1 se l'ID è già presente nel mongoDB.
* 3 Dopo aver completato la ricezione di tutti gli ID validi ed aver notificato i dispositivi del loro ID l'arduino invierà una serie di messaggi alla raspberry affichè memorizzi gli ID dei vari dispositivi nel proprio mongoDB. I messaggi della serie saranno così composti
    * 3.1 Messaggio di inizio invio degli ID:

        | Header (1 byte)| payload (1 byte)|
        |------|------|
        |   2  |   0  |
    In cui 2 sta a significare 'PACCHETTO DI CONFERMA ID'  e 0 sta a significare 'inizio trasmissione ID'
    * 3.2 Messaggi di conferma ID:

        | Header (1 byte) | payload (5 bytes) |
        |-----|-----|
        |  2  |  ID + tipo |
    In cui ID è l'ID del dispositivo e tipo è il tipo di dispositivo (sensore o lampada)
    * 3.3 Messaggo di  fine invio degli ID:

        | Header (1 byte) | payload (1 byte) |
        |-----|-----|
        |  2  |  255  |

* 4 Dopo questo passaggio la fase di registrazione può considerarsi terminata e si passa alla fasi di associazione dei dispositivi

In aggiunta il programma di monitoraggio può inviare pacchetti per resettare lo stato del nodo per ricominciare la comunicazione seriale (solo per il debug)

| Header (1 byte) | payload (0 byte) |
|-----|-----|
|  3  |  ---  |

### Tipi di dispositivo

| Codice | Tipo | Descrizione |
|------|--------|-----|
|  1   |  Nodo  | Dispositivo collegato alla raspeberry in seriale |
|  2   |  Controllore | Dispositivo che controlla la luminosità di una lampada |
|  3   |  Sensore | Sensore di luminosità |
