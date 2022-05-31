# Linker:
responsible for connecting / disconnecting peers with tcp and sending data to remote peers.

# Events:
#### Public:
`tcp-connected` : `{localAddress, remoteAddress, localPort, remotePort, name, id}`
when tcp connection is established with remote peer.
`tcp-data` : `{id, name, header}, data`
when data recieved from peer.
`tcp-end` :`id, name`
when tcp connection ends.
`tcp-error` :`id, error`
when tcp error eccurs
`tcp-data-sent` :
sending data chunck through TCP is complete
`udp-data-sent` :
sending data chunck  UDP is complete
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
set discovery in order to to get addressport of peers found on the network, without this you will be sailing blind.

#### function:
1. requestConnection(id, stamp):
send a connection request to discovered peer with `id`, encrypt request using key with `stamp`.
2. tcpConnect(id):
connect to peer with `id` using tcp, remote peer must have sent a request, if it did'nt this will fail.
3. tcpSend(id, stamp, json, header):
using TCP send `json` with `header (default:__Data)` to remote peer with `id` encrypted using key with `stamp`.
4. udpSend(id, stamp, json, header):
same as above but using UDP.
6. Kill(id):
disconnect from peer with `id`.
