# Peer:
defines this peer's name and id, initialize udp and tcp socket to connect to other peers.

# Methods:
#### setters:
set all of these befor attempting to use Linker.
1. `_`eventBus:
set event bus for emmiting and handling events.
2. `_`keyStore:
set key store for encrypting/decrypt messages sent/recieved
3. `_`requests:
set requests to be able to connect to other peers, you cant establish connection without sending and recieving requests.
4. `_`Discovery:
set discovery in order to to get address:port of peers found on the network, without this you will be sailing blind.
5. `_`Linker:
set linker to connect to remote peers.

#### functions:
1. setVisible(visible):
make this node visible/invisible.
3. Start(port):
start listening for pings, send echos when pinged if visible, start a tcp server and get ready for requests, connections, data and files.

