---
tags: [udp-discovery Docs]
title: Client
---

# Client
1. ## Events:
- **internal events:**

  | event name         | trigger                                       | parameters                            |
  |--------------------|-----------------------------------------------|---------------------------------------|
  | tcp-data           | recieving tcp data from server                | data                                  |
  | tcp-end            | server ending tcp connection                  | no-parameters                         |
  | tcp-error          | error occuring in tcp client                  | error                                 |
  | tcp-connected      | connecting to tcp server                      | {localAdress, remoteAdress, name, id} |
  | connection-request | recieving ```__Connect``` from peer           | id, name                              |
  | udp-data           | reciving udp message with ```__Data``` header | stamp, sequence, data                 |
  
- **internal events:**
 
| event name    | emitted by(method)   | trigger                         | parameters               | handler
|---------------|----------------------|---------------------------------|--------------------------|----------------------
| #peer-echo    | Start                | recieving ```__Ping``` from peer| {id, name, address, port}| #discovery handler

2. ## Methods:

- *Public:*
  1. setVisible:
    tekes one argument (true/false) false makes the client invisible
    to servers hence it will not respond when recieving udp ```__Ping```
    message.
    Client is visible by default.
  
  2. Start
    the heart of this class, it listens to messages on a specific udp port
    if the header is "__Ping" it calls [discoveryHandler](#discoveryHandler).
     
     **Emited events**: ```connection-request```, ```udp-data```
       
  3. UdpSend:
  sends message to a specific address:port using the udp socket
  ```javascript
  UdpSend(message, Port, Address, onSendCallback)
  ```


  4. Connect to peer:
    takes an id, if this server is recognized it will try to connect to it using tcp,

      **Emited events**: ```tcp-connected```, ```tcp-data```, ```tcp-end```, ```tcp-error```


- *Private:* 
1. discoveryHandler:
    takes a massage with the header ```__Ping``` and sends ```__Echo```, if the sender is not recognized it will be added to alist of peers found on the network,
    granted
    the client is set to be visible.


