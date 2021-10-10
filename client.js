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
        //contains list of servers we are connected to with Tcp
        this.Servers = new PeersManager()
        // if true we can be found when searching
        this.visible = visible
        // called when recieving data with tcp
        this.onTcpDataCallback = undefined
        // called when tcp connection end
        this.onTcpEndCallback = undefined
        // called when tcp erro occurs
        this.onTcpErrorCallback = undefined
        //called when connected to new tcp peer
        this.onNewTcpConnection
        
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
            }

        }
    }

    getPeerById(id){
        return this.foundPeers.find((client)=>{
            if(id == client.id)
                return true
        })
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
            }else if(message.header == "__CONNECT"){
                this.ConnectToPeer(message.body.id)
            }

        })
        this.UdpClient.bind(6562)
        return this
    }

    setTcpDataHandler(onTcpDataCallback){
        this.onTcpDataCallback = onTcpDataCallback
        return this
    }

    setTcpEndHandler(onTcpEndCallback){
        this.onTcpEndCallback = onTcpEndCallback
        return this
    }

    setTcpErrorHandler(onTcpErrorCallback){
        this.onTcpErrorCallback = onTcpErrorCallback
        return this
    }
    
    setNewTcpConnectionHandler(onNewTcpConnection){
        this.onNewTcpConnection = onNewTcpConnection
        return this
    }

    getPeer(host, port){
        return this.Peers.find((peer)=>{
            if(peer.host == host && peer.port == port)
                return peer
        })
    }

    ConnectToPeer(id){
        let peer = this.getPeerById(id)
        if(!peer){
            console.log('Peer is not recognized')
            return
        }

        let options = {
            'host': peer.address,
            'port': peer.port
        }

        var tcpClient = {
            id: null,
            name: null,
            address: null,
            port: null,
            ref: null
        }
        // Create TCP client.
        var client = net.createConnection(options, ()=>{
            let info = {
                'localAdress': client.localAddress,
                'remoteAddress': client.remoteAddress,
                'name': peer.name,
                'id': peer.id
            }
            var address_temp = client.remoteAddress.split(':')
            tcpClient.address = address_temp
            tcpClient.port = address_temp[1]
            tcpClient.name = peer.name
            tcpClient.id = peer.id
            tcpClient.ref = client
            this.Servers.addPeer(tcpClient)
            this.onNewTcpConnection(info)
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

    }
    
    destroyConnection(id, onConnectionDestroyed){
        let client = this.Servers.getPeerById(id)
        client.ref.destroy()
        onConnectionDestroyed(client)
    }
}

export default Client
/*
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
*/
