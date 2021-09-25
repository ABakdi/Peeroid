import dgram from 'dgram'
import net from 'net'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
/*
 * .the primary function of this class is to listen for servers ping
 *  if it is set to visible it will emmit an echo.
 *
 * .
 */
class Client{

    constructor(name, visible=true){

        if(!name){
            throw "Client Must Have A Name!"
        }

        this.Servers = new PeersManager()
        this.visible = visible
        this.onTcpDataCallback = undefined
        this.onTcpEndCallback = undefined
        this.onTcpErrorCallback = undefined
        this.name = name
        this.id = uuidv4()
        this.UdpClient = dgram.createSocket('udp4')

        this.foundPeers = []
    }

    setVisible(visible){
        this.visible = visible
    }

    getClient(address, port){
        return this.foundPeers.find((server)=>{
            if(address == server.address && port == server.port)
                return true
        })
    }

    discoveryHandler(message,remote){
        // chack if we already encountered this remote server befor
        // if yes then it must be stored in 'founPeers' list
        // we can get it using 'getClient' Method
        // if we did not encounter it befor the this wil return 'undefined'
        const isRemoteRecognized = this.getClient(remote.address, remote.port)

        // store the relevant information about this server for later use
        const remote_peer = {
            'id': message.body.id,
            'name': message.body.name,
            'address': remote.address,
            'port': remote.port
        }
                
        //echo ping only when visible
        if(this.visible){
            let reply = {
                'header': "__Echo",
                'body': {
                    'id': this.id,
                    'name': this.name
                }
            }
                    
            // convert reply ro buffer
            reply = Buffer.from(JSON.stringify(reply))
                    
            this.UdpClient.send(reply, 0, reply.length,remote_peer.port, remote_peer.address)
            if(!isRemoteRecognized){
                // if the remote peer is new
                // add it to the list of Peers
                this.foundPeers.push(remote_peer)
            }else if(message.header == "__Data"){
                //console.log('I Know This Guy: ', remote_peer)
            }
        }
    }

    Start(){
        this.UdpClient.on('message', (message, remote)=>{


            // convert message to JOSN
            message = JSON.parse(message.toString())

            // if message header is "__Ping"
            // this means server is loking for us
            if(message.header == "__Ping"){

                this.discoveryHandler(message, remote)

            // if remote is sending something other than "__Ping"
            }else{

            }

        })
        this.UdpClient.bind(6562)
    }

    setTcpDataHandler(onTcpDataCallback){
        this.onTcpDataCallback = onTcpDataCallback
    }

    setTcpEndHandler(onTcpEndCallback){
        this.onTcpEndCallback = onTcpEndCallback
    }

    setTcpErrorHandler(onTcpErrorCallback){
        this.onTcpErrorCallback = onTcpErrorCallback
    }

    getPeer(host, port){
        return this.Peers.find((peer)=>{
            if(peer.host == host && peer.port == port)
                return peer
        })
    }

    ConnectToPeer(host, port){
        let peer = this.getClient(host, port)
        if(!peer){
            console.log('Peer is not recognized')
            return
        }

        let options = {
            'host': peer.address,
            'port': peer.port
        }
        // Create TCP client.
        var client = net.createConnection(options, function () {
            console.log('Connection name : ' + peer.name);
            console.log('Connection local address : ' + client.localAddress + ":" + client.localPort);
            console.log('Connection remote address : ' + client.remoteAddress + ":" + client.remotePort);
        })

        //client.setTimeout(1000)

        client.setEncoding('utf8')

        // When receive server send back data.
        client.on('data', this.onTcpDataCallback)

        // When connection disconnected.
        client.on('end', this.onTcpEndCallback)

        /*
        client.on('timeout', function () {
            console.log('Client connection timeout. ')
        })
        */

        client.on('error', this.onTcpErrorCallback)

        return client
    }
}

var client = new Client("client")
client.Start()

client.setTcpDataHandler(function(data){
    console.log(data)
})

client.setTcpEndHandler(function(){
    console.log('connection endded')
})

client.setTcpErrorHandler(function(err){
    console.log(err)
})

setTimeout(()=>{
    var host = client.foundPeers[0].address,
        port = client.foundPeers[0].port
    console.log(host, port)
    client.ConnectToPeer(host, port)
}, 20000)

/*
function createClient(connName, host, port){

    var option = {
        host:host,
        port: port
    }
    // Create TCP client.
    var client = net.createConnection(option, function () {
        client.name = connName
        console.log('Connection name : ' + connName);
        console.log('Connection local address : ' + client.localAddress + ":" + client.localPort);
        console.log('Connection remote address : ' + client.remoteAddress + ":" + client.remotePort);
    })

    client.setTimeout(1000)
    client.setEncoding('utf8')

    // When receive server send back data.
    client.on('data', function (data) {
        console.log('Server return data : ' + data)
    })

    // When connection disconnected.
    client.on('end',function () {
        console.log('Client socket disconnect. ')
    })

    client.on('timeout', function () {
        console.log('Client connection timeout. ')
    })

    client.on('error', function (err) {
        console.error(JSON.stringify(err))
    })

    return client
}


var PORT = 6562
var client = dgram.createSocket('udp4')
var TcpClient = null
var recognized_Servers = []

function isRemoteRecognized(remote){
    if(this.address == remote.address && this.port == remote.port)
        return true
      return false
}

function echoPresence(visible, client, rinfo){
    if(visible){
        const message = Buffer.from('__Echo')
        client.send(message, 0, message.length, rinfo.port, rinfo.address,  function(){
            console.log("Sent: "+ message)
        })
    }
}

client.on('listening', function () {
    var address = client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port)
    //client.setBroadcast(true)
})

client.on('message', function (message, rinfo) {
    console.log('Message from: ' + rinfo.address + ':' + rinfo.port +' - ' + message);
    const remote_server = {
        "address":rinfo.address,
        "port": rinfo.port
    }
    const isRemoteNew = !recognized_Servers.some(isRemoteRecognized,
                                                remote_server)
    if(message == "__Ping" && isRemoteNew){
        console.log('New Guy: ', remote_server)
        recognized_Servers.push(remote_server)
        TcpClient = createClient('new guy', rinfo.address, rinfo.port)
        echoPresence(true, client, rinfo)
    }else{
        console.log("I Know This Guy", remote_server)
        echoPresence(true, client, rinfo)
    }
})

client.bind(PORT)
*/
