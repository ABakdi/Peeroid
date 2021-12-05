//Discovering peer
// broadcasts ping message {header: "__Ping", body:{id, name}, tail:{publicKey, stamp}}
// remote peer recieves ping from (address, port)
// adds puplickey to keystore with stamp and hash("address:port") as an id
// generates a symetric key, encrypts the body with the public key recieved earlier
// replys with an echo message {'header': "__Echo", 'body':[{id, name, key}]}
//                                                            [encrypted]
// reciveing an echo with an encrypted body,
// decrypt body with
import {Hash} from './asymmetric'
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

  #onPing(address, port, msgBody, msgTail){
    //method will bes excuted when ping message is recived
    const stamp = '#echo'
    if(msgBody.id == this.id)
      return

    const ID = Hash(`${address}:${port}'`)
    this.keyStore.addPublicKey(ID, msgTail.stamp, msgTail.publicKey)

    let remote = {
      'id':msgBody.id,
      'name': msgBody.name,
      'address': address,
      'port': port
    }
    if(!this.getFoundMEPeerById(msgBody.id))
      this.pingList.push(remote)

    let symKey = this.keyStore.generateSymKey(ID, stamp)
    this.Echo(remote.id, symKey,stamp, msgTail.stamp)

  }

  Echo(ID, key, symKeyStamp, stamp){
    let reply = {
      'header': "__Echo",
      'body': {
        'id': this.id,
        'name': this.name,
        'key': key,
        'stamp': symKeyStamp
      },
      'tail':{
        'stamp': stamp
      }
    }
    reply.body = this.keyStore.AsymEncrypt(ID, stamp)

    // convert message to buffer
    const reply = Buffer.from(JSON.stringify(message))

    // send echo
    this.UdpSocket.send(reply, 0, reply.length, port, address)
  }


  #onEcho(address, port, msgBody, msgTail){
    const ID = Hash(`${address}:${port}`)
    const info = this.keyStore.AsymDecrypt(ID, msgTail.stamp, msgBody)

    let remote = {
      'id': info.id,
      'name': info.name,
      'address': address,
      'port': port
    }
    if(!this.getFoundPeerByAddress(info.id)){
      this.echoList.push(remote)
      this.eventBus.Emit('found-peer', remote)
    }

    this.keyStore.addSymKey(ID, info.stamp, info.key)
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
  

  Ping(address, port, interface = 'wlp3s0'){
    const stamp = '#ping'
    // ping message
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
    // generates public key to be sent to peer address:port
    // key id will be Hash('address:port')
    let ID = Hash(`${address}:${port}`)
    const publicKey = this.KeyStore.generateAsymKey(ID, stamp)

    // attach the public key to the message
    message.tail.publicKey = publicKey

    // convert message to buffer
    const msg = Buffer.from(JSON.stringify(message))

    // broadcast ping
    this.UdpSocket.send(msg, 0, msg.length, port, address)
  }

  SearchLocalNetwork(portList, interface="wlp3s0" bursts = 10, interval = 10){
    let bursts = bursts
    const BROADCAST_ADDR = broadcastAddress(interface)
    const stamp = "#burst-ping"

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
