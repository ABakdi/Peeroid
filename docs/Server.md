---
tags: [udp-discovery Docs]
title: Server
created: '2021-10-16T23:30:23.810Z'
modified: '2021-10-17T20:38:03.392Z'
---

# Server

### 1. Events: 
- external events(the user can acces them directly):

|event name |handler                |current callback with parameters
|-----------|-----------------------|--------------------------------
|tcp-data   |onTcpDataCallback      |
|tcp-end    |onEndCallback          |
|tcp-close  |onServerCloseCallback  |
|tcp-error  |onServerErrorCallbak   |
|tcp-client |onNewTcpClientcallback |
|udp-data   |onUdpDataCallBack      |
|found-peer |onNewPeerFound         |

- internal events (only acceceble inside this class)

| event name    | emitted by(method)   |trigger                          |
|---------------|----------------------|---------------------------------|
| #peer-echo    | UdpListen            | recieving ```__Echo``` from peer| 

#### how the server class suppose to work:
```javascript
import Server from 'Server'
const server = new Server(name)
server.addEventListner('found-peer', function(peer){
  console.log(peer)
})
//addEvent listener can use any of the events above
```

### 2. Methods:
#### 2.1. Public:
  1. ~~get ServerRef~~:
      returns an object containing a refrence to udpSocket and tcpSocket
      
  ```json
    {
      "UdpServer": this.UdpServer,
      "TcpServer": this.TcpServer
    }
  ``` 

  2. *~~setSomeEventHandler~~:
    a set of methods that are used to assing callbackfunction for a specific tcp or udp events 
    **Replaced with**:
        ```Server.addEventListener('SomeEvent', callback)```
        this new implementation will encapsulate all tcp and udp and our own events into internal and external set of events to make everything easier.
  
  3. Start:
    binds udp socket and and listen on tcp/udp sockets
    This methods is the heart of this class.
    <br/>
    3. 1. Events Emitted:
    ---->```tcp-close```
    ---->```tcp-error```

  4. UdpSend:
  sends message to a specific address:port using the udp socket
  ```javascript
  UdpSend(message, Port, Address, onSendCallback)
  ```
  5. UdpListen:
  This is "the brain" of the server
  this function listen for udp messages and act according to the the header of the message *See: [message Structure](message structer) 
  *Emitted Events:*
  -----> ```#peer-echo```
  -----> ```peer-accept```

  6. Search:
  search for peers on a specific port 
  it broadcasts a udp ```__Ping``` message  periodically and listen for ```peer-echo``` Events that are fired by the ```UdpListen``` methdos when a peer returns an ```__Echo``` message
  **Emitted Events**:
  ----> ```found-peer```

  7. StopSearching:
    stops sending '__Ping



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
|Header         |body                            |
|---------------|--------------------------------|
| __Ping        |name, id, address, port         |
| __Echo        |name, id, address, port         |
| __Accept      |answer(yes/no)                  |
| __Data-struct |name, extension,stamp, length   |
| __Data        |stamp, sequence, data           |


