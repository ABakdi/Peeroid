class Discover{
  constructor(udpSocket, eventBus, keyStore, id, name){
    // found me
    this.pingList = []
    // found
    this.echoList = []
    //any user with the id/address in this list
    // will be prevented from connecting to us
    // pings from it will be simply ignored
    this.blockList = []

    this.udpSocket = udpSocket
    this.eventBus = eventBus
    this.keyStore = keyStore

    this.id = id
    this.name = name

    this.udpBroadcast = null

    this.eventBus._addEvents(['#peer-ping', '#peer-echo'])

    this.eventBus.addEventListener('#peer-ping', this.#onPing)
    this.eventBus.addEventListener('#peer-echo', this.#onEcho)
  }

  #onPing(address, port, msgBody, keyStamp){
    const stamp = 'echo'
    let info = this.keyStore.AsymDecrypt(msgBody, keyStamp)
    if(info.id == this.id)
      return

    let remote = {
      'id': info.id,
      'name': info.name,
      'address': address,
      'port': port
    }
    if(!this.getFoundMEPeerById(info.id))
      this.pingList.push(remote)

    symKey = this.keyStore.generateSymKey(peer.id, stamp)
    let echo = {
      'id': this.id,
      'name': this.name,
      'stamp': stamp,
      'key': symKey
    }

    this.Echo()

  }

  #onEcho(){

  }

  getFoundPeerById(id){
    return this.echoList.find((peer)=>{
      if(id == peer.id)
        return true
    })
  }

  getFoundPeerByAddress(address, port){
    return this.echoList.find((peer)=>{
      if(address == peer.address && port == peer.port)
        return true
    })

  }

  getFoundMEPeerById(id){
    return this.pingList.find((peer)=>{
      if(id == peer.id)
        return true
    })

  }

  getFoundMEPeerByAddress(address, port){
    return this.pingList.find((peer)=>{
      if(address == peer.address && port == peer.port)
        return true
    })

  }
  

  Ping(address, port, stamp, interface = 'wlp3s0'){
    let message = {
      'header': "__Ping",
      'body':{
        'id': this.id,
        'name': this.name,
      },
      'tail':{
        'stamp': stamp
      }
    }
    const publicKey = this.KeyStore.generateAsymKey(this.id, stamp)

    // attach the public key to the message
    message.tail.publicKey = publicKey

    // convert message to buffer
    const msg = Buffer.from(JSON.stringify(message))

    // broadcast ping
    this.UdpSocket.send(msg, 0, msg.length, port, address)
  }

  Echo(peerID, stamp){
    let reply = {
      'header': "__Echo",
      'body': {
        'id': this.id,
        'name': this.name,
        'key': key
      },
      'tail':{
        'stamp': stamp
      }
    }
    reply.body = this.keyStore.AsymDecrypt(peerID, stamp)

  }

  SearchLocalNetwork(portList, interface="wlp3s0" bursts = 10, interval = 10){
    let bursts = bursts
    const BROADCAST_ADDR = broadcastAddress(interface)

    let message = {
      'header': "__Ping",
      'body':{
        'id': this.id,
        'name': this.name,
      },
      'tail':{
        'stamp': 'ping'
      }
    }
    const publicKey = this.KeyStore.generateAsymKey(this.id, 'ping')

    // attach the public key to the message
    message.tail.publicKey = publicKey
    // convert message to buffer
    const msg = Buffer.from(JSON.stringify(message))

    const broadcastPresence = ()=>{
      // broadcast
      this.portList.forEach((port)=>{
        this.UdpSocket.send(msg, 0, msg.length, port, BROADCAST_ADDR)
      })
      bursts = bursts-1
      if(bursts>0)
        this.UdpBroadcast = setTimeout(broadcastPresence, interval*1000)
    }

    this.UdpBroadcast = setTimeout(broadcastPresence, interval*1000)
  }
  // this method will allow peers to connect across the internet
  // by sending request to a discovery service server
  // or a stable "provider node" on the peeriod network
  SearchPeeroidNetwork(){
    // TODO
  }

}
