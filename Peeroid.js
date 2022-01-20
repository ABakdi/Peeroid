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
    console.log('pclient')
    peeroidClient = client
    let peerID = null
    peeroidClient.on('message', message =>{
      // convert message to json
      let msg = JSON.parse(message.toString())

      // find out what command is being
      // given and act accordingly
      switch(msg.command){
        case 'connect':
          peerID = msg.param.id
          let keyStamp = '#echo'
          _linker.requestConnection(peerID, "#echo")
          break
        case 'local-search':
          _discovery.SearchLocalNetwork([6562, 6563])
          break

        case 'accept':
          peerID = msg.param.id
          _requests.resolveRmoteRequest(peerID, 'accepted')
          _linker.tcpConnect(peerID)
          break

        case 'send':
          peerID = msg.param.id
          let payload = {
            'payload': msg.param.payload
          }
          _linker.tcpSend(peerID, '#echo', payload)
          break
      }
        console.log(msg)
    })
  }
  else{
    client.send(JSON.stringify({'peeriod-client error':
                                'cant connect multple peeriod-clients, one is already running.'}))
    client.close()
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

function check_and_send(event, info, data){
  if(peeroidClient){
    let msg = {
      'event': event,
      'info': info,
      'data': data
    }
    msg = JSON.stringify(msg)
    peeroidClient.send(msg)
    console.log(msg)
  }
}

// Doscovery
_eventBus.addEventListener('found-peer', (info)=>{

  // send to peeriod-clients
  // if one is connected
  check_and_send('found-peer', info, null)
})

// Connections

_eventBus.addEventListener('connection-request', (id, name)=>{

  // send to peeriod-clients
  // if one is connected
  check_and_send('connection-request', {'id':id, 'name':name}, null)

})

_eventBus.addEventListener('tcp-client', (info)=>{

  // send to peeriod-clients
  // if one is connected
  check_and_send('peer-connected', info, null)
})

_eventBus.addEventListener('tcp-connected', (info)=>{
  // send to peeriod-clients
  // if one is connected
  check_and_send('peer-connected', info, null)

})

_eventBus.addEventListener('tcp-end', (id, name)=>{
  // send to peeriod-clients
  // if one is connected
  check_and_send('tcp-end', {'id': id, 'name': name}, null)
})

_eventBus.addEventListener('tcp-close', ()=>{
  term.orange('-----closed-----\n')
})

_eventBus.addEventListener('tcp-error', (error)=>{
  term.red('------internal-server-Error------------ \n')
  term(error)

  // send to peeriod-clients
  // if one is connected
  check_and_send('tcp-error', error, null)
})

// Data
_eventBus.addEventListener('udp-data', (info, data)=>{
  // probably needs some data handler to reconstruct
  // the date in case of a file or someting
  // send to peeriod-clients
  // if one is connected
  check_and_send('udp-data', info, data)
})

_eventBus.addEventListener('tcp-data', (info, data)=>{
  // send to peeriod-clients
  // if one is connected
  check_and_send('tcp-data', info, data)
})

//start
peer.Start(port)
