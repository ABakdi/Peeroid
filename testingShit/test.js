import Server from '../server.js'
import Client from '../client.js'

const client = new Client("client")
const server = new Server("server")

client.setTcpDataHandler(function(data){
    console.log(data)
})

client.setTcpEndHandler(function(){
    console.log('connection endded')
})

client.setTcpErrorHandler(function(err){
    console.log(err)
})




server.setNewTcpClientHandler(function(client){
  console.log('new Tcp Client:', client)
})

server.setServerCloseHandler(function(){
  console.log("server closed")
})

server.setServerErrorHandler(function(error){
  console.log('Error: ', error)
})

server.setTcpDataHandler(function(data){
  console.log("recived: ", data)
})

server.setTcpEndHandler(function(){
  console.log('client disconnect')
})


client.Start()
server.Start()

server.Search(6562, function(obj){
  console.log('found peer')
})

setTimeout(()=>server.stopSearching(), 15000)


setTimeout(()=>{
    var host = client.foundPeers[0].address,
        port = client.foundPeers[0].port
    console.log(host, port)
    client.ConnectToPeer(host, port)
}, 20000)


