import Peer from '../Peer.js'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;

const name = process.argv[2],
      port = Number(process.argv[3]),
      search = process.argv[4]

const peer = new Peer(name, [6562, 6563])

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

peer.addEventListener('connection-request', async function(id, name){
  console.log('connection-request')
  const question = id + " : " + name + " want's to connect to you:[Y|n]\n"
  var ans = await yesOrNoQuestion(id, name, question)
  if(ans){
    peer._Linker.tcpConnect(id)
})

peer.addEventListener('tcp-client', function(tcp_client){
  console.log('tcp-client')
  //console.log(tcp_client)
  let fp = peer
  console.log('found peers', fp)
  let c = peer.Peers
  console.log(c)

})

peer.addEventListener('tcp-data', function(id, data){
  console.log('tcp-data')
  console.log(id, data)
})


peer.addEventListener('tcp-end', function(){
  console.log('tcp-end')
  console.log('connection ended')
})


peer.addEventListener('tcp-close', function(){
  console.log('tcp-close')
  console.log('conection closed')
})


peer.addEventListener('tcp-error', function(error){
  console.log('tcp-error')
  console.log('Error: ', error)
})


peer.addEventListener('found-peer', function(remote_peer){
  console.log('found-peer')
  console.log(remote_peer)

  console.log('trying to connect to: ', remote_peer.name)
  var id = remote_peer.id
  peer.ConnectionRequest(id)
})

peer.addEventListener('udp-data', function(id, data){
  console.log('udp-data')
  console.log(id, data)
})

peer.addEventListener('peer-accept', function(id, answer){
  console.log('tcp-accept')
  if(answer == 'yes'){
    console.log('connection accepted')
  }else{
    console.log('connection refused')
  }
})


peer.addEventListener('tcp-connected', async function(info){
  console.log('tcp-connected')
  console.log(info)
  let s = peer.Peers
  console.log(s)
  term.green('\n>>> ')
  let msg = await input()
  console.log(msg)
  let id = s.peers[0].id
  peer.TcpSend(id, 'tcp: '+msg)
  peer.UdpSend(id, 'udp: '+msg)
  peer.Kill(id)
})

peer.Start(port)
if(search == 'true')
  peer.Search()
