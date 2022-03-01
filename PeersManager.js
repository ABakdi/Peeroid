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
            tcpSocket: obj.tcpSocket,
        })

    }


    getPeerById(id){
        return this.peers.find(c => c.id == id)
    }

    getPeersByName(name){
        return this.peers.find(c => c.name == name)
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

