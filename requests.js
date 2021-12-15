class Requests{
  constructor(){
    this.requests = []
    this.remoteRequests = []
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

  addRequest(id){
    const req = {
      'id': id,
      'status' : 'waiting'
    }
    this.requests.push(req)
  }

  addRemoteRequest(id){
    const req = {
      'id': id,
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
