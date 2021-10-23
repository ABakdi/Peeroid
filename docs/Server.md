---
tags: [udp-discovery Docs]
title: Server
---

# Server

### 1. Events: 
- external events(can be set with addEventListener method):

| event name  | Trigger                                                       |parameters
|-------------|---------------------------------------------------------------|--------------------------------
| tcp-data    |reciving tcp data                                              | data
| tcp-end     |client ending tcp connection                                   | no-parameters
| tcp-close   |client closing tcp connection                                  | no-parameters
| tcp-error   |error occuring in tcp server                                   | error
| tcp-client  |new tcp client connected                                       | tcp_client
| udp-data    |reciving udp message with ```__Data``` header                  | stamp, sequence, data
| found-peer  |discovery_handler gets new client                              | remote_peer
| peer-accept |recieving udp massage with ```__Accept``` hedar                | id, answer

- internal events (only acceceble inside this class)

| event name    | emitted by(method)   | trigger                         | parameters                | handler
|---------------|----------------------|---------------------------------|---------------------------|----------------------
| #peer-echo    | UdpListen            | recieving ```__Echo``` from peer| {id, name, address, port} | #discovery handler

#### how the server class suppose to work:
```javascript
import Server from 'Server'
import EventEmitter from 'events'
const EventBus = new EventEmitter()

const server = new Server('name', 'id', EventBus)

server.addEventListner('found-peer', function(peer){
  console.log(peer)
})

//addEvent listener can use any of the events above
```

### 2. Methods:
#### 2.1. Public:
  1. addEventListener:
  ```javascript
  Server.addEventListener('SomeEvent', callback)
  ```
  this implementation will encapsulate all tcp and udp and our own events into internal and external set of events to make everything easier.
  
  2. Start:<br/>
  binds udp socket and and listen on tcp/udp sockets This methods is the heart of this class.
  **Events Emitted**: ```tcp-close```, ```tcp-error```

  3. UdpSend:<br/>
  sends message to a specific address:port using the udp socket
  ```javascript
  UdpSend(message, Port, Address, onSendCallback)
  ```
  4. UdpListen:<br/>
  This is "the brain" of the server this function listen for udp messages and act according to the the header of the message See: [message Structure](#message structer).<br/>
  **Emitted Events**: ```#peer-echo```, ```peer-accept```, ```udp-data```

  5. Search:<br/>
  search for peers on a specific port 
  it broadcasts a udp ```__Ping``` message  periodically,```#peer-echo``` Events that are fired by the ```UdpListen``` methdos when a peer returns an```__Echo``` message are handled by [discoveryHandler](#discoveryHandler).<br/>
  **Emitted Events**: ```found-peer```

  6. StopSearching:<br/>
    stops sending ```__Ping``` Signals
    
  7. getClientByAddress:<br/>
    returns an object containing the relevant information about client given its ip address and port if there is a client with the same adress and port
    in FoundPeers list, Its used to check if a given client has been found by searching.
  
  8. getClientById:<br/>
  does the same as [getClientByAddress](#getClientByAddress) but uses Id.
  
  9. ConnectToPeer:<br/>
  sends ```__Connect``` to client and client will send ```__Accept``` if yes client will connect to server using tcp

#### 2.2 Private:
  1. discoveryHandler:<br/>
    handels ```#peer-echo``` enternal event if the client sending the echo message hasnt been encountred befor it will be added to foundPeers list. 
    
### 3. message structer:
```json
//example:
    message = {
      header: "__Data",
      body: {
          'stamp': 'PcvJKl',// uuid4 will work perfectly
          'sequence': 2,
          'data': "Chunk Of Data" 
      }
    }
```
| header             | body                              | protocol |
|--------------------|-----------------------------------|----------|
| __Ping             | name, id, address, port           | udp      |
| __Echo             | name, id, address, port           | udp      |
| __Accept           | answer(yes/no), id                | udp      |
| __Data-structer    | name, extension,stamp, key,length | tcp      |
| __Fragment-request | stamp, sequence, key              | tcp      |
| __Data             | stamp, key, sequence, data        | udp      |


