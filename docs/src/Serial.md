# Protocollo seriale

Qui viene descritto il protocollo seriale utilizzato da nodo centrale e raspberry per comunicare

## Handshake

Per iniziare a scambiarsi messaggi i due dispositivi devono connettersi tramite una fase di hadshake a tre vie. I tre passaggi sono (cliccare sui nomi per vederne il valore):

* Il nodo manda il messaggio [`HANDSHAKE_MESSAGE`](html/_serial_helpers_8h.html#af2b107897ec6379466d577636887dd77) al raspberry

* Il raspberry invia in risposta il messaggio [`HANDSHAKE_VALID_RESPONSE`](html/_serial_helpers_8h.html#a41cfa53e3d2208d45867791946525692) al nodo.

* Il nodo risponde con un messaggio di [`HANDSHAKE_END_MESSAGE`](html/_serial_helpers_8h.html#a60411330920102474867ae41d399e6eb) per terminare l'handshake.

Dato che, per ovvie ragioni, l'utente può chiudere e riaprire il programma di controllo sulla raspberry in qualsiasi momento, c'è bisogno che la raspberry possa inizializzare l'handshake. Per questo ad ogni avvio del programma di monitoraggio la raspberry invia al nodo un messaggio di [`HANDSHAKE_RESET`](html/_serial_helpers_8h.html#a89aebc7ab652f6641313788385c869a8).

La raspberry cercherà il nodo nelle prome 20 porte e si fermerà se non lo trova. Se si è completamente certi che il nodo sia collegato ma il programma non lo rileva, riavviare la raspberry. 

## Registrazione

Quando l'utente dà al programma di controllo l'input per iniziare la registrazione di nuovi dispositivi la raspberry invia al nodo il messaggio [`MESSAGE_TYPE_ENTER_REGISTRATION_MODE`](html/_serial_helpers_8h.html#a99579e65eeab14ee81e13cf673263848), al cui il nodo risponderà con lo stesso messaggio una volta che è pronto per iniziare la fase di registrazione.

Dopo che la raspberry ha ricevuto il messaggio di Ok dal nodo invia un pacchetto con header [`MESSAGE_TYPE_DEVICES_COUNT`](html/_serial_helpers_8h.html#ae2ce20aff2399a62ac34d4ef8d40a0d8) contenente il numero di dispositivi da registrare (valore inserito dall'utente).

A questo punto il nodo inizia la procedura di registrazione come descritta in [WorkingProtocol](WorkingProtocol.html). Durante questa fase il nodo invierà gli indirizzi temporanei dei nodi appena li riceve per verificare che non coincidano con altri già presenti nel database della raspberry. Per fare questo invia alla raspberry un pacchetto con header [`MESSAGE_TYPE_ID_CHECK_REQUEST_RESPONSE`](html/_serial_helpers_8h.html#ac2c4340003d1304446888ebd05f3c504), contenente l'indirizzo del dispositivo. Dopo aver controllato nel suo database se l'indirizzo è un duplicato la raspberry rispode con un messaggio con lo stesso header ma con payload [`MESSAGE_ID_VALID`](html/_serial_helpers_8h.html#a2cf28dfd8d82298695e6fc35b23d221d) se l'indirizzo non è duplicato, [`MESSAGE_ID_INVALID`](html/_serial_helpers_8h.html#aa8a621e1a90c21af0eac0087ec1ee57e) altrimenti.

Dopo che il nodo ha riempito la sua coda di dispositivi da registrare inizia uno stream verso la raspberry in cui invierà gli indirizzi di tutti i dispositivi ed il loro tipo. Ogni pacchetto di questo stream ha come header [`MESSAGE_TYPE_DEVICES_SUBMISSION`](html/_serial_helpers_8h.html#a251dda3cbcc1b5e35c461e46fff809c7). Per inizializzare lo stream il nodo invia il messaggio [`MESSAGE_DEVICES_STREAM_START`](html/_serial_helpers_8h.html#a8a434e0d5e9502abcd0bdd269a0af6fe), al quale la raspberry si prepara alla ricezione ma non risponde.

Dopodichè, per ogni dispositivo, il nodo lo notifica dell'accettazione del suo indirizzo poi invia un pacchetto alla raspberry contenente indirizzo e codice del tipo, come da database nella raspberry.

Quando il nodo termina la sua lista invia il messaggio [`MESSAGE_DEVICES_STREAM_END`](html/_serial_helpers_8h.html#a86cdfb354c21082bf33069b7e4385aed) alla raspberry per segnalare la chiusura dello stream.

## Funzione a regime

Durante il normale funzionamento ci sono tre possibili casi in cui i due dispositivi comunicano via seriale:

### Cambio del sensore assegnato ad un dispositivo:

Quandol'utente (tramite GUI) decice di cambiare il sensore assegnato ad un dispositivo il raspberry invia al nodo un messaggio con header [`MESSAGE_TYPE_SENSOR_SUBMISSION`](html/_serial_helpers_8h.html#ae13d7df292a5f4fec58baff7ebbec5df) contenente l'indirizzo del controllore e quello del nuovo sensore che deve ascoltare. Il nodo a questo punto invia l'informazione al controllore e comunica il risultato alla raspberry con un messaggio con [`MESSAGE_TYPE_SEND_RESULT`](html/_serial_helpers_8h.html#ac6ed920773b07537f61da599d432e006) come header e come body il risultato dell'operazione LoRa [`sendPacket`](html/_lo_ra_protocol_8h.html#a3eea7170df892d921ffcbbfe1788cdaf).

### Cambio del valore di luminosità di un controllore

Come sopra, solo che l'header del primo messaggio diventa [`MESSAGE_TYPE_LIGHT_VALUE_CHANGED`](html/_serial_helpers_8h.html#af04384d15b1b5d9fbe958609dc1e0887).

### Controllo dello stato

Come descritto in [WorkingProtocol](WorkingProtocol.html) ogni 10 minuti la raspberry scorre il suo database di dispositivi per verificarne lo stato. Per ogni dispositivo (tranne il nodo ovviamente) invia al nodo un messaggio contenente l'indirizzo del dispositivo e avente come header [`MESSAGE_TYPE_CHECK_SENSOR_STATUS`](html/_serial_helpers_8h.html#aa1bbc4e91c72a37d4c05d7536553f144) se il dispositivo è un sensore oppure [`MESSAGE_TYPE_CHECK_CONTROLLER_STATUS`](html/_serial_helpers_8h.html#a127fdcfc116c9366252705b060317f63) altrimenti.

Alla ricezione di questo messaggio il nodo contatta il dispositivo richiesto e invia il risultato alla raspberry utlizzando il pacchetto [`MESSAGE_TYPE_SEND_RESULT`](html/_serial_helpers_8h.html#ac6ed920773b07537f61da599d432e006) contenente il valore del dimmer per i controllori, il valore della fotoresistenza per i sensori oppure `-1` se il dispositivo non è raggiungibile.

## Aggiungere nuovi tipi di pacchetti

Per aggiungere un nuovo tipo di pacchetto basta aggiungere il valore dell'header tra le costanti di `libsrc/SerialHelpers.h`, creare nello stesso file una funzione del tipo `is...Message(char databuffer[], int buffer_size)` che determina se un messaggio seriale ricevuto è del nuovo tipo ed una funzione `send...Message(...)` che invierà il messaggio in seriale. 
Per rispondere alla ricezione di tale messaggio sarà sufficiente aggiungere nella funzione [`serialEnvent()`](https://www.arduino.cc/en/Reference/SerialEvent) nel proprio programma arduino il codice:

```c

    if(is...Message(serialMessage, serialMessageLength)){
        //do something
    }

```

Nel programma di gestione nella raspberry sarà invece sufficiente aggiungere un nuovo handler nel file `Raspberry-controller/src/serial/SerialHelpers.js` e connetterlo nella funzione `connectHandlers`.

Per poterlo ricevere aggiungere la funzione `is...Packet(data)` ed usarla nella funzione callPacketHandler inquesto modo:

```c
    if(is...Packet(data)){
        return ...Handler();
    }

``` 

 




