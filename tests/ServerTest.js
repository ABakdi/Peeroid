import Server from '../server.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;

var EventBus = new EventEmitter()
const id = uuidv4()
const name = 'my-server'
var server = new Server(name, id, EventBus)

server.addEventListener('tcp-client', function(tcp_client){
  console.log('tcp-client')
  console.log(tcp_client)
})

server.addEventListener('tcp-data', function(data){
  console.log('tcp-data')
  console.log(data)
})


server.addEventListener('tcp-end', function(){
  console.log('tcp-end')
  console.log('connection ended')
})


server.addEventListener('tcp-close', function(){
  console.log('tcp-close')
  console.log('conection closed')
})


server.addEventListener('tcp-error', function(error){
  console.log('tcp-error')
  console.log('Error: ', error)
})


server.addEventListener('found-peer', function(remote_peer){
  console.log('tcp-peer')
  console.log(remote_peer)

  console.log('trying to connect to: ', remote_peer.name)
  var id = remote_peer.id
  server.ConnectToPeer(id)
})

server.addEventListener('udp-data', function(stamp, sequence, data){
  console.log('tcp-data')
  console.log(stamp, sequence, data)
})

server.addEventListener('peer-accept', function(id, answer){
  console.log('tcp-accept')
  if(answer == 'yes'){
    console.log('connection accepted')
    let c = server.Clients
    console.log(c)
  }else{
    console.log('connection refused')
  }
})

server.Start()
server.Search(6562)
