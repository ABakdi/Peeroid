import EventEmitter from 'events'
import { isArray } from 'util'

class eventBus{
  constructor(){
    this.Bus = new EventEmitter()
    this.eventList = []
  }

  // returns a list of events that already exist
  _addEvents(events){
    if(typeof(events) == "string"){
      this.eventList.push(events)

    }else if(isArray(events)){

      if(events.some(e => typeof(e) != "string"))
        throw new Error('event name must be string')
      let existent
      events.forEach((e)=>{
        if(!this.eventList.includes(e))
          this.eventList.push(e)
        else
          existent.push(e)
      })

      return existent

    }else{
      throw new Error('events must be string or Array of strings')

    }

  }

  // returns events that does not exist in this.eventList
  _removeEvents(events){
    if(typeof(events) == "string"){
      this.eventList.push(events)

    }else if(isArray(events)){

      if(events.some(e => typeof(e) != "string"))
        throw new Error('event name must be string')

      let noneExistent = []
      events.forEach((e)=>{
        let index = this.eventList.indexOf(e)
        if(index != -1)
          delete this.eventList[index]
        else
          noneExistent.push(e)

      })

      return noneExistent

    }else{
      throw new Error('events must be string or Array of strings')

    }

  }

  addEventListener(event, callback){
    if(this.eventList.includes(event)){
      this.Bus.addListener(event, callback)

    }else{
      throw new Error('no such event')

    }

  }

  removeEventListener(){
    if(this.eventList.includes(event)){
      this.Bus.removeListener(event, callback)

    }else{
      throw new Error('no such event')

    }

  }

  Emmit(events, ...params){
    if(this.eventList.includes(event))
      this.Bus.emmit(events, ...params)
    else
      throw new Error('no such event')
  }

}
//test
