import Client from './client.js'
import Server from './server.js'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'

class Peer{
  constructor(name){
    this.id = uuidv4()
    this.name = name
    this.Peers = new PeersManager()
    this.EventBus = new EventEmitter()
    this.Client = new Client(this.name, this.id, this.EventBus, this.Peers)
    this.Server = new Server(this.name, this.id, this.EventBus, this.Peers)

    //Server configs
    this.Server.addEventListener('tcp-client', function(tcp_client){
      console.log('tcp-client')
      console.log(tcp_client)
    })

    this.Server.addEventListener('tcp-data', function(data){
        console.log('tcp-data')
        console.log(data)
    })


    this.Server.addEventListener('tcp-end', function(){
        console.log('tcp-end')
        console.log('connection ended')
    })


    this.Server.addEventListener('tcp-close', function(){
        console.log('tcp-close')
        console.log('conection closed')
    })


    this.Server.addEventListener('tcp-error', function(error){
        console.log('tcp-error')
        console.log('Error: ', error)
    })


    this.Server.addEventListener('found-peer', function(remote_peer){
        console.log('found-peer')
        console.log(remote_peer)

        console.log('trying to connect to: ', remote_peer.name)
        var id = remote_peer.id
        this.Server.ConnectToPeer(id)
    })

    this.Server.addEventListener('udp-data', function(stamp, sequence, data){
        console.log('tcp-data')
        console.log(stamp, sequence, data)
    })

    this.Server.addEventListener('peer-accept', function(id, answer){
        console.log('tcp-accept')
        if(answer == 'yes'){
            console.log('connection accepted')
        }else{
            console.log('connection refused')
        }
    })


    //client configs

    this.Client.addEventListener('connection-request', async function(id, name){
        console.log('connection-request')
        const question = id + " : " + name + " want's to connect to you:[Y|n]\n"
        var ans = await yesOrNoQuestion(id, name, question)
        if(ans){
          this.client.ConnectToPeer(id)
        }else{
          this.Client.RefuseConnection(id)
            console.log('Connection refused')
        }
    })

    this.Client.addEventListener('tcp-data', function(data){
        console.log('tcp-data')
        console.log(data)
    })


    this.Client.addEventListener('tcp-end', function(){
        console.log('tcp-end')
        console.log('connection ended')
    })


    this.Client.addEventListener('tcp-error', function(error){
        console.log('tcp-error')
        console.log('Error: ' + error)
    })

    this.Client.addEventListener('tcp-connected', async function(info){
        console.log('tcp-connected')
        console.log(info)
        let s = this.Client.Servers
        console.log(s)
        term.green('\n>>> ')
        let msg = await input()
        s.peers[0].ref.write(msg)
        this.Client.UdpSend()
    })

    this.Client.addEventListener('udp-data', function(stamp, sequence, data){
        console.log('udp-data')
        console.log(stamp, sequence, data)
    })



  }

  Start(){
    this.Server.Start()
    this.Client.Start()

  }

  Search(port){
    this.Server.Search(port)
  }

  Connect(id){
    this.Server.Connect(id)
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

const peer = new Peer('0x56')
peer.Search(6562)
