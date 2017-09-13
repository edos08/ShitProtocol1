@echo off

REM For use in visual studio code 

pandoc -o doc/index.html doc/src/index.md --template GitHub.html5
pandoc -o doc/ArduinoNano.html doc/src/ArduinoNano.md --template GitHub.html5 
pandoc -o doc/Packet.html doc/src/Packet.md --template GitHub.html5
pandoc -o doc/API.html doc/src/API.md --template GitHub.html5 
pandoc -o doc/WorkingProtocol.html doc/src/WorkingProtocol.md --template GitHub.html5
pandoc -o doc/Serial.html doc/src/Serial.md --template GitHub.html5
pandoc -o doc/GettingStarted.html doc/src/GettingStarted.md --template GitHub.html5
echo Build succeded
