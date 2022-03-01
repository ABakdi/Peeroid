import Peer from './Peer.js'
import Discover from './Discover.js'
import Linker from './Linker.js'
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
import terminal from 'terminal-kit'
import requests from './requests.js'
import FilesHandler from './FilesHandler.js'
import {WebSocketServer} from 'ws'
const {terminal: term} = terminal;
const name = process.argv[2],
      port = Number(process.argv[3]),
      sockPort = process.argv[4]


const peer = new Peer(name, [6562, 6563])
const _eventBus = new eventBus()
const _keyStore = new keyStore()
const _requests = new requests()
const _discovery = new Discover(peer.udpSocket, peer.id, name)
const _linker = new Linker(peer.udpSocket, peer.id, name)
const _files_handler = new FilesHandler(_eventBus)

// will send commands
// and recieves updates
let peeroidClient = null

// peeriod server
const server = new WebSocketServer({port: sockPort})
server.on('connection', (client) =>{
  console.log('P-Client')
  if(!peeroidClient){
    peeroidClient = client
    let peerIDs = []
    peeroidClient.on('message', message =>{
      // convert message to json
      let msg = JSON.parse(message.toString())
      console.log(msg)
      // find out what command is being
      // given and act accordingly
      switch(msg.command){
        case 'connect':
          if(msg.params.id)
            peerIDs = msg.params.id
          if(msg.params.name){
            msg.params.name.forEach((name)=>{
              let id = _discovery.getFoundPeerByName(name).id
              if(id)
                peerIDs.push(id)
            })
          }
          peerIDs.forEach((id)=>{
            let keyStamp = '#echo'
            _linker.requestConnection(id, "#echo")
          })
          peerIDs = []
          break
        case 'search':
          _discovery.SearchLocalNetwork([6562, 6563])
          break

        case 'accept':
          if(msg.params.id)
            peerIDs = msg.params.id
          if(msg.params.name){
            msg.params.name.forEach((name)=>{
              let id = _requests.getRemoteRequestByName(name).id
              if(id)
                peerIDs.push(id)
            })
          }
          peerIDs.forEach((id)=>{
            _requests.resolveRmoteRequest(id, 'accepted')
            _linker.tcpConnect(id)
          })
          peerIDs = []
          break

        case 'send':
          if(msg.params.id)
            peerIDs = msg.params.id
          if(msg.params.name){
            msg.params.name.forEach((name)=>{
              let id = _linker.Peers.getPeersByName(name).id
              if(id)
                peerIDs.push(id)
            })
          }
          let payload = {
            'payload': msg.input
          }
          switch(msg.params.protocol){
            case 'tcp':
              peerIDs.forEach((id)=>{
                _linker.tcpSend(id, '#echo', payload)
              })
              break
            case 'udp':
              peerIDs.forEach((id)=>{
                _linker.udpSend(id, '#echo', payload)
              })
              break
            case 'file':
              peerIDs.forEach((id)=>{
                _files_handler.readFile(id, payload)
              })
              break
          }
          peerIDs = []
          break

        case 'get-requests':
          let req = _requests.remoteReq
          check_and_send('requests-list', {'requests': req}, null)
          break

        case 'get-connections':
          let peers = _linker.peers
          check_and_send('peers-list', {'peers': peers}, null)
          break

      }
    })
  }
  else{
    client.send(JSON.stringify({'peeriod-client-error':
                                'cant connect multple peeriod-clients, one is already running.'}))
    client.close()
  }
})

// use the same event bus and keystrore for
// discovery link and peer in order
// to integrate every thing together
// this not particularly easy to understand later
// but it is what I will use willing to take that risk
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
    // console.log(msg)
    peeroidClient.send(msg)
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
  console.log(info, data)
  if(data.header == '__File'){
    let fileName = data.name
    _files_handler.newChunk(fileName, data.chunk)
  }else{
    check_and_send('udp-data', info, data)
  }
})

_eventBus.addEventListener('tcp-data', (info, data)=>{
  // send to peeriod-clients
  // if one is connected
  console.log(info, data)
  if(info.header == '__File'){
    _files_handler.newChunk(info.id, data.fileName, data.chunk)
  }else{
    check_and_send('tcp-data', info, data)
  }
})

_eventBus.addEventListener('tcp-data-sent', (id, data)=>{
  check_and_send('tcp-data-sent', id, data)
})
// receiving data
_eventBus.addEventListener('begin-incoming-file', (id, fileName, chunk)=>{
  _files_handler.newFile(id, fileName, chunk)
  check_and_send('transfer-begins', {'id': id, 'fileName': fileName, 'direction': 'incoming'}, null)
})

// recieving data
_eventBus.addEventListener('incoming-file-chunk', (id, fileName)=>{
    check_and_send('in-transfer', {'id': id, 'fileName': fileName, 'direction': 'incoming'}, null)
})

// recieving data
_eventBus.addEventListener('end-incoming-file', (id, fileName)=>{
  check_and_send('transfer-complete', {'id': id, 'fileName': fileName, 'direction': 'incoming'}, null)
})

// sending file
_eventBus.addEventListener('begin-outgoing-file', (id, fileName)=>{
  check_and_send('transfer-begins', {'id': id, 'fileName': fileName, 'direction': 'outgoing'}, null)
})

// sending data
_eventBus.addEventListener('outgoing-file-chunk', (id, fileName, chunk)=>{
  check_and_send('in-transfer', {'id': id, 'fileName': fileName, 'direction': 'outgoing'}, null)
  fileName = fileName.split('/').at(-1)
  _linker.tcpSend(id, '#echo', {'fileName': fileName, 'chunk': chunk}, '__File')
})

// sending data
_eventBus.addEventListener('end-outgoing-file', (id, fileName)=>{
  check_and_send('transfer-complete', {'id': id, 'fileName': fileName, 'direction': 'outgoing'}, null)
  fileName = fileName.split('/').at(-1)
  _linker.tcpSend(id, '#echo', {'fileName': fileName, 'chunk': '__END_OF_FILE'}, '__File')
})


//start
peer.Start(port)
