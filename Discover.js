//Discovering peer
// broadcasts ping message {header: "__Ping", body:{id, name}, tail:{publicKey, stamp}}
// remote peer recieves ping from (address, port)
// adds puplickey to keystore with stamp and hash("address:port") as an id
// generates a symetric key, encrypts the body with the public key recieved earlier
// replys with an echo message {'header': "__Echo", 'body':[{id, name, key}]}
//                                                            [encrypted]
// reciveing an echo with an encrypted body,
// decrypt body with
import {Hash} from './asymmetric.js'
import broadcastAddress from 'broadcast-address'
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
    reply = Buffer.from(JSON.stringify(message))

    // send echo
    this.udpSocket.send(reply, 0, reply.length, port, address)
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
  

  Ping(address, port){
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
    this.udpSocket.send(msg, 0, msg.length, port, address)
  }

  SearchLocalNetwork(portList, networkInterface = "wlp3s0", bursts = 10, interval = 10){
    let counter = bursts
    const BROADCAST_ADDR = broadcastAddress(networkInterface)
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
    const publicKey = this.keyStore.generateAsymKey(this.id, stamp)

    // attach the public key to the message
    message.tail.publicKey = publicKey
    // convert message to buffer
    const msg = Buffer.from(JSON.stringify(message))
    console.log(message)

    const broadcastPresence = ()=>{
      // broadcast
      portList.forEach((port)=>{
          console.log(msg)
        this.udpSocket.send(msg, 0, msg.length, port, BROADCAST_ADDR, (msg)=>{
          console.log(msg)
        })
      })
      counter = counter - 1
      if(counter > 0)
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

//--------------------------Testing-----------------------------//
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
import dgram from 'dgram'
import {v4 as uuid4} from 'uuid'

const store = new keyStore(),
      bus = new eventBus(),
      sock = dgram.createSocket({type:'udp4', reuseAddr: true}),
      id = uuid4()

const name = process.argv[2],
      port = Number(process.argv[3]),
      search = process.argv[4]

const discover = new Discover(sock, bus, store, id, name)
bus._addEvents('found-peer')
bus.addEventListener('found-peer', (peer)=>{
  console.log(peer)
})

sock.on('message', (message, remote)=>{
  if(message.header == '__Ping')
    bus.Emit('#peer-ping', remote.address, remote.port, message.body, message.tail)
  else if(message.header == '__Echo')
    bus.Emit('#peer-echo', remote.address, remote.port, message.body, message.tail)
})

sock.bind(port, ()=>{
  // make this udp socket able to brodcast
  sock.setBroadcast(true)
})

if(search == 'true')
  discover.SearchLocalNetwork([6562, 6563])
