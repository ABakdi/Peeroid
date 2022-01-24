import terminal from 'terminal-kit';
const {terminal: term} = terminal;
import Event from 'events'

class peeroid_client(){
  constructor(){
    this.EventBus = new Event()
  }

  connect(host, port){
    const url = `ws://${host}${port}`
    try{
      const peeriod_client = new WebSocket(url)
    }catch(e){
      throw new Error('Error: could\'t connect to peeriod'+ e)
    }

    peeriod_client.on('message', (msg)=>{
      msg = JSON.parse(msg.toString())
      switch(msg.event){
        case 'connection-request':
          requests.push({'id' : msg.info.id, 'name': msg.info.name, 'timeout': 'inf'})
          req_index = req_index + 1
          break
        case 'found-peer':
          found.push({'id': msg.info.id, 'name': msg.info.name})
          found_index = req_index + 1
          break
        case 'peer-connected':
          peers.push({'id': msg.info.id, 'name': msg.info.name})
          peers_index = peers_index + 1
          break
        case 'tcp-data':
        case 'udp-data':
          let index = get_peer_index(msg.info.id)
          break
      }
      this.EventBus.emmit(msg.event)
    }

  get requests(){

  }

  get connected(){

  }

  addEventListener(event, callback){

  }
}
