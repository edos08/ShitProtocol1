# Funzionamento del sistema a lampade e sensori

## Sistemistica

Il sistema è diviso in 4 elementi:

- computer centrale(raspberry)
- nodo centrale (arduino)
- controllore (arduino), alias lampada
- sensore (arduino)

Ogni arduino è connesso ad un chip LoRa.

Il computer centrale è un raspberry in cui è installato il programma `Raspberry controller` presente nell'omonima cartella in questa repository. Il computer centrale oltre all'interfaccia utente contiene anche un database Postgres, le cui tabelle sono descritte a fine pagina.

Al computer centrale è collegato il nodo centrale via seriale. Il nodo centrale ha installato il programma `startup_node` presente in questa repository. Il nodo centrale fa da antenna LoRa per il computer, ricevendo i segnali dagli altri dispositivi e inviando i comandi trasmessi dal computer centrale.

I controllori hanno installato il programma `startup_controller` presente in questa repository. Sono collegati ad un LED (od una lampada) e aggiustano il valore di luminosità in base ai dati che ricevono dai sensori. Il computer centrale assegna ad ogni controllore un sensore e li notifica della scelta. I controllori non inviano mai pacchetti se non durante la fase di registrazione o, altrimenti, solo quando vengono interpellati dal computer centrale nelle modalità che verranno spiegate in seguito.

I sensori hanno installato il programma `startup_sensor` presente in questa repository. Sono collegati ad una fotoresistenza e trasmettono il valore letto dalla fotoresistenza ongi 3 secondi.

## Registrazione

I dispositivi alla loro prima accensione non hanno un indirizzo univoco e quindi devono registrarne uno casuale al raspberry centrale. Solo il nodo centrale ha già un indirizzo ed è `0xFFFFFFFF`.

La modalità di registrazione degli ID dei dispositivi è questa:

* Un numero `X` di dispositivi viene acceso e rileva di non avere un indirizzo salvato nella memoria. A questo punto ne calcolano uno secondo un algoritmo pseudocasuale ed iniziano ad inviare al nodo centrale pacchetti che contengono il loro indirizzo ed il loro tipo. I pacchetti vengono reinviati ogni 8 secondi + un tempo tra 0.5 e 1.5 secondi (per cercare di limitare collisioni).

* Il computer centrale (tramite maschera GUI) comunica al nodo centrale che vuole connettere `Y` dispositivi, con `Y` minore o uguale al numero `X` di dispositivi che attendono di essere registrati. 

* Il nodo centrale si mette in ascolto di pacchetti di registrazione. Ogni volta che riceve un pacchetto ne legge l'indirizzo di provenienza e controlla che non coincida con quello di un altro dispositivo che sta cercando di collegarsi. Se supera questo test invia l'indirizzo al computer centrale che controlla che non coincida con un indirizzo già presente nel suo database.Se supera entrambi i test il nodo salva le informazioni del dispositivo in una coda e continua a ricevere altri pacchetti di registrazione. Se invece non supera uno dei due test il nodo invia un pacchetto a quell'indirizzo chiedendogli di cambiare il proprio indirizzo.

* Il nodo continua a ricevere pacchetti di registrazione finchè non ha `Y` dispositivi nella sua coda interna e a quel punto ingnora tutti i pacchetti di registrazione sucessivi ed inizia uno stream di invio informazioni dei dispositivi con il computer centrale.

* Per ogni elemento che deve essere registrato invia all'indirizzo dell'elemento un messaggio di accettazione dell'indirizzo che deve ricevere un riscontro ACK. Se il riscontro ACK non viene ricevuto il nodo riprova ad inviare il messaggio di accettazione altre 2 volte, e se non riceve ancora ACK allora considera il dispositivo come irraggiungibile e passa al successivo. L'utente verrà notificato se il numero dei dispositivi registrati è minore del numero di dispositivi richiesti. Il computer centrale salva ogni elemento ricevuto nel database e poi richiede all'utente di rinominare i vari dispositivi ed assegnarli a delle stanze (che esistono solo virtualmente nel computer).

* Per ogni controllore ricevuto il computer centrale chiede inoltre all'utente di assegnare un sensore che dovrà ascoltare per regolare la propria luminosità.

## Funzione a regime

I controllori sono sempre in ricezione e possono ricevere 4 tipi di pacchetti:

* Pacchetti dal sensore con il valore letto dalla fotoresistenza
* Pacchetti dal nodo contenenti l'indirizzo del sensore da ascoltare (può essere cambiato a piacimento dall'utente)
* Pacchetti dal nodo contenenti il valore di luminosità medio da mantenere (piò essere cambiato a piacimento dall'utente)
* Pacchetti di ping dal nodo per controllarne lo stato.

Il computer centrale periodicamente (ogni 10 minuti) scorre la lista dei dispositivi che ha nel database e richiede al nodo centrale di controllare lo stato dei dispositivi.

* Se il dispositivo da controllare è un sensore il nodo resta in attesa per 15 secondi (5 x intervallo di trasmissione dei pacchetti dei sensori) di ricevere un pacchetto dal sensore contenente il valore letto dalla fotoresistenza. Se lo riceve invia al computer centrale un pacchetto contenente il valore letto, altrimenti invia un pacchetto contenente `-1` che poi nel database comparirà come il maggior numero positivo in 32 bit (circa `65k`). Dato che il massimo valore letto dalla fotoresistenza è 1023 è facile distinguere un dispositivo funzionante da uno che non risponde.

* Se il dispositivo da controllare è un controllore il nodo prova per tre volte ad intervalli di 6 secondi ad inviare un pacchetto di ping al dispositivo. Il dispositivo risponde al ping con il valore del dimmer luminoso in quel momento (da 0 a 1000). Se il dispositivo non risponde il messaggio inviato al computer centrale è come quello per il sensore, altrimenti invia il valore del dimmer.

I dati raccolti da questi scan periodici vengono loggati in una tabella nel database del computer centrale.

I sensori inviano ogni 3 secondi il valore della loro fotoresistenza in broadcast. 

I controllori ogni 5 secondi aggiustano il loro dimmer interno in modo che il valore che il loro sensore legge dal fotoresistore sia pari al valore di luminosità impostato dall'utente attraverso la GUI. 

## Struttura del database

Il database contenuto nel computer centrale è un database postgres relazionale.

###Schema logico-relazionale

```
	Device_types(ID(PK), Description)
```
```
	Devices(ID(PK), Type(FK), Room(FK), Description, Address, Sensor(FK), LightValue)
```
```
	Rooms(ID(PK), Description)
```
```
	Status_log(ID(PK), Time, Value, Device(FK))
```
`Device_types` contiene i valori delle diverse tipologie di dispositivi presenti. Al momento i valori sono:

* 1 - Node
* 2 - Controller
* 3 - Sensor

`Rooms` contiene le informazioni sulle stanze inserite dagli utenti nel formato ID - Descrizione. L'ID è autoincrementante.

* Es: 3 - Cucina

`Devices` contiene le informazioni sui vari device.

* `ID`: identificativo univoco autoincrementante
* `Type`: chiave esterna sulla tabella `Device_types`
* `Room`: chiave esterna sulla tabella `Rooms`
* `Description`: il nome assegnato al dispositivo dall'utente
* `Address`: L'indirizzo LoRa del dispositivo
* `Sensor`: Chiave esterna sulla tabella `Devices`. Se `Type` è `1` o `3` il campo deve essere `NULL`, altrimenti può essere `NULL` o contenere l'`ID` di un elemento della tabella `Devices` con `Type = 2`
* `LightValue`: ultimo valore di luminosità assegnato ad un controllore. Se `Type` è `1` o `3` questo campo resterà sempre a `300` (Default). 

`Status_log` contiene le informazioni sullo stato dei dispositivi nel tempo.

* `ID` identificativo univoco autoincrementante
* `Time` Il timestamp del momento in cui è stato fatto il controllo
* `Value` Il valore del dispositivo al momento del controllo (valore del dimmer del controllore oppure della fotoresistenza del sensore. Vale `65k` se il dispositivo non è raggiungibile)
* `Device` il dispositivo controllato. Chiave esterna sulla tabella `Devices`