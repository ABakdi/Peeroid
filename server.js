import broadcastAddress from 'broadcast-address'
import dgram from 'dgram'
import net from 'net'
import { v4 as uuidv4 } from 'uuid'
import PeersManager from './PeersManager.js'
/*
 * .The primary function of this class is to send a ping
 *  an listen for echoes.
 *
 * .reciving an echo from an address means that there is a client visible
 *  and ready for connection.
 *
 * .
 *
 */

class Server{

  /*-------------------*important callback functions*---------------------
   *
   * onNewPeerFound: will be called when a remote peer echoes server's ping
   * and added to foud peers list
   *
   * ****************** Server Events Handlers ***********************
   *
   * --------------------- setServerCloseHandler ------------------
   * -onServerCloseCallback(...args): will ba called
   * when server closes
   *
   *---------------------- setServerErrorHandler ------------------
   * -onServerErrorCallback(error, ...args): will be called
   * when server error occurs
   *
   * ****************** Client Event Handlers ***************************
   *
   * ------------------ setNewTcpClientCallback ----------------------
   * -onNewTcpClientCallback(...args): function will be called
   * once a tcp client connects to server
   * -------------------- setTcpDataHandler ----------------------
   * -onTcpDataCallback(data, ...args): function will be called when
   * we start recieving data from tcp client
   *
   * -------------------- setTcpEndHandler -----------------------
   * -onEndCallback(...args): function will be called when
   * Tcp client end connection
   * -------------------------------------------------------------
   *
   */

  constructor(name){
    if(!name){
      throw "server must have a name"
    }

    //all handlers are undefined when class is constructed
    this.onTcpDataCallback = undefined
    this.onEndCallback = undefined
    this.onServerCloseCallback = undefined
    this.onServerErrorCallback = undefined
    this.onNewTcpClientCallback = undefined
    this.onUdpDataCallback = undefined
    this.onNewPeerFound = undefined

    this.name = name
    this.id = uuidv4()
    //reference to broadcast set interval
    this.UdpBroadcast = null

    //this will store a list of clients and will
    // handle adding data and end handlers once new tcp client connect
    this.Clients = new PeersManager()

    // remote peer found when serched for
    this.foundPeers = []

    this.UdpServer = dgram.createSocket('udp4')

    this.TcpServer = net.createServer((tcp_client)=>{

      tcp_client.setEncoding('utf-8')

      if(this.onNewTcpClientCallback)
        this.onNewTcpClientCallback(tcp_client)

      let TcpClient = {
        ...this.getClient(tcp_client.remoteAddress, tcp_client.port),
        ref: tcp_client
      }

      if(!this.onTcpDataCallback)
        throw "you should define onTcpDataCallback first"
      if(!this.onEndCallback)
        throw "you should define onEndCallback first"


      TcpClient.ref.on('data',this.onTcpDataCallback)

      TcpClient.ref.on('end', this.onEndCallback)


      this.Clients.addPeer(TcpClient)

    })

  }


  get serverRef(){
    return {
      "UdpServer": this.UdpServer,
      "TcpServer": this.TcpServer
    }
  }

  setTcpDataHandler(onTcpDataCallback){
    this.onTcpDataCallback = onTcpDataCallback
  }

  setTcpEndHandler(onEndCallback){
    this.onEndCallback = onEndCallback
  }

  setNewTcpClientHandler(onNewTcpClientCallback){
    this.onNewTcpClientCallback = onNewTcpClientCallback
  }

  setServerCloseHandler(onServerClose){
    this.onServerCloseCallback = onServerClose
  }

  setServerErrorHandler(onServerError){
    this.onServerErrorCallback = onServerError
  }

  //bind Udp and listen to tcp requests on the same port
  Start(){
    this.UdpServer.bind(()=>{

      this.UdpServer.setBroadcast(true)

      //udp and tcp servers will bind to the same port
      const server_port = this.UdpServer.address().port

      this.TcpServer.listen(server_port, ()=>{

        this.TcpServer.on('close', this.onServerCloseCallback)

        this.TcpServer.on('error', this.onServerErrorCallback)
      })

    })
    this.UdpListen()
  }
  
  UdpSend(message, Port, Address, onSendCallback){
    message = Buffer.from(message)
    this.UdpServer.send(message, 0, message.length, Port, Address, onSendCallback)
  }

  getClient(address, port){
    return this.foundPeers.find((client)=>{
      if(address == client.address && port == client.port)
        return true
    })
  }

  getPeerbyId(id){
    return this.foundPeers.find((client)=>{
      if(id == client.id)
        return true
    })
  }

  UdpListen(){

    this.UdpServer.on('message', (message, remote)=>{

      message = JSON.parse(message.toString())

      const isRemoteRecognized = this.getClient(remote.address, remote.port)

      // console.log('found peers:', this.foundPeers)

      if(message.header == "__Echo" && !isRemoteRecognized){

        const remote_peer = {
          'id': message.body.id,
          'name': message.body.name,
          'address': remote.address,
          'port': remote.port
        }

        // console.log('New Guy: ', remote_peer)

        this.foundPeers.push(remote_peer)
        this.onNewPeerFound(remote_peer)

      }
    })

  }



  Search(port, onNewPeerFound){

    const BROADCAST_ADDR = broadcastAddress('wlan0')
    const PORT = port

    const broadcastPresence = ()=>{
      let message = {
        'header': "__Ping",
        'body':{
          'id': this.id,
          'name': this.name
        }
      }
      message = Buffer.from(JSON.stringify(message))
      this.UdpSend(message, PORT, BROADCAST_ADDR)
    }

    clearInterval(this.UdpBroadcast)

    this.UdpBroadcast = setInterval(broadcastPresence, 3000)

    this.onNewPeerFound = onNewPeerFound

  }

  stopSearching(){
    clearInterval(this.UdpBroadcast)
  }

  ConnectToPeer(id){
    var peer = this.getPeerbyId(id)
    if(!peer){
      return
    }

    let message = {
      'header': "__CONNECT",
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
/*
const server = new Server("server")

server.setNewTcpClientHandler(function(client){
  console.log('new Tcp Client:', client)
})

server.setServerCloseHandler(function(){
  console.log("server closed")
})

server.setServerErrorHandler(function(error){
  console.log('Error: ', error)
})

server.setTcpDataHandler(function(data){
  console.log("recived: ", data)
})

server.setTcpEndHandler(function(){
  console.log('client disconnect')
})

server.Start()

server.Search(6562, function(obj){
  console.log('found peer')
})

setTimeout(()=>{
  server.stopSearching()
  console.log(server.foundPeers)
  var id = server.foundPeers[0].id
  server.ConnectToPeer(id)
}, 9000)
*/
