import PeersManager from './PeersManager.js'
import net from 'net'
import {Hash} from './asymmetric.js'

class Linker{
  constructor(udpSocket, Discovery, keyStore){
    this.udpSocket = udpSocket
    this.Discovery = Discovery
    this.keyStore = keyStore
    this.Peers = new PeersManager()
  }

  requestConnection(id, stamp){
    let peer = this.Discovery.getFoundpeerById(id)
    if(!peer){
      throw new Error('no such peer')
    }

    let message = {
      'header': "__Connect",
      'body':{
        'id': this.id,
        'name': this.name
      }
    }
    const ID = Hash(`${peer.address}:${peer.port}`)

    message.body = this.keyStore.symmetricEncrypt(ID, stamp, message.body)

    message = Buffer.from(JSON.stringify(message))

    this.UdpSocket.send(message, 0,message.length , peer.port, peer.address)
  }

  tcpConnect(id){
    peer = this.Discovery.getFoundPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    let options = {
      'address': peer.address,
      'port': peer.port
    }

    const client = net.createConnection(options, ()=>{
      let info = {
        'localAdress': client.localAddress,
        'remoteAddress': client.remoteAddress,
        'localPort': client.localPort,
        'remotePort': client.remotePort,
        'name': peer.name,
        'id': peer.id
      }

      let address_temp = client.remoteAddress

      const tcpClient = {
        'id' : peer.id,
        'name' : peer.name,
        'address' : client.remoteAddress,
        'port' : client.remotePort,
        'ref' : client,
      }
      this.Peers.addPeer(tcpClient)
      this.eventBus.Emit('tcp-connected', info)
    })
    //client.setTimeout(1000)

    client.setEncoding('utf8')

    // When receive server send back data.
    client.on('data', (data)=>{
      data = JSON.parse(data.toString())
      this.eventBus.Emit('tcp-data', id, data)
    })

    // When connection disconnected.
    client.on('end', ()=>{
      this.eventBus.Emit('tcp-end', id)
    })

    /*
    client.on('timeout', function () {
      console.log('Client connection timeout. ')
    })
    */

    client.on('error', (error)=>{
      this.eventBus.Emit('tcp-error', id, error)
    })

  }

  udpConnect(address, port){

  }

  tcpSend(id, stamp, json, header = "__Data"){
    peer = this.Peers.getPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    const ID = Hash(`${peer.address}:${peer.port}`)

    if(!this.keyStore.checkKey(ID, stamp))
      throw new Error('no such key')

    let body = this.keyStore.symmetricEncrypt(ID, peer.stamp, json)
    let msg = {
      'header': header,
      'body': body,
      'tail':{
        peer.stamp
      }
    }
    msg = JSON.stringify(msg)
    peer.tcpSocket.write(msg)
  }

  udpSend(id, stamp, json, header = "__Data"){
    peer = this.Peers.getPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    const ID = Hash(`${peer.address}:${peer.port}`)

    if(!this.keyStore.checkKey(ID, stamp))
      throw new Error('no such key')

    let body = this.keyStore.symmetricEncrypt(ID, , json)
    let msg = {
      'header': header,
      'body': body,
      'tail':{
        'stamp': stamp
      }
    }
    msg = JSON.stringify(msg)
    if(peer.udpSocket)
      console.log("not yet!!")
    else
      this.udpSocket.send(msg, 0, msg.length, peer.port, peer.address)
  }

  Kill(id){
    let peer = this.Peers.getPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    peer.ref.destroy()
    this.Peers.removePeerById(id)
  }
}

export default Linker
