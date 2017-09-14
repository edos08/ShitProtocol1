# Getting started

Qui viene descritto come fare il setup dei componenti per iniziare a lavorare al progetto.

## Hardware necessario:

* Un pc
* Una raspberry con sistema operativo raspbian (con GUI) installato
* Almeno tre microcontrollori (con la configurazione attuale uno deve essere una feather M0 con chip lora integrato)
* Almeno due chip LoRa sx1276
* Cavetti
* Almeno una fotoresisteza
* Almeno un led

## Software necessario

### PC:

Controllare di avere installato l'ultima versione dell'IDE [Arduino](https://www.arduino.cc/en/Main/Software). Seguire [questa guida](https://learn.adafruit.com/adafruit-feather-m0-basic-proto/setup) per utilizzare il featherM0 con l'IDE di arduino.

Avere almeno un buon text editor (come [Visual Studio Code](https://code.visualstudio.com/download) o [Atom](https://flight-manual.atom.io/getting-started/sections/installing-atom/))

Scaricare la repository del progetto da [github](https://github.com/edos08/ShitProtocol1)

### Raspberry:

Scaricare la repository del progetto da [github](https://github.com/edos08/ShitProtocol1)

Scaricare [postgresql](https://www.postgresql.org/download/) e creare un nuovo server locale `LoRa` con un database `LoRaServices` contenente uno schema `LoRa` con dentro le tabelle come descritte alla fine di [WorkingProtocol](WorkingProtocol.html) 

Assicurarsi di avere installate le versioni aggiornate di `npm` e `NodeJS`  

`Electron` il framework utilizzato per la realizzazione dell'interfaccia grafica si porta una propria versione di `NodeJS`. La libreria `serialport` deve essere compilata in riferimento alla versione di Electron utilizzata. Al momento la versione di Electron usata è la `1.6.11`. Il modulo `serialport` viene adeguato alla versione di Electron nella riga `8` del `package.json`:

```json
	"install": "node-pre-gyp install --fallback-to-build --runtime=electron --target=1.6.11 --directory=node_modules/serialport/ --update-binary --dist-url=https://atom.io/download/atom-shell"
``` 

dove su `target` va messa la versione di electron installata sulla macchina. Se all'avvio dell'applicazione si vede un errore di compilazione per `serialport` controllare che la versione su `target` sia la stessa della versione di electron Installata.

L'ultima versione di Electron disponibile al momento è la `1.7.6` ma è molto, *molto* più lenta della `1.6.11` nella raspberry. 

Navigare fino alla cartella del progetto e da li nella cartella `Raspberry-controller`. Da li digitare il comando `npm install` che provvederà ad installare tutte le dependecies di cui il progetto ha bisogno.  

Per qualche motivo `bootstrap` alla versione 4 non viene installato correttamente, in quanto viene installata la versione beta e non la alpha. Per visualizzare correttamente l'interfaccia grafica eseguire questo comando all'interno di `Raspberry controller`:

```bash
	npm install bootstrap@4.0.0-alpha.6
```


### Dispositivi:

Nodo (fetaherM0): caricare il codice di `startup_node`

Controllore (microcontrollore con led collegato sul pin D6): caricare il codice di `startup_controller`

Sensore (microcontrollore con fotoresistore collegato sul pin A0): caricare il codice di `startup_sensor`

## Wiring

Collegare via usb il nodo alla raspberry e tutti gli altri microcontrollori alla corrente

## Utilizzo

Modificare il codice dal proprio PC, fare il commit dei cambiamenti e fare il pull della directory sulla raspberry.

Dopo aver modificato le librerie in `libsrc` copiare i file contenuti in tale cartella nella cartella delle librerie di arduino del dispositivo da cui si carica lo sketch.

Per avviare il programma di controllo dalla raspberry spostarsi in `Raspberry-controller` da linea di comando e digitare `npm start`.

