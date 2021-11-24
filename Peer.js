import dgram from 'dgram'
import net from 'net'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
import broadcastAddress from 'broadcast-address'

// asymetric encryption
import {generateAsymmetricKey,
        AsymEncrypt, AsymDecrypt, Hash } from './asymmetric.js'

import {generateSymmetricKey,
        SymEncrypt, SymDecrypt} from './symmetric.js'
class Peer{
  constructor(name, portList){
    this.id = uuidv4()
    this.name = name
    this.visible = true
    // these are the ports that will be serched
    // when loking for peers
    // we also will bind to one of these ports randomly
    // if not specified otherwise
    this.portList = portList
    this.Peers = new PeersManager()
    this.EventBus = new EventEmitter()
    this.foundPeers = []
    this.foundMepeers = []
    this.UdpBroadcast = null
    this.UdpSocket = dgram.createSocket({type:'udp4', reuseAddr: true})
    this.TcpServer = null

    this.KeyStore = []

    this.eventsList = ['tcp-data', 'tcp-end', 'tcp-close', 'tcp-error', 'tcp-client',
                       'udp-data', 'found-peer', 'peer-accept',
                       'connection-request', 'tcp-connected']


    //this fix is here because apperently
    // I cant use the same handler for tow
    // diffrent events
    this.EventBus.on("#peer-ping", this.#discovery_handler)
    this.EventBus.on("#peer-echo", (remote_peer, found)=>{
      this.#discovery_handler(remote_peer, found)
    })

  }

  #getPrivateKey(publicKey){
    let privateKey = this.KeyStore.find((key)=>{
      return (key[0] == publicKey)
    })

    if(privateKey)
      return privateKey[1]
    else
      throw new Error('key does not exist')
  }
  Start(port){
    let Port = port
    if(!Port)
      Port =  this.portList[Math.floor(Math.random()*this.portList.length)]
    this.UdpSocket.bind(Port,()=>{
      let add = this.UdpSocket.address()
      this.TcpServer = net.createServer({'host': add.address, 'port': add.port}, (client)=>{
        // all the code in here will be excuted when
        // new tcp client connects to to this server
        // infromation related to the client are in tcp_client

        // use utf-8 encodeing for messaging
        client.setEncoding('utf-8')

        // Note: this is just a quick fix, I couldn't find any other way.
        //remove the ipv6 part ::ffff:[xxx.xxx.xxx.xxx]
        // we are only intrested in tha part that I put in prakets,
        // tha last part, it is the ipv4 address
        let address = client.remoteAddress.split(':')
        address = address[address.length -1]

        let remote_client = {
          'remoteAddress': client.remoteAddress,
          'remotePort': client.remotePort,
          'localAddress': client.localAddress,
          'localPort': client.localPort
        }


        let info
        for(let port of this.portList){
          info = this.getFoundpeerByAddress(address, port, true)
          if(info)
            break
        }

        let TcpClient = {
          ...info,
          ref: client
        }

        this.Peers.addPeer(TcpClient)

        // emit 'tcp-client' with the relevant information
        this.EventBus.emit('tcp-client', TcpClient)

        // when tcp data is recieved we emmit 'tcp-data' with (id, data) the id of the client end the data recieved
        client.on('data',(data)=>{
          let id = TcpClient.id
          this.EventBus.emit('tcp-data', id, data)
        })

        client.on('end', ()=>{
          let id = TcpClient.id
          this.EventBus.emit('tcp-end', id)
        })

      })
      // make this udp socket able to brodcast
      this.UdpSocket.setBroadcast(true)

      //udp and tcp servers will bind to the same port
      const server_port = add.port

      this.TcpServer.listen(server_port, ()=>{

        this.TcpServer.on('close', ()=>{
          this.EventBus.emit('tcp-close')
        })

        this.TcpServer.on('error', (error)=>{
          this.EventBus.emit('tcp-error', error)
        })
      })
    })
    this.#UdpListen()

  }
  setVisible(visible){
      this.visible = visible
  }

  getFoundpeerById(id, found){
    let list = []
    if(found)
      list = this.foundPeers
    else
      list = this.foundMepeers

    return list.find((peer)=>{
      if(id == peer.id)
        return true
    })
  }

  getFoundpeerByAddress(address, port, found){
    let list = []
    if(found)
      list = this.foundPeers
    else
      list = this.foundMepeers

    return list.find((peer)=>{
      if(address == peer.address && port == peer.port)
        return true
    })
  }



  #UdpListen(){
    this.UdpSocket.on('message', (message, remote)=>{
      let msg = message
      try{
        msg = JSON.parse(message.toString())
      }catch(err){
        throw "unable to parse message: "+ err
      }
      this.#udpMessageHandler(msg, remote)

    })

  }

  #udpMessageHandler(message, remote){
    let remote_peer = null
    switch(message.header){
      case "__Ping":
        if(message.body.id == this.id)
          break
        // store the relevant information about this server for later use
        remote_peer = {
          'id': message.body.id,
          'name': message.body.name,
          'address': remote.address,
          'port': remote.port,
          'publicKey': message.tail.publicKey,
        }
        // peer found me "found = false"
        this.EventBus.emit('#peer-ping', remote_peer, false)
        break

      case "__Echo":

        const privateKey = this.#getPrivateKey(message.tail.publicKey)
        let body = AsymDecrypt(privateKey, message.body)

        if(body.id == this.id)
          break

        remote_peer = {
          'id': body.id,
          'name': body.name,
          'address': remote.address,
          'port': remote.port,
          'key': body.key
        }

        // found peer "found = true"
        this.EventBus.emit('#peer-echo', remote_peer, true)
        break

      case "__Connect":
        this.EventBus.emit('connection-request', message.body.id, message.body.name)
        break

      case "__Accept":
        this.EventBus.emit('peer-accept', message.body.id, message.body.answer)
        break

      case "__Data":
        this.EventBus.emit('udp-data', message.body.id, message.body.data)
        break
    }
  }

  #discovery_handler = (remote_peer, found)=>{
    let isRemoteRecognized = this.getFoundpeerByAddress(remote_peer.address, remote_peer.port, found)
    isRemoteRecognized = Boolean(isRemoteRecognized)

    if(!isRemoteRecognized){
      if(found){
        this.foundPeers.push(remote_peer)
        this.EventBus.emit('found-peer', remote_peer)
      }else{
        if(this.visible){
          let publicKey = remote_peer.publicKey

          // generate symetric key
          const key = generateSymmetricKey()
          //associate it with remote peer
          remote_peer.key = key
          this.foundMepeers.push(remote_peer)
          let reply = {
            'header': "__Echo",
            'body': {
              'id': this.id,
              'name': this.name,
              'key': key
            },
            'tail':{
              'publicKey': publicKey
            }
          }

          //conver public key to Uint8Array (key format)
          publicKey = new Uint8Array(publicKey.split(',').map(Number))

          //encrypt the body of reply
          reply.body = AsymEncrypt(publicKey,reply.body)

          // convert reply ro buffer
          reply = Buffer.from(JSON.stringify(reply))

          this.UdpSocket.send(reply, 0, reply.length, remote_peer.port, remote_peer.address)
        }
      }
    }
  }
  

  Search(interval = 5){
    clearInterval(this.UdpBroadcast)
    const BROADCAST_ADDR = broadcastAddress('wlp3s0')
    //const PORT = portList

    let message = {
      'header': "__Ping",
      'body':{
        'id': this.id,
        'name': this.name,
      },
      'tail':{}
    }

    const broadcastPresence = ()=>{
      const key = generateAsymmetricKey()
      // stor the key pair
      this.KeyStore.push([key[0].toString(),key[1]])

      // attach the public key to the message
      message.tail.publicKey = key[0].toString()

      // convert message to buffer
      const msg = Buffer.from(JSON.stringify(message))

      // broadcast
      this.portList.forEach((port)=>{
        this.UdpSocket.send(msg, 0, msg.length, port, BROADCAST_ADDR)
      })
      this.UdpBroadcast = setTimeout(broadcastPresence, interval*1000)
    }


    this.UdpBroadcast = setTimeout(broadcastPresence, interval*1000)
  }

  addEventListener(event, callback){
    if(!this.eventsList.includes(event)){
      throw 'event does not exist: '+event
    }
    this.EventBus.addListener(event, callback)
  }

  ConnectionRequest(id){
    let peer = this.getFoundpeerById(id, true)
    if(!peer){
      throw 'Peer is not recognized'
    }

    let message = {
      'header': "__Connect",
      'body':{
        'id': this.id,
        'name': this.name
      }
    }

    message = Buffer.from(JSON.stringify(message))

    this.UdpSocket.send(message, 0,message.length , peer.port, peer.address)
  }

  RefuseConnection(id){
    let peer = this.getFoundpeerById(id, false)
    if(!peer){
      throw 'Peer is not recognized'
    }

    let msg = {
      'header': '__Accept',
      'body':{
        id: this.id,
        answer: 'no'
      }
    }
    msg = JSON.stringify(msg)

    this.UdpSocket.send(msg, 0, msg.length, peer.port, peer.address)
  }

  Connect(id){
    let peer = this.getFoundpeerById(id, false)

    if(!peer){
      throw 'Peer is not recognized'
    }

    let options = {
      'host': peer.address,
      'port': peer.port
    }

    let msg = {
      'header': '__Accept',
      'body':{
        id: this.id,
        answer: 'yes',
      }
    }
    msg = Buffer.from(JSON.stringify(msg))
    this.UdpSocket.send(msg, 0, msg.length, peer.port, peer.address, ()=>{
    // Create TCP client.
    var client = net.createConnection(options, ()=>{

      let info = {
        'localAdress': client.localAddress,
        'remoteAddress': client.remoteAddress,
        'localPort': client.localPort,
        'remotePort': client.remotePort,
        'name': peer.name,
        'id': peer.id
      }
      var address_temp = client.remoteAddress

      var tcpClient = {
        'id' : peer.id,
        'name' : peer.name,
        'address' : client.remoteAddress,
        'port' : client.remotePort,
        'ref' : client,
        'key': peer.key
      }
      this.Peers.addPeer(tcpClient)
      this.EventBus.emit('tcp-connected', info)
    })
    //client.setTimeout(1000)

    client.setEncoding('utf8')

    // When receive server send back data.
    client.on('data', (data)=>{
      this.EventBus.emit('tcp-data', id, data)
    })

    // When connection disconnected.
    client.on('end', ()=>{
      this.EventBus.emit('tcp-end', id)
    })

    /*
    client.on('timeout', function () {
      console.log('Client connection timeout. ')
    })
    */

    client.on('error', (error)=>{
      this.EventBus.emit('tcp-error', id, error)
    })

    })
  }

  UdpSend(id, message){
    let peer = this.Peers.getPeerById(id)
    let msg = {
      'header': "__Data",
      'body':{
        'id': this.id,
        'data': message
      }
    }
    msg = Buffer.from(JSON.stringify(msg))
    this.UdpSocket.send(msg, 0, msg.length, peer.port, peer.address)
  }

  TcpSend(id, message){
    let peer = this.Peers.getPeerById(id)
    peer.ref.write(message)

  }

  SendFile(id, fileUrl){
    let peer = this.Peers.getPeerById(id)

  }

  Kill(id){
    let peer = this.Peers.getPeerById(id)
    peer.ref.destroy()
    this.Peers.removePeerById(id)
  }
}
export default Peer
