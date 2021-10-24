import Server from '../server.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'

var EventBus = new EventEmitter()
const id = uuidv4()
const name = 'my-server'
var server = new Server(name, id, EventBus)

server.addEventListener('tcp-client', function(tcp_client){
  console.log(tcp_client.id, tcp_client.name, tcp_client.address, tcp_client.port)
})

server.addEventListener('tcp-data', function(data){
  console.log(data)
})


server.addEventListener('tcp-end', function(){
  console.log('connection ended')
})


server.addEventListener('tcp-close', function(){
  console.log('conection closed')
})


server.addEventListener('tcp-error', function(error){
  console.log('Error: ', error)
})


server.addEventListener('found-peer', function(remote_peer){
  console.log(remote_peer)

  console.log('trying to connect to: ', remote_peer.name)
  var id = remote_peer.id
  server.ConnectToPeer(id)
})

server.addEventListener('udp-data', function(stamp, sequence, data){
  console.log(stamp, sequence, data)
})

server.addEventListener('peer-accept', function(id, answer){
  console.log(id, answer)
})




server.Start()
server.Search(6562)
