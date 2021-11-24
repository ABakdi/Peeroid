import UuidTool from 'uuid-tool'
class PeersManager{
    constructor(){
        this.peers = []
    }

    addPeer(obj){
        this.peers.push({
            id: obj.id,
            name: obj.name,
            address: obj.address,
            port: obj.port,
            ref: obj.ref,
            key: obj.key
        })

    }


    getPeerById(id){
        return this.peers.find(c => c.id == id)
    }

    getPeersByName(name){
        return this.peers.filter(c => c.name == name)
    }

    getPeerByAddress(address, port){
        return this.peers.find(c => c.address == address && c.port == port)
    }

    removePeerById(id){
        let index = this.peers.findIndex(c => c.id == id)
        this.peers.splice(index, 1)
    }

    removePeerByName(name){
        this.peers = this.peers.filter(c => c.name != name)
    }

}

export default PeersManager


/*
const x = '3333333'
var client0 = {
    id: 1,
    name: "656565656",
    address: "125.156.12.15",
    port: 6666,
    ref: x
},
    client1 = {
    id: 2,
    name: "22222",
    address: "125.156.12.45",
    port: 6666,
    ref: x
},
    client2 = {
    id: 3,
    name: "6598463",
    address: "125.156.12.125",
    port: 6666,
    ref: x
},
    client3 = {
    id: 4,
    name: "99999",
    address: "125.156.122.165",
    port: 6666,
    ref: x
}
var TcpClients = new Clients()
console.log(TcpClients)

TcpClients.addClient(client0)
TcpClients.addClient(client1)
TcpClients.addClient(client2)
TcpClients.addClient(client3)

console.log(TcpClients)

TcpClients.removeClientById(3)

console.log(TcpClients)
*/
