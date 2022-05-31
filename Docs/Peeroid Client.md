# Peeroid Client:
Peeriod is best run as a background process, in order to keep a comunication channel open between you and other peers even when you close the client.
to interract with it peeroid has an open socket on localhost in order to send commands(send file, send message, connect to peer ...) and receive updates(connection requests, received message/file ...)
Peeroid client does all that under the hood and provides you with an api that can be used to send commands as a json and recieve updates as events.


### Getters:
1. **requests**:
	**asynchronos** , it will return all pending connection requests.

	*example:*
	```javascript
		let req = await peeriodClient.requests
		console.log(req)
		/*
			[{id: "1236-78645-312", name: "peer0"}, .......]
		*/
	```

2. **connected**:
	**asynchronos**, returns all connected peers.

	*example:*
	```javascript
		let con = await peeriodClient.connected
		console.log(con)
		/*
			[{id: "1236-78645-312", name: "peer0"}, .......]
		*/
	```

### Functions:

1. **connect**(*host*, *port*):
	connect to peeroid, peeroid should be running in the background as
2. **commnd**(*object*):
	takes an object (json) that contains: command, inputs, parameters.
	
	*example:*
	```javascript
    let cmd = {
		command: "send",
		params: {
			id: ['123-456-789', '985-6564-664']
			protocol: 'tcp'
		}
		inputs: ["hello wortld", "welcom"]
	}
	// send both strings in the inputs to both peers
	// with the ids in params, do this using the tcp protocol
	peeriodClient.command(cmd)
	```

 2. **on**(event, callback)
	 event: event name.
	 callback: function to call when event happens.

	 *example:*
	 ```javascript
		peeriodClient.on('tcp-data': (id, data)=>{
			console.log(id, data)
		})
	 ```


### Events:
 - **types**:
	**id**: uuidv4,
	**name**: String,
	**data**: object(json),
	**timeout**: Number
1. **connection-request**:
	peer requested a connection
	*parameters*: 
		**id**: peer's id,
		**name**: peer's name,
		**timeout**: request will expire after timeout.

	*example:*
	```javascript
	let accept_id= '123-456-789'
	peeroidClient.on('connection-request', (id, name, timeout)=>{
		if(id == accept_id){
			// accept connection-request from 'accept_peer'
			peeroidClient.command({
				command: 'accept',
				params:{
					id: [id]
				}
			})
		}
	})
	```

2. **found-peer**:
	when command *search* excuted a new peer has been found.
	*parameters*:
		**id**: peer's id,
		**name**: peer's name

	*example:*
	```javascript
	peeroidClient.on('found-peer', (id, name)=>{
		console.log(id, name)
	})
	let cmd = {
		command: 'search'
	}
	peeroidClient.command(cmd)
	```

3. **peer-connected**:
	when a new peer connects, this event only hapens after a connection request
	has been sent and accepted.
	*parameters*:
		**id**: peer's id.
		**name**: peer's name.

4. **tcp-data**:
	when receiving data from connected peer via *TCP* socket.
	*parameters*:
		**id**: sender  id.
		**data**: data received.

5.  **udp-data**:
	when receiving data from connected peer via *UDP* socket.
	*parameters*:
		**id**: sender id.
		**data**: data received.

6. **tcp-data-sent**:
	when sending data is complete.

	*example:*
	```javascript
	peeroidClient.on('tcp-data-send', (id, data)=>{
		// logs: sent hello world to 123-456-789
		console.log(`sent ${data.payload} to ${id}`)
	})
	let cmd = {
		command: 'send',
		params:{
			id: ['123-456-789'],
			protocol: 'tcp'
		},
		input: "hello world"
	}
	// send "hello world" to peer with id
	peeroidClient.command(cmd)
	```

7. **transfer-begins**:
	when file transfer begins
	*params*:
		**id**: sender / receiver id
		**fileName**: file name.
		**fileSize**: file size (bytes).
		**direction**: incoming/outgoing, is file being sent or received.

8. in-transfer:
	when chunck of a file currently in transfer has been sent or received,
	this is best used to see the progress of the transmission of a file.
	*params*:
		**id**: sender / receiver id
		**fileName**: file name.
		**fileSize**: file size (bytes).
		**transBytes**: transmitted bytes.
		**direction**: incoming/outgoing, is file being sent or received.
	
	*example:*
	```javascript
		// suppose we have been sent a file
		peeroidClient.on('in-tansfer',(id,fileName,fileSize,transBytes,direction)=>{
			console.log(`${direction} file ${fileName} from ${id}`)
			
			// log: "progress 10%" for example
			// this will increase each time we receive a chunk
			console.log(`progress: ${transBytes/fileSize * 100} %`)
			
		})

	```

9. **transfer-complete**:
	when the transfer of a file is complete
	*params*:
		**id**: sender / receiver id
		**fileName**: file name.
		**direction**: incoming/outgoing, is file being sent or received.