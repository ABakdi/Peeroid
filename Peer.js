import dgram from 'dgram'
import net from 'net'
import {v4 as uuidv4} from 'uuid'
import broadcastAddress from 'broadcast-address'
import { Hash } from './asymmetric.js'
import keyStore from './keyStore.js'
import Discover from './Discover.js'
import eventBus from './eventBus.js'
import Linker from './Linker.js'

class Peer{
  constructor(name, portList){
    this.id = uuidv4()
    this.name = name
    // these are the ports that will be serched
    // when loking for peers
    // we also will bind to one of these ports randomly
    // if not specified otherwise
    this.portList = portList

    this.UdpSocket = dgram.createSocket({type:'udp4', reuseAddr: true})
    this.TcpServer = null

    this._eventBus = null
    this._keyStore = null
    this._Discovery = null
    this._Linker = null

  }

  set _eventBus(bus){
    if(bus instanceof eventBus){
      this._eventBus = bus
      this._eventBus._addEvents(['tcp-data', 'tcp-end', 'tcp-close',
                                 'tcp-error', 'tcp-client','udp-data',
                                 'found-peer','connection-request',
                                 'tcp-connected'])
    }else{
      throw new Error('must be eventBus object')
    }
  }

  set _keyStore(store){
    if(store instanceof keyStore){
      this._keyStore = store
    }else{
      throw new Error('must be keyStore object')
    }
  }

  set _Discovery(discover){
    if(discover instanceof Discover){
      this._Discovery = discover
    }else{
      throw new Error('must be Discover object')
    }
  }

  set _Linker(linker){
    if(linker instanceof Linker){
      this._Discovery = linker
    }else{
      throw new Error('must be Discover object')
    }
  }
  setVisible(visible){
    this._Discovery.setVisible(visible)
  }


  Start(port){
    if(!this._ev)
    let Port = port
    // if port isn't specified
    // choose a random port from this.portList
    if(!Port)
      Port =  this.portList[Math.floor(Math.random()*this.portList.length)]

    this.UdpSocket.bind(Port,()=>{
      let add = this.UdpSocket.address()

      const options = {
        'host': add.address,
        'port': add.port
      }

      this.TcpServer = net.createServer(options, (client)=>{
        // all the code in here will be excuted when
        // new tcp client connects to to this server
        // infromation related to the client are in client: parameter

        // use utf-8 encodeing for messaging
        client.setEncoding('utf-8')

        // Note: this is just a quick fix, I couldn't find any other way.
        // remove the ipv6 part ::ffff:[xxx.xxx.xxx.xxx]
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

        // this is kinda stupid
        let info
        for(let port of this.portList){
          info = this._Discovery.getFoundpeerByAddress(address, port)
          if(info)
            break
        }

        // construct peer object
        let peer = {
          ...info,
          ref: client
        }

        // add peer to peersManager
        this.Peers.addPeer(peer)

        // emit 'tcp-client' with the relevant information
        this.EventBus.emit('tcp-client', client)

        // when tcp data is recieved we emmit 'tcp-data' with (id, data) the id of the client end the data recieved
        client.on('data',(data)=>{
          // calculate keyStore ID
          const ID = Hash(`${peer.address}:${peer.port}`)
          // decrypt data body
          const body = this._keyStore.symmetricDecrypt(ID, data.tail.stamp, data.body)
          data.body = body

          this._eventBus.Emit('tcp-data', peer.id, data)
        })

        client.on('end', ()=>{
          this._eventBus.Emit('tcp-end', peer.id)
        })

      })
      // make this udp socket able to brodcast
      this.UdpSocket.setBroadcast(true)

      //udp and tcp servers will bind to the same port
      const server_port = add.port

      this.TcpServer.listen(server_port, ()=>{

        this.TcpServer.on('close', ()=>{
          this._eventBus.Emit('tcp-close')
        })

        this.TcpServer.on('error', (error)=>{
          this._eventBus.Emit('tcp-error', error)
        })
      })
    })
    this.#UdpListen()

  }


  #UdpListen(){
    this.UdpSocket.on('message', (message, remote)=>{
      let msg = message
      try{
        msg = JSON.parse(message.toString())
      }catch(err){
        throw new Error("unable to parse message")
      }
      this.#udpMessageHandler(msg, remote)
    })
  }

  #udpMessageHandler(message, remote){
    const ID = Hash(`${address}:${port}`)
    const body = this._keyStore.symmetricDecrypt(ID, message.tail.stamp, message.body)
    message.body = body
    switch(message.header){
      case "__Ping":
        this._eventBus.Emit('#peer-ping', remote.address, remote.port, message)
        break

      case "__Echo":
        this._eventBus.Emit('#peer-echo', remote.address, remote.port, message)
        break

      case "__Connect":
        this._eventBus.emit('connection-request', body.id, body.name)
        break

      case "__Accept":
        break

      case "__Data":
        this._eventBus.emit('udp-data', body.id, body.data)
        break
    }
  }

}
export default Peer
