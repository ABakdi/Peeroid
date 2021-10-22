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
| udp-data    |reciving udp message with ```__Data``` header                  | 
| found-peer  |discovery_handler gets new client                              | remote_peer
| peer-accept |recieving udp massage with ```__Accept``` hedar                | id, answer

- internal events (only acceceble inside this class)

| event name    | emitted by(method)   | trigger                         | parameters             | handler
|---------------|----------------------|---------------------------------|------------------------|----------------------
| #peer-echo    | UdpListen            | recieving ```__Echo``` from peer| id, name, address, port| #discovery handler

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
  this new implementation will encapsulate all tcp and udp and our own events into internal and external set of events to make everything easier.
  
  2. Start:
    binds udp socket and and listen on tcp/udp sockets
    This methods is the heart of this class.
    
    2.1. Events Emitted:
    ---->```tcp-close```
    ---->```tcp-error```

  3. UdpSend:
  sends message to a specific address:port using the udp socket
  ```javascript
  UdpSend(message, Port, Address, onSendCallback)
  ```
  4. UdpListen:
  This is "the brain" of the server
  this function listen for udp messages and act according to the the header of the message *See: [message Structure](#message structer) 
  *Emitted Events:*
  -----> ```#peer-echo``` 
  -----> ```peer-accept```

  5. Search:
  search for peers on a specific port 
  it broadcasts a udp ```__Ping``` message  periodically and listen for ```peer-echo``` Events that are fired by the ```UdpListen``` methdos when a peer returns an ```__Echo``` message
  **Emitted Events**:
  ----> ```found-peer```

  6. StopSearching:
    stops sending ```__Ping``` Signals



 ### 3. message structer:
```json
//example:
    message = {
      header: "__Data",
      body: {
          'stamp': 'PcvJKl',
          'sequence': 2,
          'data': "Chunk Of Data" 
      }
    }
```
|header         |body                            |
|---------------|--------------------------------|
| __Ping        |name, id, address, port         |
| __Echo        |name, id, address, port         |
| __Accept      |answer(yes/no), id              |
| __Data-struct |name, extension,stamp, length   |
| __Data        |stamp, sequence, data           |


