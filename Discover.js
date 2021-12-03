class Discover{
  constructor(udpSocket, eventBus, keyStore){
    // found me
    this.pingList = []
    // found
    this.echoList = []
    //any user with the id/address in this list
    // will be prevented from connecting to us
    // pings from it will be simply ignored
    this.blockList = []

    this.udpSocket = udpSocket
    this.eventBus = eventBus
    this.keyStore = keyStore
  }

  getFoundPeerById(id){
    return this.echoList.find((peer)=>{
      if(id == peer.id)
        return true
    })
  }

  getFoundPeerByAddress(address, port){

  }

  getFoundMEPeerById(id){
    return this.pingList.find((peer)=>{
      if(id == peer.id)
        return true
    })

  }

  getFoundMEPeerByAddress(address, port){

  }
  

  Ping(port){

  }

  Echo(port){

  }

  SearchLocalNetwork(portList){

  }
  // this method will allow peers to connect across the internet
  // by sending request to a discovery service server
  // or a stable "provider node" on the peeriod network
  SearchPeeroidNetwork(){
    // TODO
  }

}
