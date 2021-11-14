import Client from './client.js'
import Server from './server.js'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;


function input(){
  var cursorIndex = -1
  let INPUT = ""
  // handle deleting charecters with backspace
  const delete_handler = function(){
    //prevent more deletion if INPUT is empty
    // or cursor is at the beginning
    if(INPUT == '' || cursorIndex <= -1)
        return
    INPUT= INPUT.substr(0 ,cursorIndex) + INPUT.substr(cursorIndex + 1)
    term.left(1)
    term.delete(1)
    cursorIndex = cursorIndex - 1
  }
  const terminate = function(resolve){
    term.grabInput(false)
    resolve(INPUT)
  }
  term.grabInput()
  return new Promise((resolve)=>{
    term.on('key', function(key, matches, data){
      switch(key){
        case 'UP':
          break
        case 'DOWN':
          break
        case 'RIGHT':
          cursorIndex = cursorIndex + 1
          term.right(1);
          break
        case 'LEFT':
          cursorIndex = cursorIndex - 1
          term.left(1)
          break
        case 'CTRL_C':
          term('\n')
          process.exit()

        case 'BACKSPACE':
          delete_handler()
          break

        case 'ENTER':
          term('\n')
          terminate(resolve)
        default:
          let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
          cursorIndex = cursorIndex +1
          INPUT = INPUT + char
          term.green(char)
      }
    })
  })
}

function yesOrNoQuestion(id, name, question){
  term(question)
  return new Promise(resolve => {
    term.yesOrNo({yes: ['y', 'ENTER'], no:['n']}, function(error, result){
      resolve(result)
      term.grabInput( false )
    })
  })
}
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


    this.Server.addEventListener('found-peer', (remote_peer)=>{
        console.log('found-peer')
        console.log(remote_peer)

        console.log('trying to connect to: ', remote_peer.name)
        var id = remote_peer.id
        this.Connect(id)
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

    this.Client.addEventListener('connection-request', async (id, name)=>{
        console.log('connection-request')
        const question = id + " : " + name + " want's to connect to you:[Y|n]\n"
        var ans = await yesOrNoQuestion(id, name, question)
        if(ans){
          this.Client.ConnectToPeer(id)
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

    this.Client.addEventListener('tcp-connected', async (info)=>{
        console.log('tcp-connected')
        console.log(info)
        let s = this.Client.Servers
        console.log(s)
        term.green('\n>>> ')
        let msg = await input()
        s.peers[0].ref.write(msg)
    })

    this.Client.addEventListener('udp-data', function(stamp, sequence, data){
        console.log('udp-data')
        console.log(stamp, sequence, data)
    })



  }

  Start(port){
    this.Server.Start()
    this.Client.Start(port)

  }

  Search(port){
    this.Server.Search(port)
  }

  Connect(id){
    this.Server.ConnectToPeer(id)
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
