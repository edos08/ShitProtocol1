@echo off
pandoc -o ../index.html index.md --css src/github-pandoc.css
pandoc -o ../ArduinoNano.html ArduinoNano.md --css src/github-pandoc.css
pandoc -o ../Packet.html Packet.md --css src/github-pandoc.css
pandoc -o ../API.html API.md --css src/github-pandoc.css
pandoc -o ../WorkingProtocol.html WorkingProtocol.md --css src/github-pandoc.css
pandoc -o ../Serial.html Serial.md --css src/github-pandoc.css
pandoc -o ../GettingStarted.html GettingStarted.md --css src/github-pandoc.css
echo Build succeded
