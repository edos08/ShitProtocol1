@echo off

REM For use in visual studio code 

pandoc -o doc/index.html doc/src/index.md --css src/github-pandoc.css
pandoc -o doc/ArduinoNano.html doc/src/ArduinoNano.md --css src/github-pandoc.css
pandoc -o doc/Packet.html doc/src/Packet.md --css src/github-pandoc.css
pandoc -o doc/API.html doc/src/API.md --css src/github-pandoc.css
pandoc -o doc/WorkingProtocol.html doc/src/WorkingProtocol.md --css src/github-pandoc.css
pandoc -o doc/Serial.html doc/src/Serial.md --css src/github-pandoc.css
pandoc -o doc/GettingStarted.html doc/src/GettingStarted.md --css src/github-pandoc.css
echo Build succeded
