import PeersManager from './PeersManager.js'
import net from 'net'
import {Hash} from './asymmetric.js'
import keyStore from './keyStore.js'
import Discover from './Discover.js'
import eventBus from './eventBus.js'
import Requests from './requests.js'
import { isArray } from 'util'
class Linker{
  constructor(udpSocket, id, name){
    this.udpSocket = udpSocket
    this.Peers = new PeersManager()
    this.id = id
    this.name = name
  }

  get peers(){
    return this.Peers.peers.map((p)=>{
      return {
        'id': p.id,
        'name': p.name
      }
    })
  }

  set _eventBus(bus){
    if(bus instanceof eventBus){
      this.eventBus = bus
      this.eventBus._addEvents(['tcp-data', 'tcp-end',
                                'tcp-error','tcp-connected',
                                'tcp-client','connection-request',
                               'tcp-data-sent', 'udp-data-sent'])
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
      'port': peer.port,
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

    let preData = ''
    client.on('data', (data)=>{
      data = preData.concat(data.toString())
      data = data.split('/end*msg/')
      try{
        JSON.parse(packet)
        preData = ''
      }catch(e){
        preData = data.pop()
      }
      data.forEach((packet)=>{
        packet = JSON.parse(packet)
        // calculate keyStore ID
        const ID = Hash(`${peer.address}:${peer.port}`)
        let header = packet.header
        // decrypt data body
        packet = this.keyStore.symmetricDecrypt(ID, packet.tail.stamp, packet.body)
        this.eventBus.Emit('tcp-data', {'id': peer.id, 'name': peer.name, 'header': header}, packet)
      })
    })

    // When connection disconnected.
    client.on('end', ()=>{
      this.eventBus.Emit('tcp-end', peer.id, peer.name)
    })

    /*
    client.on('timeout', function () {
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
    let sent_notify = msg.header != "__File"
    msg = JSON.stringify(msg)
    // add ending directive to msg
    // to prevent pecket sticking
    msg = msg.concat('/end*msg/')

    peer.tcpSocket.write(msg)
    if(sent_notify)
      this.eventBus.Emit('tcp-data-sent', id, json)
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

    peer.tcpSocket.destroy()
    this.Peers.removePeerById(id)
  }
}

export default Linker
