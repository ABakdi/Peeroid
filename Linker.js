import PeersManager from './PeersManager.js'

class Linker{
  constructor(tcpSocket, udpSocket){
    this.tcpSocket = tcpSocket
    this.udpSocket = udpSocket
    this.Peers = new PeersManager()

  }

  tcpConnect(address, port){

  }

  udpConnect(address, port){

  }

  tcpSend(id, json){

  }

  udpSend(id, json){

  }
}
