import PeersManager from './PeersManager.js'
import net from 'net'
import {Hash} from './asymmetric.js'
import keyStore from './keyStore.js'
import Discover from './Discover.js'
import eventBus from './eventBus.js'
import Requests from './requests.js'
class Linker{
  constructor(udpSocket, id, name){
    this.udpSocket = udpSocket
    this.Peers = new PeersManager()
    this.id = id
    this.name = name
  }

  set _eventBus(bus){
    if(bus instanceof eventBus){
      this.eventBus = bus
      this.eventBus._addEvents(['tcp-data', 'tcp-end',
                                'tcp-error','tcp-connected',
                                'tcp-client','connection-request'])
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

  set _requests(req){
    if(req instanceof Requests){
      this.Requests = req
    }else{
      throw new Error('must be requests object')
    }
  }

  set _Discovery(discover){
    if(discover instanceof Discover){
      this.Discovery = discover
    }else{
      throw new Error('must be Discover object')
    }
  }

  requestConnection(id, stamp){
    let peer = this.Discovery.getFoundPeerById(id)
    if(!peer){
      throw new Error('no such peer')
    }

    let message = {
      'header': "__Connect",
      'body':{
        'id': this.id,
        'name': this.name
      },
      'tail':{
        'stamp': stamp
      }
    }
    const ID = Hash(`${peer.address}:${peer.port}`)

    message.body = this.keyStore.symmetricEncrypt(ID, stamp, message.body)

    message = Buffer.from(JSON.stringify(message))

    this.udpSocket.send(message, 0,message.length , peer.port, peer.address)
    this.Requests.addRequest(peer.id)
  }

  tcpConnect(id){
    let peer = this.Discovery.getFoundMEPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    let options = {
      'address': peer.address,
      'port': peer.port
    }

    const client = net.createConnection(options, ()=>{
      let info = {
        'localAddress': client.localAddress,
        'remoteAddress': client.remoteAddress,
        'localPort': client.localPort,
        'remotePort': client.remotePort,
        'name': peer.name,
        'id': peer.id
      }

      let address_temp = client.remoteAddress

      const tcpClient = {
        ...peer,
        'tcpSocket' : client,
      }
      this.Peers.addPeer(tcpClient)
      this.eventBus.Emit('tcp-connected', info)
    })
    //client.setTimeout(1000)

    client.setEncoding('utf8')

    // When receive server send back data.
    client.on('data', (data)=>{
      data = JSON.parse(data.toString())
      const ID = Hash(`${peer.address}:${peer.port}`)
      data = this.keyStore.symmetricDecrypt(ID, data.tail.stamp, data.body)
      this.eventBus.Emit('tcp-data', {'id': peer.id, 'name': peer.name}, data)
    })

    // When connection disconnected.
    client.on('end', ()=>{
      this.eventBus.Emit('tcp-end', peer.id, peer.name)
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
    const peer = this.Peers.getPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    const ID = Hash(`${peer.address}:${peer.port}`)

    if(!this.keyStore.checkKey(ID, stamp))
      throw new Error('no such key')

    let body = this.keyStore.symmetricEncrypt(ID, stamp, json)
    let msg = {
      'header': header,
      'body': body,
      'tail':{
        'stamp': stamp
      }
    }
    msg = JSON.stringify(msg)
    peer.tcpSocket.write(msg)
  }

  udpSend(id, stamp, json, header = "__Data"){
    const peer = this.Peers.getPeerById(id)
    if(!peer)
      throw new Error('no such peer')

    const ID = Hash(`${peer.address}:${peer.port}`)

    if(!this.keyStore.checkKey(ID, stamp))
      throw new Error('no such key')

    let body = this.keyStore.symmetricEncrypt(ID, stamp, json)
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
