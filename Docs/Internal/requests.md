# Requests:
to connect to a remote peer you need to send a connection-request, the remote peer will connect to you if your requests is accepted, if connection is attempted without a request the connection will fail.

there are two types of requests:
- requests: sent by this peer to remote.
- remoteRequests: sent by remote to this peer. 
###### request status:
`waiting`: wating for accept/refuse
`accepted`
`refused`
`timedout`: request expired
```JSON
{
	id: '' /*sentBy/sentTo*/,
	status: ''/*waiting accepted refused timedout*/
	timeout: 50000/*millisecons*/
}
```

# Methods:
##### getters:
1. Req:
returns an array of all requests sent by this peer

2. remoteReq:
returns all requests recieved from all peers

##### functions:
1. getRemoteRequestByName(name)
2. getRequestStatus(id)
3. getRemoteRequestStatus(id)
4. addRequest(id, name):  default status `waiting`
5. addRemoteRequest(id, name):  default status `waiting`
6. resolveRequest(id, res): *res* must be `accepted` or `refused`
7. resolveRmoteRequest(id, res): *res* must be `accepted` or `refused` 
