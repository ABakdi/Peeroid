import PeersManager from './PeersManager.js'
import net from 'net'

class Linker{
  constructor(tcpSocket, udpSocket, Discovery){
    this.tcpSocket = tcpSocket
    this.udpSocket = udpSocket
    this.Discovery = Discovery
    this.Peers = new PeersManager()

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

  tcpSend(id, json){

  }

  udpSend(id, json){

  }
}
