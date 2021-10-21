---
tags: [udp-discovery Docs]
title: Client
created: '2021-10-16T23:30:35.294Z'
modified: '2021-10-18T01:40:49.913Z'
---

# Client
1. ## Events:
- **internal events:**

  |event name              |current handler           |
  |------------------------|--------------------------|
  | tcp-data               | onTcpDataCallback        |
  | tcp-end                | onTcpEndCallback         |
  | tcp-error              | oTcpEndCallback          |
  | tcp-connected          | onNewTcpConnection       |
  | connection-request     | onTcpConnectionRequest   |
  
- **internal events:**

2. ## Methods:

- *Public:*
  1. setVisible:
    tekes one argument (true/false) false makes the client invisible
    to servers hence it will not respond when recieving udp ```__Ping```
    message.
    Client is visible by default.
  
  2. discoveryHandler:
    takes a massage with the header "__Ping" and sends "__Echo", if the sender is not recognized it will be added to alist of peers found on the network, granted the client is set to be visible.

  3. Start
    the heart of this class, it listens to messages on a specific udp port
    if the header is "__Ping" it calls [discoveryhandler](#).
     
     Emited events:
      -----> ```connection-request```
      

  4. ~~setSomeEventHandler~~:
    takes a callback that is going to ba called when some event is emmited.

  5. Connect to peer:
    takes an id, if this server is recognized it will try to connect to it using tcp,

      Emited events:
      -----> ```tcp-connected```
      -----> ```tcp-data```
      -----> ```tcp-end```
      -----> ```tcp-error```


- *Private:*
