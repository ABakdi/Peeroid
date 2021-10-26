import dgram from 'dgram'
import net from 'net'
import PeersManager from './PeersManager.js'
import {v4 as uuidv4} from 'uuid'
import { error } from 'console'
/*
 * .the primary function of this class is to listen for servers ping
 *  if it is set to visible it will emmit an echo.
 *
 * .
 */
class Client{

    constructor(name, id, EventBus, visible=true){

        if(!name){
            throw "client must have a name"
        }

        if(!id){
            throw "client must have an id"
        }

        //contains list of servers we are connected to with Tcp
        this.Servers = new PeersManager()

        // if true we can be found when searching
        this.visible = visible

        this.name = name
        this.id = id

        this.EventBus = EventBus

        this.eventsList = ['tcp-data', 'tcp-end','tcp-error', 'tcp-connected',
                           'udp-data', 'connection-request']

        this.UdpClient = dgram.createSocket('udp4')

        this.foundPeers = []

        this.EventBus.on('#peer-ping', this.#discoveryHandler)
    }

    setVisible(visible){
        this.visible = visible
    }

    getServerById(id){
        return this.foundPeers.find((client)=>{
            if(id == client.id)
                return true
        })
    }

    getServerByAddress(address, port){
        return this.foundPeers.find((server)=>{
            if(address == server.address && port == server.port)
                return true
        })
    }

    // using an arrow function to keep 'this' pointing at this class
    // when calling this function on '#peer-ping' Event
    #discoveryHandler = (remote_peer)=>{
        // chack if we already encountered this  server befor
        // if no then it must be stored in 'foundPeers' list

        // if we did not encounter it befor the this will return 'undefined'
        const isRemoteRecognized = this.getServerByAddress(remote_peer.address, remote_peer.port)


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

    Start(){
        this.UdpClient.on('message', (message, remote)=>{


            // convert message to JOSN
            message = JSON.parse(message.toString())

            // if message header is "__Ping"
            // this means server is loking for us
            if(message.header == "__Ping"){
                // store the relevant information about this server for later use
                const remote_peer = {
                    'id': message.body.id,
                    'name': message.body.name,
                    'address': remote.address,
                    'port': remote.port
                }

            this.EventBus.emit('#peer-ping', remote_peer)

            // if remote is sending something other than "__Ping"
            }else if(message.header == "__Connect"){
                this.EventBus.emit('connection-request', message.body.id, message.body.name)

            }
            else if(message.header == "__Data"){
                this.EventBus.emmit('udp-data')
            }

        })
        this.UdpClient.bind(6562)
        return this
    }

    addEventListener(event, callback){
        if(!this.eventsList.includes(event)){
            throw 'event does not exist: '+event
        }

        this.EventBus.addListener(event, callback)
    }

    UdpSend(message, Port, Address, onSendCallback){
        message = Buffer.from(message)
        this.UdpClient.send(message, 0, message.length, Port, Address, onSendCallback)
    }

    RefuseConnection(id){
        let peer = this.getServerById(id)
        if(!peer){
            throw 'Peer is not recognized'
        }

        let options = {
            'host': peer.address,
            'port': peer.port
        }

        let msg = {
            'header': '__Accept',
            'body':{
                id: this.id,
                answer: 'no'
            }
        }
        msg = JSON.stringify(msg)

        this.UdpSend(msg, peer.port, peer.address)
    }

    ConnectToPeer(id){
        let peer = this.getServerById(id)
        if(!peer){
            throw 'Peer is not recognized'
        }

        let options = {
            'host': peer.address,
            'port': peer.port
        }

        let msg = {
            'header': '__Accept',
            'body':{
                id: this.id,
                answer: 'yes'
            }
        }
        msg = JSON.stringify(msg)

        this.UdpSend(msg, peer.port, peer.address)
       // Create TCP client.
        var client = net.createConnection(options, ()=>{
            let info = {
                'localAdress': client.localAddress,
                'remoteAddress': client.remoteAddress,
                'localPort': client.localPort,
                'remotePort': client.remotePort,
                'name': peer.name,
                'id': peer.id
            }
            var address_temp = client.remoteAddress

            var tcpClient = {
                'id' : peer.id,
                'name' : peer.name,
                'address' : address_temp,
                'port' : address_temp,
                'ref' : client
            }
            this.Servers.addPeer(tcpClient)

            this.EventBus.emit('tcp-connected', info)
        })
        //client.setTimeout(1000)

        client.setEncoding('utf8')

        // When receive server send back data.
        client.on('data', (data)=>{
            this.EventBus.emit('tcp-data', data)
        })

        // When connection disconnected.
        client.on('end', ()=>{
            this.EventBus.emit('tcp-end')
        })

        /*
        client.on('timeout', function () {
            console.log('Client connection timeout. ')
        })
        */

        client.on('error', ()=>{
            this.EventBus.emit('tcp-error', error)
        })


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
