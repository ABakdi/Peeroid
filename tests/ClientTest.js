import Client from '../client.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'

var EventBus = new EventEmitter()
const id = uuidv4()
const name = 'my-client'
var client = new Client(name, id, EventBus)

client.addEventListener('connection-request', function(id, name){
  console.log('connection-request')
  console.log(id, name)
  client.ConnectToPeer(id)
})

client.addEventListener('tcp-data', function(data){
  console.log('tcp-data')
  console.log(data)
})


client.addEventListener('tcp-end', function(){
  console.log('tcp-end')
  console.log('connection ended')
})


client.addEventListener('tcp-error', function(error){
  console.log('tcp-error')
  console.log('Error: ' + error)
})

client.addEventListener('tcp-connected', function(info){
  console.log('tcp-connected')
  console.log(info)
})

client.addEventListener('udp-data', function(stamp, sequence, data){
  console.log('udp-data')
  console.log(stamp, sequence, data)
})



client.Start()
