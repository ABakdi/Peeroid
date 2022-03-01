/*
 * there are tow types of request
 * local request: request made by local device "asking remote to connect to us"
 * remote request: reuest mede by remote device "remote is asking us to connect to it"
 * request format:
 * {
 *   id: peer uuid(local: peer we requested)(remote: peer requested us)
 *   status: "waiting"/"accepted"/"connected"
 * }
 *
 */
class Requests{
  constructor(){
    // local requests
    this.requests = []
    // remote requests
    this.remoteRequests = []
  }

  get remoteReq(){
    return this.remoteRequests
  }

  getRemoteRequestByName(name){
    return this.remoteRequests.find((req)=> req.name == name)
  }

  #getRequest(id){
    return this.requests.find((req)=> req.id == id)
  }

  #getRemoteRequest(id){
    return this.remoteRequests.find((req)=> req.id == id)
  }

  getRequestStatus(id){
    const req = this.#getRequest(id)
    if(!req)
      return null
    else
      return req.status
  }

  getRemoteRequestStatus(id){
    const req = this.#getRemoteRequest(id)
    if(!req)
      return null
    else
      return req.status
  }

  addRequest(id, name){
    const req = {
      'id': id,
      'name': name,
      'status' : 'waiting'
    }
    this.requests.push(req)
  }

  addRemoteRequest(id, name){
    const req = {
      'id': id,
      'name': name,
      'status' : 'waiting'
    }
    this.remoteRequests.push(req)
  }

  resolveRequest(id, res){
    const req = this.#getRequest(id)
    if(!req)
      throw new Error('no such request')
    else{
      req.status = res
    }
  }

  resolveRmoteRequest(id, res){
    const req = this.#getRemoteRequest(id)
    if(!req)
      throw new Error('no such request')
    else{
      req.status = res
    }
  }
}
export default Requests
