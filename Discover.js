//Discovering peer
// broadcasts ping message {header: "__Ping", body:{id, name}, tail:{publicKey, stamp}}
// remote peer recieves ping from (address, port)
// adds puplickey to keystore with stamp and hash("address:port") as an id
// generates a symetric key, encrypts the body with the public key recieved earlier
// replys with an echo message {'header': "__Echo", 'body':[{id, name, key}]}
//                                                            [encrypted]
// reciveing an echo with an encrypted body,
// decrypt body with the key generated earlier
// emmit peer-found event

import {Hash} from './asymmetric.js'
import broadcastAddress from 'broadcast-address'
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
//import utility functions
import pkg from "tweetnacl-util"
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64} = pkg

class Discover{
  constructor(udpSocket, id, name){
    // found me
    this.pingList = []
    // found
    this.echoList = []
    //any user with the id/address in this list
    // will be prevented from connecting to us
    // pings from it will be simply ignored
    this.blockList = []

    this.udpSocket = udpSocket

    this.id = id
    this.name = name
    this.visible = true

    this.udpBroadcast = null

  }

  set _eventBus(bus){
    if(bus instanceof eventBus){
      this.eventBus = bus
      this.eventBus._addEvents(['#peer-ping', '#peer-echo'])

      this.eventBus.addEventListener('#peer-ping', this.#onPing)
      this.eventBus.addEventListener('#peer-echo', this.#onEcho)
    }else{
      throw new Error('must be eventBus object')
    }
  }

  set _keyStore(store){
    if(store instanceof keyStore){
      this.keyStore = store
    }else{
      throw new Error('must be keyStore object')
    }
  }

  #onPing = (address, port, message)=>{
    // method will bes excuted when ping message is recieved

    // stamp key with #echo
    // key stamped with this will ecrypt the
    // echo message body
    const stamp = '#echo'
    // if sender id is equal to our id
    // we're pingin' our selfs
    // so do nothing
    if(message.body.id == this.id)
      return

    // key store id for this peer is
    // the hash of address:port
    const ID = Hash(`${address}:${port}`)
    // message tail contains public key
    // will be used to encrypt echo message
    let publicKey = message.tail.publicKey
    // store this key for later use
    this.keyStore.addPublicKey(ID, message.tail.stamp, publicKey)

    let remote = {
      'id': message.body.id,
      'name': message.body.name,
      'address': address,
      'port': port
    }
    // check if peer already sent us a ping
    if(!this.getFoundMEPeerById(message.body.id))
      this.pingList.push(remote)

    // generate symmetric key to be used for further comunication
    let symKey = this.keyStore.generateSymKey(ID, stamp)

    // send echo only when visible
    if(this.visible)
      this.Echo(ID, message.tail.stamp, symKey, stamp, address, port)

  }

  Echo(ID, stamp, symkey, symKeyStamp, address, port){
    // ID, stamp: what key we should use to encrypt message body.
    // symKey, symKeyStamp: symmetric key and its stamp
    // this will be used for further communication
    let reply = {
      'header': "__Echo",
      'body': {
        'id': this.id,
        'name': this.name,
        'key': symkey,
        'stamp': symKeyStamp
      },
      'tail':{
        'stamp': stamp
      }
    }
    reply.body = this.keyStore.aSymmetricEncrypt(ID, stamp, reply.body)

    // convert message to buffer
    reply = Buffer.from(JSON.stringify(reply))

    // send echo
    this.udpSocket.send(reply, 0, reply.length, port, address)
  }


  #onEcho = (address, port, message)=>{
    // function will be excuted when recieving echo messake

    // key-store id is the hash of address:port
    const ID = Hash(`${address}:${port}`)
    //decrypt body
    const info = this.keyStore.aSymmetricDecrypt(this.id, message.tail.stamp, message.body)

    let remote = {
      'id': info.id,
      'name': info.name,
      'address': address,
      'port': port
    }
    
    // add symmetric key contained in echo message to key-store
    // this key will be used for further communication
    this.keyStore.addSymKey(ID, info.stamp, info.key)

    // check if peer has been found already
    if(!this.getFoundPeerById(info.id)){
      this.echoList.push(remote)
      // new peer found
      this.eventBus.Emit('found-peer', remote)
    }
  }

  setVisible(visible){
    this.visible = visible
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
  getfoundPeerByName(name){
    return this.echoList.find((peer)=> peer.name == name)
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

  SearchLocalNetwork(portList, networkInterface = "wlp3s0", bursts = 10, interval = 2){
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

    const broadcastPresence = ()=>{
      // broadcast
      portList.forEach((port)=>{
        this.udpSocket.send(msg, 0, msg.length, port, BROADCAST_ADDR)
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
export default Discover
//--------------------------Testing-----------------------------//
/*
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
import dgram from 'dgram'
import {v4 as uuid4} from 'uuid'
import { Buffer } from 'buffer';

const store = new keyStore(),
      bus = new eventBus(),
      sock = dgram.createSocket('udp4'),
      id = uuid4()

const name = process.argv[2],
      port = Number(process.argv[3]),
      search = process.argv[4]

const discover = new Discover(sock, bus, store, id, name)

bus._addEvents('found-peer')

bus.addEventListener('found-peer', (peer)=>{
  console.log('found-peer: ', peer)
  console.log("ping-list:", discover.pingList)
  console.log("echo-list:", discover.echoList)
})

sock.bind(port, ()=>{
  // make this udp socket able to brodcast
  sock.setBroadcast(true)
})

sock.on('message', (message, remote)=>{
  message = JSON.parse(message.toString())
  if(message.header == '__Ping')
    bus.Emit('#peer-ping', remote.address, remote.port, message)
  else if(message.header == '__Echo')
    bus.Emit('#peer-echo', remote.address, remote.port, message)
})
if(search == 'true')
  discover.SearchLocalNetwork([6562, 6563])
*/
