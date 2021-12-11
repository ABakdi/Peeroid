import Peer from './Peer.js'
import Discover from './Discover.js'
import Linker from './Linker.js'
import keyStore from './keyStore.js'
import eventBus from './eventBus.js'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;
const name = process.argv[2],
      port = Number(process.argv[3]),
      search = process.argv[4]


const peer = new Peer(name, [6562, 6563])
const _eventBus = new eventBus()
const _keyStore = new keyStore()

const _discovery = new Discover(peer.udpSocket, peer.id, name)
const _linker = new Linker(peer.udpSocket)

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

peer._Discovery = _discovery
peer._eventBus  = _eventBus
peer._keyStore = _keyStore
peer._Linker = _linker


// Doscovery
_eventBus.addEventListener('found-peer', (info)=>{
  // log peer info
  term.green('-------------found-peer-------------')
  term(`${info.id}:${info.name}`)
  term(`${info.address}:${info.port}`)
})

// Connections

_eventBus.addEventListener('connection-request', (id, name)=>{
  term.green('------------connection-request---------')
  term(`from: ${id}:${name}'`)
})

_eventBus.addEventListener('tcp-client', (info)=>{
  // log peer info
  term.blue('--------------tcp-connection---------')
  term(`${info.id}:${info.name}`)
  term(`local address: ${info.localAddress}:${info.localPort}`)
  term(`remote address: ${info.remoteAddress}:${info.remotePort}`)
})

_eventBus.addEventListener('tcp-end', (id, name)=>{
  term.yellow('----------connection-ended----------')
  term(`${id}:${name}`)
})

_eventBus.addEventListener('tcp-close', ()=>{
  term.orange('-----closed-----')
})

_eventBus.addEventListener('tcp-error', (error)=>{
  term.red('------internal-server-Error------------ ')
  term(error)
})

// Data
_eventBus.addEventListener('udp-data', (info, data)=>{
  // probably needs some data handler to reconstruct
  // the date in case of a file or someting
  term.green('----------------udp-data--------------')
  term.blue(`from: ${info.id}:${info.name}`)
  term(data)
})

_eventBus.addEventListener('tcp-data', (info, data)=>{
  term.green('----------------tcp-data--------------')
  term.blue(`from: ${info.id}:${info.name}`)
  term(data)
})

//start
peer.Start(port)
if(search =="true")
  _discovery.SearchLocalNetwork([6562, 6563])
