import dgram from 'dgram'
import net from 'net'
import os from 'os'
import {v4 as uuidv4} from 'uuid'
import broadcastAddress from 'broadcast-address'
import keyStore from './keyStore.js'
import Discover from './Discover.js'
import eventBus from './eventBus.js'
import Linker from './Linker.js'
import requests from './requests.js'
import {Hash} from './asymmetric.js'

//import utility functions
import pkg from "tweetnacl-util"
import PeersManager from './PeersManager.js'
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64} = pkg

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
  }

  get udpSocket(){
    return this.UdpSocket
  }

  set _eventBus(bus){
    if(bus instanceof eventBus){
      this.eventBus = bus
      this.eventBus._addEvents(['tcp-data', 'tcp-end', 'tcp-close',
                                 'tcp-error', 'tcp-client','udp-data',
                                 'found-peer','connection-request'])
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

  set _Discovery(discover){
    if(discover instanceof Discover){
      this.Discovery = discover
    }else{
      throw new Error('must be Discover object')
    }
  }

  set _Linker(linker){
    if(linker instanceof Linker){
      this.Linker = linker
    }else{
      throw new Error('must be Discover object')
    }
  }

  set _requests(req){
    if(req instanceof requests){
      this.Requests = req
    }else{
      throw new Error('must be requests object')
    }
  }
  setVisible(visible){
    this.Discovery.setVisible(visible)
  }


  Start(port){
    if(!this.eventBus)
      throw new Error('must set eventBus befor start')
    if(!this.Discovery)
      throw new Error('must set Discovery befor start')
    if(!this.Linker)
      throw new Error('must set Linker befor start')
    if(!this.keyStore)
      throw new Error('must set keyStore befor start')
    if(!this.Requests)
      throw new Error('must set Requests befor start')


    let Port = port
    // if port isn't specified
    // choose a random port from this.portList
    let Address = os.networkInterfaces().wlp3s0[0].address
    if(!Port)
      Port =  this.portList[Math.floor(Math.random()*this.portList.length)]

    this.UdpSocket.bind(Port, ()=>{
      let add = this.UdpSocket.address()

      const options = {
        'address': Address,
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
        // note2: this seems to be a valid way because the address starts with
        // ffff meaning the reminder is ipv4
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
          info = this.Discovery.getFoundPeerByAddress(address, port)
          if(info)
            break
        }

        if(!info && address == '1'){
           for(let port of this.portList){
             info = this.Discovery.echoList.find((p)=> p.port == port)
             if(info)
               break
           }
        }


        // check if tcp client is related to some
        // already existing recognized peer
        // if not close the connection
        if(!info){
          client.destroy()
          return
        }
        // check if this client is allowed
        // if not end the connection
        let status = this.Requests.getRequestStatus(info.id)
        if(status != "waiting"){
          client.destroy()
          return
        }
        this.Requests.resolveRequest(info.id, "connected")

        // construct peer object
        let peer = {
          ...info,
          'tcpSocket': client
        }

        // add peer to peersManager
        this.Linker.Peers.addPeer(peer)

        // emit 'tcp-client' with the relevant information
        this.eventBus.Emit('tcp-client', {'id': peer.id, 'name': peer.name, ...remote_client})

        // when tcp data is recieved we emmit 'tcp-data' with (id, data) the id of the client end the data recieved
        // perData: the last chunk of data after splitting by
        // the ending directive /end*msg/ will be stored here
        // if it is not complete, later it will be concatinated
        // with the new data and the process will repeat each time
        // data is recieved
        let preData = ''
        client.on('data',(data)=>{
          data = preData.concat(data.toString()).split('/end*msg/')
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

        client.on('end', ()=>{
          this.eventBus.Emit('tcp-end', peer.id, peer.name)
        })

      })
      this.UdpSocket.setBroadcast(true)

      //udp and tcp servers will bind to the same port
      const server_port = add.port

      this.TcpServer.listen(server_port, ()=>{

        this.TcpServer.on('close', ()=>{
          this.eventBus.Emit('tcp-close')
        })

        this.TcpServer.on('error', (error)=>{
          this.eventBus.Emit('tcp-error', error)
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
    let body
    let ID = Hash(`${remote.address}:${remote.port}`)
    switch(message.header){
      case "__Ping":
        this.eventBus.Emit('#peer-ping', remote.address, remote.port, message)
        break

      case "__Echo":
        this.eventBus.Emit('#peer-echo', remote.address, remote.port, message)
        break

      case "__Connect":
        ID = Hash(`${remote.address}:${remote.port}`)
        body = this.keyStore.symmetricDecrypt(ID, message.tail.stamp, message.body)
        // message.body = body
        this.Requests.addRemoteRequest(body.id)
        this.eventBus.Emit('connection-request', body.id, body.name)
        break

      case "__Accept":
        body = this.keyStore.symmetricDecrypt(ID, message.tail.stamp, message.body)
        message.body = body
        break

      case "__Data":
        body = this.keyStore.symmetricDecrypt(ID, message.tail.stamp, message.body)
        let peer = this.Linker.Peers.getPeerByAddress(remote.address, remote.port)
        this.eventBus.Emit('udp-data', {'id': peer.id, 'name': peer.name}, body)
        break
    }
  }

}
export default Peer
