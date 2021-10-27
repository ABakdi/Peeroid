import Client from '../client.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;

var EventBus = new EventEmitter()
const id = uuidv4()
const name = 'my-client'
var client = new Client(name, id, EventBus)

function yesOrNoQuestion(id, name, question){
  term(question)
  return new Promise(resolve => {
    term.yesOrNo({yes: ['y', 'ENTER'], no:['n']}, function(error, result){
      resolve(result)
      term.grabInput( false )
    })
  })
}

client.addEventListener('connection-request', async function(id, name){
  console.log('connection-request')
  const question = id + " : " + name + " want's to connect to you:[Y|n]\n"
  var ans = await yesOrNoQuestion(id, name, question)
  if(ans){
    client.ConnectToPeer(id)
  }else{
    client.RefuseConnection(id)
    console.log('Connection refused')
  }
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
  let s = client.Servers
  console.log(s)
})

client.addEventListener('udp-data', function(stamp, sequence, data){
  console.log('udp-data')
  console.log(stamp, sequence, data)
})



client.Start()
