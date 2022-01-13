import Peer from './Peer.js'
import Discover from './Discover.js'
import Linker from './Linker.js'
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
import terminal from 'terminal-kit';
import requests from './requests.js'
import {WebSocketServer} from 'ws'
const {terminal: term} = terminal;
const name = process.argv[2],
      port = Number(process.argv[3]),
      search = process.argv[4],
      sockPort = process.argv[5]


const peer = new Peer(name, [6562, 6563])
const _eventBus = new eventBus()
const _keyStore = new keyStore()
const _requests = new requests()
const _discovery = new Discover(peer.udpSocket, peer.id, name)
const _linker = new Linker(peer.udpSocket, peer.id, name)

// will send commands
// and recieves updates
let peeroidClient = null

// peeriod server
const server = new WebSocketServer({port: sockPort})
server.on('connection', client =>{
  if(!peeroidClient){
    peeroidClient = client
    server.on('message', message =>{
      console.log(message)
    })
  }
})

// use the same event bus and keystrore for
// discovery link and peer in order
// to integrate every thing together
// this not necessary but it is what I will use
// here

_discovery._eventBus = _eventBus
_discovery._keyStore = _keyStore

_linker._Discovery = _discovery
_linker._eventBus = _eventBus
_linker._keyStore = _keyStore
_linker._requests = _requests

peer._Discovery = _discovery
peer._eventBus  = _eventBus
peer._keyStore = _keyStore
peer._Linker = _linker
peer._requests = _requests

function check_and_send(msg){
  if(peeroidClient){
    msg = JSON.stringify(msg)
    peeroidClient.send(msg)
  }
}

// Doscovery
_eventBus.addEventListener('found-peer', (info)=>{
  // log peer info
  term.green('-------------found-peer-------------\n')
  term(`${info.id}:${info.name}\n`)
  term(`${info.address}:${info.port}\n`)

  // cennect when peer is found
  // select which key to use
  let keyStamp = '#echo'
  _linker.requestConnection(info.id, "#echo")
})

// Connections

_eventBus.addEventListener('connection-request', (id, name)=>{
  term.green('------------connection-request---------\n')
  term(`from: ${id}:${name}\n`)

  _requests.resolveRmoteRequest(id, 'accepted')

  console.log('connecting...')
  _linker.tcpConnect(id)

})

_eventBus.addEventListener('tcp-client', (info)=>{
  // log peer info
  term.blue('--------------tcp-client---------\n')
  term(`${info.id}:${info.name}\n`)
  term(`local address: ${info.localAddress}:${info.localPort}\n`)
  term(`remote address: ${info.remoteAddress}:${info.remotePort}\n`)
  // once connected send data
  const data = {
    'greeting':'Hello there',
    'do-this': 'resend this, when recieved'
  }
  const stamp = _keyStore.Store[1].keys.sym[0].stamp

  _linker.tcpSend(info.id, stamp, data)
})

_eventBus.addEventListener('tcp-connected', (info)=>{
  // log peer info
  term.blue('--------------tcp-connected---------\n')
  term(`${info.id}:${info.name}\n`)
  term(`local address: ${info.localAddress}:${info.localPort}\n`)
  term(`remote address: ${info.remoteAddress}:${info.remotePort}\n`)

})

_eventBus.addEventListener('tcp-end', (id, name)=>{
  term.yellow('----------connection-ended----------\n')
  term(`${id}:${name}\n`)
})

_eventBus.addEventListener('tcp-close', ()=>{
  term.orange('-----closed-----\n')
})

_eventBus.addEventListener('tcp-error', (error)=>{
  term.red('------internal-server-Error------------ \n')
  term(error)
})

// Data
_eventBus.addEventListener('udp-data', (info, data)=>{
  // probably needs some data handler to reconstruct
  // the date in case of a file or someting
  term.green('----------------udp-data--------------\n')
  term.blue(`from: ${info.id}:${info.name}\n`)
  console.log(data)
})

_eventBus.addEventListener('tcp-data', (info, data)=>{
  term.green('----------------tcp-data--------------\n')
  term.blue(`from: ${info.id}:${info.name}\n`)
  console.log(data)

  //echo data
  if(search == "false"){
    const stamp = _keyStore.Store[0].keys.sym[0].stamp
    _linker.tcpSend(info.id, stamp, data)
    _linker.udpSend(info.id, stamp, data)
  }
})

//start
peer.Start(port)
if(search =="true")
  _discovery.SearchLocalNetwork([6562, 6563])
