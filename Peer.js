import dgram from 'dgram'
import net from 'net'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
class Peer{
  constructor(name){
    this.id = uuidv4()
    this.name = name
    this.Peers = new PeersManager()
    this.EventBus = new EventEmitter()
    this.foundPeers = []
    this.UdpSocket = dgram.createSocket({type:'udp4', reuseAddr: true})
    this.TcpServer = null

  }

  Start(){
    let Port = port
    this.UdpSocket.bind(Port,()=>{
      let add = this.UdpSocket.address()

      // Log
      console.log(add)

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

        let c = this.getClientByAddress(address, Port)

        // Log
        console.log('remote_client: ', remote_client)

        let TcpClient = {
          ...c,
          ref: client
        }

        this.peers.addPeer(TcpClient)

        // emit 'tcp-client' with the relevant information
        this.EventBus.emit('tcp-client', TcpClient)

        // when tcp data is recieved we emmit 'tcp-data' with (id, data) the id of the client end the data recieved
        client.on('data',(data)=>{
          let id = TcpClient.id
          this.EventBus.emit('tcp-data', id, data)
        })

        client.on('end', ()=>{
          this.EventBus.emit('tcp-end')
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


  #UdpListen(){
    this.UdpSocket.on('message', (message, remote)=>{

      try{
        message = JSON.parse(message.toString())
      }catch(err){
        throw "unable to parse message: "+ err
      }
      this.#udpMessageHandler(message)
    })

  }

  #udpMessageHandler(message){
    switch(message.header){
      case "__Ping":
        if(message.body.id == this.id)
          break
        // store the relevant information about this server for later use
        const remote_peer = {
            'id': message.body.id,
            'name': message.body.name,
            'address': remote.address,
            'port': remote.port,
        }
        this.EventBus.emit('#peer-ping', remote_peer, true)

      case "__Echo":
        if(message.body.id == this.id)
          break

        const remote_peer = {
          'id': message.body.id,
          'name': message.body.name,
          'address': remote.address,
          'port': remote.port,
        }

        this.EventBus.emit('#peer-echo', remote_peer, false)
        break

      case "__Connect":
        this.EventBus.emit('connection-request', message.body.id, message.body.name)
        break

      case "__Accept":
        console.log(message)
        this.EventBus.emit('peer-accept', message.body.id, message.body.answer)
        break

      case "__Data":
        this.EventBus.emit('udp-data', ...message.body)
        break
    }
  }

  #discovery_handler = (remote_peer, isping)=>{
    const isRemoteRecognized = this.getClientByAddress(remote_peer.address, remote_peer.port)
    if(!isRemoteRecognized){
      if(isping){
        this.foundPeers.push(remote_peer)
        this.EventBus.emit('found-peer', remote_peer)
      }else{

        if(this.visible){
          let reply = {
            'header': "__Echo",
            'body': {
              'id': this.id,
              'name': this.name,
            }
          }
          // convert reply ro buffer
        reply = Buffer.from(JSON.stringify(reply))

        this.UdpClient.send(reply, 0, reply.length, remote_peer.port, remote_peer.address)
          this.foundPeers.push(remote_peer)
        }
      }
    }
  }
  

  Search(portList, interval = 3){
    const BROADCAST_ADDR = broadcastAddress('wlp3s0')
    const PORT = portList

    const broadcastPresence = ()=>{
      let message = {
        'header': "__Ping",
        'body':{
          'id': this.id,
          'name': this.name,
        }
      }

      PORT.forEach((port)=>{
        message = Buffer.from(JSON.stringify(message))
        this.UdpSend(message, port, BROADCAST_ADDR)
      })

    }

    clearInterval(this.UdpBroadcast)

    this.UdpBroadcast = setInterval(broadcastPresence, interval*1000)
  }
  addEventListener(event, callback){
    if(!this.eventsList.includes(event)){
      throw 'event does not exist: '+event
    }
    this.EventBus.addListener(event, callback)
  }

  Connect(id){
  }

  UdpSend(id){
    let peer = this.peers.getPeerById(id)
  }

  TcpSend(id){
    let peer = this.peers.getPeerById(id)

  }

  SendFile(id, fileUrl){
    let peer = this.peers.getPeerById(id)

  }

  Kill(id){
    let peer = this.peers.getPeerById(id)
  }
}
export default Peer
