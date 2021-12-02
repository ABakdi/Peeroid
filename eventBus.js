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
      if(this.eventList.includes(events))
        return events
      this.eventList.push(events)

    }else if(isArray(events)){

      if(events.some(e => typeof(e) != "string"))
        throw new Error('event name must be string')
      let existent = []
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
      let index = this.eventList.indexOf(events)
      if(index == -1)
        return events
      delete this.eventList[index]

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

  removeEventListener(event, callback){
    if(this.eventList.includes(event)){
      this.Bus.removeListener(event, callback)
    }else{
      throw new Error('no such event')

    }

  }

  Emit(event, ...params){
    if(this.eventList.includes(event))
      this.Bus.emit(event, ...params)
    else
      throw new Error('no such event')
  }

}

//--------------------------------------------------------------------//
//test
const Bus = new eventBus()
let events = ['hello', 'world', 'hi']
Bus._addEvents(events)
let helloHendler = (who) => console.log('hello', who)

Bus.addEventListener('hello', helloHendler)
Bus.addEventListener('world', (who) => console.log('hello', who))
Bus.addEventListener('hi', (who, jk) => console.log('hello', who, jk))

Bus.Emit('hello', 'kkkkkk')
Bus.Emit('world', 'kflkforfjog')
Bus.Emit('hi', 'Lopf', 'GLFMp')

Bus.removeEventListener('hello', helloHendler)

let p = Bus._addEvents(['hi', 'll', 'world'])
console.log(p)

Bus.Emit('hello')

p = Bus._removeEvents(['hi', 'll', 'lllem'])
console.log(p)
// error: no such event
//Bus.Emit('hi')
