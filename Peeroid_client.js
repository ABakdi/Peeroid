import terminal from 'terminal-kit';
const {terminal: term} = terminal;
import EventEmitter from 'events'
import WebSocket from 'ws'

class Peeroid_client{
  constructor(){
    this.eventBus = new EventEmitter()
    this.client = null
  }

  connect(host, port){
    const url = `ws://${host}:${port}`
    try{
      this.client = new WebSocket(url)
      this.client.on('open', ()=> {
        this.eventBus.emit('open')
      })
    }catch(e){
      throw new Error('Error: could\'t connect to peeriod'+ e)
    }

    this.client.on('message', (msg)=>{
      msg = JSON.parse(msg.toString())
      switch(msg.event){
        case 'connection-request':
          this.eventBus.emit('connection-request', msg.info.id, msg.info.name, msg.info.timeout)
          break
        case 'found-peer':
          this.eventBus.emit('found-peer', msg.info.id, msg.info.name)
          break
        case 'peer-connected':
          this.eventBus.emit('peer-connected', msg.info.id, msg.info.name)
          break
        case 'tcp-data':
          this.eventBus.emit('tcp-data', msg.info.id, msg.data)
          break
        case 'udp-data':
          this.eventBus.emit('udp-data', msg.info.id, msg.data)
          break
        case 'requests-list':
          this.eventBus.emit('requests-list', msg.info.requests)
          break
        case 'connections-list':
          this.eventBus.emit('connections-list', msg.info.connections)
          break
        case 'tcp-data-sent':
          this.eventBus.emit('tcp-data-sent', msg.info, msg.data)
          break
        case 'transfer-begins':
          this.eventBus.emit('transfer-begins', msg.info.id, msg.info.fileName, msg.info.fileSize, msg.info.direction)
          break
        case 'in-transfer':
          this.eventBus.emit('in-transfer', msg.info.id, msg.info.fileName, msg.info.fileSize, msg.info.transBytes, msg.info.direction)
          break
        case 'transfer-complete':
          this.eventBus.emit('transfer-complete', msg.info.id, msg.info.fileName, msg.info.direction)
          break
      }
    })
  }

  check_connection(){
    if(this.client)
      return true
    else
      return false
  }

  get requests(){
    let msg = JSON.stringify({'command':'get-requests'})
    if(this.check_connection()){
      this.client.send(msg)
    }
    return new Promise((resolve, rejects)=>{
      // this is stupid, but i think I have no choice
      this.eventBus.on('requests-list', (reqs)=>{
        this.eventBus.removeListner('peers-list')
        resolve(reqs)
      })
    })
  }

  get connected(){
    let msg = JSON.stringify({'command':'get-peers'})
    if(this.check_connection()){
      this.client.send(msg)
    }
    return Promise((resolve, rejects)=>{
      // this is stupid, but i think I have no choice
      this.eventBus.on('peers-list', (peers)=>{
        this.eventBus.removeListner('peers-list')
        resolve(peers)
      })
    })
  }

  on(event, callback){
    this.eventBus.on(event, callback)
  }

  command(commandObject){
    let msg = JSON.stringify(commandObject)
    if(this.check_connection()){
      this.client.send(msg)
    }else{
      throw new Error('peeriod daemon disconnected')
    }
  }
}

export default Peeroid_client
/*testing*/
/*
let c = new peeroid_client()
c.connect('127.0.0.1', 8081)
setTimeout(async ()=>{
  let r = await c.requests
  console.log(r)
}, 2000)
*/
