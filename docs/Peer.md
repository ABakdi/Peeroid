---
title: Peer
created: '2021-10-21T14:41:17.881Z'
modified: '2021-10-21T16:41:22.327Z'
---

# Peer
  This class is a wraper for server and client classes, it abstracts away the inner workings and exposes the importent functionality and events.

  ## Events: 
- external events(the user can acces them directly):

| event name             | condition for emmition   |
|------------------------|--------------------------|
| tcp-data               |                          |
| tcp-end                |                          |
| tcp-close              |                          |
| tcp-error              |                          |
| tcp-client             |                          |
| udp-data               |                          |
| found-peer             |                          |
| tcp-connected          |                          |
| connection-request     |                          |
  

## Properties: 
1. ### private properties:
  - id: uuid4
  - name: string
2. ### public Properties

## Methods:

1. ### Private Methods:

2. ### Public Methods:
    1. Seach:
      search for other peers on the same nework given some port
      ```javascript
          Peer.Search(port)
      ```           
      every time a peer is found it emmits an event ```found-peer```

    2. Connect:
      connect to a remote peer using tcp given the remote id
      ```javascript
        Peer.Connect(id)
      ```
    
    3. Send
      sends data to connected peer given the data and peer's id
      data is a generator object, see: [Data class](./Data.md).
      this function send all data encrypted using Udp, and uses tcp for key exchange and reliability.
      ```javascript
      const data = Data.from_file('./video.mp4')
      Peer.send(id, data)
      ```

