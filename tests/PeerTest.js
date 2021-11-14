import Peer from '../Peer.js'

const name = process.argv[2],
      port = Number(process.argv[3])

const peer = new Peer(name)
peer.Start(port)
peer.Search([6562, 6563])
