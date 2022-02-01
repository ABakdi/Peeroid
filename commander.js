
class Commander{
  constructor(){
    this.history = []
    this.defaults = {
      'send': {
        'params': {
          // param: type
          'protocol': ['tcp', 'udp', 'file', 'stream'],
          'name': 'string',
          'id': 'string'
        },
        'default_param': 'protocol',
        'default_value': 'name'
      },

      'show': {
        'params': {
          'requests': '',
          'search': '',
          'here': ''
        },
        'dafault_param': 'table',
        'dafaule_value': 'table'
      },

      'connect': {
        'params': {
          'name': 'string',
          'id': 'string'
        },
        'dafault_param': 'name',
        'dafaule_value': 'name'
      },

      'accept': {
        'params': {
          'request': 'string',
          'name': 'string'
        },
        'dafault_param': 'request',
        'dafaule_value': 'request'
      }
    }
  }
  refactor_command(command){
    let cmd = {}
    // if command is empty do nothing
    if(command == "")
        return false
    // split command where there are "
    // then remove empty strings
    let c = command.split(/"/).filter(e => e)
    let input
    if(c.length > 1)
      input = c.pop()
    else
      input = false

    if(input)
      cmd.input = input

    // command and parameters
    let cp = c[0].split(/ -/).filter(e => e)
    let _cmd = cp.shift().split(/ /).filter(e => e)
    cmd.command = _cmd.shift()
    cmd.params = {}
    if(_cmd.length > 0){
      if(_cmd.length > 1)
        cmd.params.default_values = _cmd
      else
        cmd.params.default_values = _cmd.shift()
    }
    console.log(cp)

    for(let i = 0; i < cp.length; i++){
      let temp = cp[i].split(/ /).filter(e => e)
      if(temp.length > 1){
        let param = temp.shift()
        if(temp.length > 1)
          cmd.params[param] = temp
        else
          cmd.params[param] = temp.shift()
      }else{
        cmd.params.default_param = temp.shift()
      }
    }
    return cmd
  }
}

let cmd = new Commander()
let c = 'send -tcp -name p1 p2 "hello world"'
//c = 'send p1 p2 p3 -tcp "hello, SSSsup"'
let r = cmd.refactor_command(c)
console.log(r)
