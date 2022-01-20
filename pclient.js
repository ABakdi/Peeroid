import WebSocket from 'ws'
const port = process.argv[2]
const url = `ws://127.0.0.1:${port}`
const pclient = new WebSocket(url)
pclient.on('open', ()=>{
  // read commands from terminal
  // send command to peeriod daemon

})

pclient.on('error', (err)=>{
  console.log(err)
})

pclient.on('message', (msg)=>{
  // recive updates from peeriod daemon
  msg = JSON.parse(msg.toString())
  console.log(msg)
})
