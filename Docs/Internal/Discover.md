# Discover:
this module is responsible for finding other peers on the network and make peers able to find each other.
it is also responsible for establishing a secure line of communication, doing a key exchange so messages can be encrypted.

##### how it works:
lets say we heve two peers on the same network p1 and p2.
p1 is sarching for peers.

- p1:    
	- generates public/private key pair.
	- broadcasts a *Ping* message along with its public key , id, and name.
- p2: 
	- recives a ping message with id, name, and public key of the sender.
	- generates a symmetric key.
	-  sends an *Echo* message encrypted with the sender's public key containing name id and key.
- p1:
	- recieves an encrypted echo message.
	- decrypts message with private key
	- extract key from echo message and saves it in its key store.

This way both p1 found p2 and they know each other's name and id and they both have the same key which is going to be used from now on.

## Events:
#### Private:
these events are internal to this module **do not tamper with these**, they are handled internally by Discover.
- `#peer-ping` : `address, port, message`
	when **ping** message is recieved.
- `#peer-echo` : `address, port, message`
	when **echo** message is recieved.
### Public:
`found-peer` : `id, name, address, port`
when a peer that has been pinged replyes with an echo and key exchange is complete.

## initialize:
- to make peer discovery on local network this class requires a udpsocket .
- it also requires key store to exchange keys between peers, and an event bus to capture and emmit events, befor starting discovery they need to be set using there setter.

```javascript
let bus = new eventBus()
let UdpSock = dgram.createSocket({type:'udp4', reuseAddr: true})
let ks = keyStore()

let dis = new Discover(udpSocket, id, name)

dis._eventBust = bus
dis._keyStore = ks

bus.on('found-peer', (id, name)=>{
	console.log(id, name)
	// log all found peers
	let peers = dis.foundPeers
	console.log(peers)
})

dis.SearchLocalNetwork(6062/*port*/)
```

## Methods:
#### getters:
1. foundPeers:
returns a list of id's and names of all peers that has been found so far

#### setters:
1. `_`eventBus(bus):
sets a global event bus for discover it will be used to emmit and handle private events (`#peer-ping`, `#peer-echo` ) and emmit the public `found-peer` event.
this event bus should also used by other part of peeroid to integrate all of theme together
3. `_`keyStore(store):
sets a global keyStore to enable key exchange.

#### functions:
1. setVisible(visible:`boolean`):
makes this node visible/invisible, if true it will reply to all ping messages with echo messages, if false ping will be ignored and no echo will be sent making this node invisible to all peers.

2. Ping(address, port):
sends ping message to address:port, calling it will generate a public/private key with a stamp the echo should reply with the same stamp.
   - Ping message structure:
   ```JSON
   {
	   header: '__Ping',
	   body: {
		   id: 'adf65b-bdcf-2358fff-cb',
		   name: 'Peer 1'
	   },
	   tail: {
		   stamp: '121564-998-656',
		   publicKey: 't0ry5116ju8f1b5e135bd1r5h48'
	   }
   }
```

3. Echo(ID, stamp, symkey, symKeyStamp, address, port):
sends and echo message to `address:port`, to make a secure commnication channel possible we should also generate a symmentric key with a stamp and send it inside the echo message ,the message will be encrypted using a key with `ID:stamp` "**it should be the same key sent in the ping message**" this way the two peers will have the same secrete key.
   - Echo message structure:
   ```JSON
   // body will be encrypted with `ID:stamp` key
   {
	   header: '__Echo',
	   body: {
		   id: 'fff-ddd-eee-0acdfb',
		   name: 'Peer 2',
		   key: '56gr4897ea46g43rzg16t1',
		   stamp: 'g5t4g5e4t84'
	   },
	   tail: {
		   stamp: '121564-998-656',
	   }
   }
```

4. getFound/getFoundME:
utility functions all return json containing name and id a peer depending on parameters.
found: remote peers that replyed with echo when pinged.
foundME: replyed with echo when remote ping recived 
**here is a list:**
	1. getFoundPeerById(id).
	2. getFoundPeerByAddress(address, port).
	3. getFoundMEPeerById(id).
	4. getFoundMEPeerByAddress(address, port).
	5. getFoundPeerByName(name).

5. SearchLocalNetwork(portList, networkInterface = "wlp3s0", bursts = 10, interval = 2):
send a *burst* of pings, to *portList* using a specific *network interface* wait an *interval* between pings.



