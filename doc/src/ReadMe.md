# Giude for the content of this directory:

* doc: contains the documentation for the LoRa Project, read it before reading and modifying the code
* libsrc: contains the ardiuni library files needed to make the communication between the devices work. Everything is explained in the documentation
* Serial-communication: contains the Node.js app with the startup code for the raspberry and an arduino test client. The code in the test should be added to the startup arduino sketches. The javascript server is already ready for use
* startup: contains the startup registration code for the devices
* startup_node: contains the startup registration code for the node wired in serial to the raspberry

## RASPBERRY:
 scaricare la repository:

 ```
sudo git clone --depth=1 https://github.com/edos08/ShitProtocol1        
 ```

 copiare il contenuto di `ShitProtocol1/libsrc` in /opt/arduino-1.8.3/libraries/LoRa


# TODO

| Descrizione | Implementato | Testato |
|-------------|--------------|---------|
| Integrare il codice dello startup del nodo con la comunicazione seriale verso la raspberry | v | v |  
| Effettuare il test della registrazione + comunicazione seriale | v | v |
| Decidere che DBMS utilizzare nella rasperry (da tenere conto la semplicità di utilizzo dall'interno dell'ambiente Node.js). Propongo PostreSQL a cui è possibile accedere tramite il modulo Knex scaricabile con `npm install Knex`. MongoDB è più complicato da utilizzare all'interno dell'ambiente node.js in quanto non ho trovato moduli pronti per l'accesso diretto e completo al database. Le chiamate rest non permettono di compiere tutte le operazioni volute (`INSERT`). | v | v |
| Rivedere il protocollo di handshake seriale tra raspberry e arduino in caso di terminazione del programma di monitoraggio da raspberry | x | x |
| Mettere a punto l'idea per il funzionamento del sistema a regime | x | x |
| Sviluppare l'interfaccia grafica dell'applicazione tramite modulo `electron` scaricabile da `npm` in HTML-CSS | x | x |
| Mettere a punto le idee per l'assegnazione dei dispositivi alla stanza | x | x |
| Sviluppare una suite di test | x | x |
