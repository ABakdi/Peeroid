import broadcastAddress from 'broadcast-address'
import dgram from 'dgram'
import net from 'net'
import PeersManager from './PeersManager.js'
import EventEmitter from 'events'

class Server{

  constructor(name, id, EventBus, peersManager){
    if(!name){
      throw "server must have a name"
    }

    if(!id){
      throw "server must have an id"
    }

    this.eventsList = ['tcp-data', 'tcp-end', 'tcp-close', 'tcp-error', 'tcp-client',
                       'udp-data', 'found-peer', 'peer-accept']


    this.name = name
    this.id = id
    this.EventBus = EventBus
    //reference to broadcast set interval
    this.UdpBroadcast = null

    //this will store a list of clients
    this.Clients = peersManager

    // remote peer found when serched for
    this.foundPeers = []

    this.UdpServer = dgram.createSocket({type:'udp4', reuseAddr: true})
    this.TcpServer = null

    // internal events #peer-echo is handled by discovery_handler method
    this.EventBus.on('#peer-echo', this.#discovery_handler)


  }
  //bind Udp and listen to tcp requests on the same port
  Start(){
    this.UdpServer.bind(()=>{
      let add = this.UdpServer.address()
      console.log(add)
      this.TcpServer = net.createServer({'host': add.address, 'port': add.port}, (client)=>{
        // all the code in here will be excuted when
        // new tcp client connects to to this server
        // infromation related to the client are in tcp_client

        // use utf encodeing for messaging
        client.setEncoding('utf-8')

        //remove the ipv6 part ::ffff:[xxx.xxx.xxx.xxx]
        // we are only intrested in tha part that I put in prakets,
        // tha last part, it is th ipv4 address
        let address = client.remoteAddress.split(':')
        address = address[address.length -1]
        let remote_client = {
          'remoteAddress': client.remoteAddress,
          'remotePort': client.remotePort,
          'localAddress': client.localAddress,
          'localPort': client.localPort
        }

        let c = this.getClientByAddress(address, 6562)
        console.log('remote_client: ', remote_client)
        let TcpClient = {
          ...c,
          ref: client
        }
        //TcpClient.port = client.localPort

        this.Clients.addPeer(TcpClient)

        // emit 'tcp-client' with the relevant information
        this.EventBus.emit('tcp-client', TcpClient)

        client.on('data',(data)=>{
          this.EventBus.emit('tcp-data', data)
        })

        client.on('end', ()=>{
          this.EventBus.emit('tcp-end')
        })



      })

      // make this udp socket able to brodcast
      this.UdpServer.setBroadcast(true)

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
    this.UdpListen()
  }

  addEventListener(event, callback){
    if (!this.eventsList.includes(event)){
      throw 'event does not exist'
    }else{
      this.EventBus.addListener(event, callback)
    }
  }
  
  UdpSend(message, Port, Address, onSendCallback){
    message = Buffer.from(message)
    this.UdpServer.send(message, 0, message.length, Port, Address, onSendCallback)
  }

  getClientByAddress(address, port){
    return this.foundPeers.find((client)=>{
      if(address == client.address && port == client.port)
        return true
    })
  }

  getClientById(id){
    return this.foundPeers.find((client)=>{
      if(id == client.id)
        return true
    })
  }

  // using an arrow function to keep 'this' pointing at this class
  // when calling this function on '#peer-ping' Event
  #discovery_handler = (remote_peer)=>{
    const isRemoteRecognized = this.getClientByAddress(remote_peer.address, remote_peer.port)
    if(!isRemoteRecognized){
      this.foundPeers.push(remote_peer)
      this.EventBus.emit('found-peer', remote_peer)
    }
  }

  UdpListen(){

    this.UdpServer.on('message', (message, remote)=>{

      message = JSON.parse(message.toString())

      if(message.header == "__Echo"){

        const remote_peer = {
          'id': message.body.id,
          'name': message.body.name,
          'address': remote.address,
          'port': remote.port,
        }

        this.EventBus.emit('#peer-echo', remote_peer)

      }else if(message.header == '__Accept'){
        console.log(message)
        this.EventBus.emit('peer-accept', message.body.id, message.body.answer)
      }else if(message.header =='__Data'){
        this.EventBus.emit('udp-data', ...message.body)
      }
    })

  }

  Search(port, interval = 3){

    const BROADCAST_ADDR = broadcastAddress('wlp3s0')
    const PORT = port
    console.log(this.TcpServer)
    const broadcastPresence = ()=>{
      let message = {
        'header': "__Ping",
        'body':{
          'id': this.id,
          'name': this.name,
        }
      }
      message = Buffer.from(JSON.stringify(message))
      this.UdpSend(message, port, BROADCAST_ADDR)

    }

    clearInterval(this.UdpBroadcast)

    this.UdpBroadcast = setInterval(broadcastPresence, interval*1000)
  }

  stopSearching(){
    clearInterval(this.UdpBroadcast)
  }

  ConnectToPeer(id){
    var peer = this.getClientById(id)
    if(!peer){
      return
    }

    let message = {
      'header': "__Connect",
      'body':{
        'id': this.id,
        'name': this.name
      }
    }

    message = Buffer.from(JSON.stringify(message))

    this.UdpSend(message, peer.port, peer.address)

  }
}




export default Server
