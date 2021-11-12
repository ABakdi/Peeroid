import Client from '../client.js'
import {v4 as uuidv4} from 'uuid'
import EventEmitter from 'events'
import terminal from 'terminal-kit';
import { resolve } from 'dns';
const {terminal: term} = terminal;

var EventBus = new EventEmitter()
const id = uuidv4()
const name = 'my-client'
var client = new Client(name, id, EventBus)


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

client.addEventListener('tcp-connected', async function(info){
  console.log('tcp-connected')
  console.log(info)
  let s = client.Servers
  console.log(s)
  term.green('\n>>> ')
  let msg = await input()
  s.peers[0].ref.write(msg)
  client.UdpSend()
})

client.addEventListener('udp-data', function(stamp, sequence, data){
  console.log('udp-data')
  console.log(stamp, sequence, data)
})



client.Start()
