
class Commander{
  constructor(){
    this.history = []
    this.defaults = {
      'send': {
        'params': {
          'protocol': ['tcp', 'udp', 'file', 'stream'],
          'name': [],
          'id': []
        },
        'default_param': 'protocol',
        'default_value': 'name',
        'input': true
      },

      'show': {
        'params': {
          'table': ['requests', 'search'],
          'here': ['requests', 'search', 'progress']
        },
        'default_param': 'table',
        'default_value': 'table'
      },

      'connect': {
        'params': {
          'name': [],
          'id':  []
        },
        'default_param': 'name',
        'default_value': 'name'
      },

      'accept': {
        'params': {
          'request': [],
          'name': [],
          'id': []
        },
        'default_param': 'request',
        'default_value': 'request'
      }
    }
  }

  add_to_send(id, name){
    this.defaults.send.params.id.push(id)
    this.defaults.send.params.name.push(name)
  }

  add_to_accept(reqID, id, name){
    this.defaults.accept.params.request.push(reqID)
    this.defaults.accept.params.id.push(id)
    this.defaults.accept.params.name.push(name)
  }

  add_to_connect(id, name){
    this.defaults.connect.params.id.push(id)
    this.defaults.connect.params.name.push(name)
  }

  refactor_command(command){
    // command format
    // command default_value -defult_param param
    // let example = 'send p1 -tcp -id 123-456-789 -name p2 "I'am of the opinion that Carthage must be destroyed"'
    let cmd = {}
    // if command is empty do nothing
    if(command == "")
        return false
    // split command where there are "
    // then remove empty strings
    // the command will be split in tow
    // the command-parameters part and the input part
    // example =>
    // send p1 -id 123-456-789 -name p2 | I'am of the opinion that Carthage must be destroyed
    //     command + prameters          | input
    let _cmd_param_input = command.split(/"/).filter(e => e)
    let _input = null
    if(_cmd_param_input.length > 1)
      _input = _cmd_param_input.pop()
    else
      _input = false

    if(_input)
      cmd.input = _input

    // command and parameters
    let _cmd_param = _cmd_param_input[0].split(/ -/).filter(e => e)
    // command and default parameters
    let _cmd_default = _cmd_param.shift().split(/ /).filter(e => e)
    // parameters
    let _params = _cmd_param
    // the first element is the command
    // the rest if there any are
    // the default parameters
    let _cmd = _cmd_default.shift()
    let _default = _cmd_default
    // check if command exists
    // if not throw error
    if(_cmd in this.defaults){
      cmd.command = _cmd
    }else{
      throw new Error(`no such command ${_cmd}`)
    }
    cmd.params = {}
    if(_default.length > 0){
      let default_value = this.defaults[cmd.command].default_value
      cmd.params[default_value] = []
      // for all default values
      _default.forEach((val)=>{
        // check if such value is allowed
        console.log(cmd.command, default_value)
        if(this.defaults[cmd.command].params[default_value].includes(val))
          cmd.params[default_value].push(val)
        else
          throw new Error(`no such ${default_value}: ${val}`)
      })
    }

    for(let i = 0; i < _params.length; i++){
      // parameter and it's values
      let _param_value = _params[i].split(/ /).filter(e => e)
      // parameter
      let _param = _param_value.shift()
      // parameter values
      let _values = _param_value
      // if there is no values
      // then it is the default
      // if not, add the parametr and
      // its values to the cmd object
      if(_values.length > 0){
        if(!(_param in this.defaults[cmd.command].params))
          throw new Error(`cammand ${cmd.command} has no such parameter ${_param}`)
        // assign empty aray
        // it will be poupulated
        // by the parameter values
        cmd.params[_param] = []
        _values.forEach((val)=>{
          // check if val is
          // an accepteble value
          // for said parameter
          if(this.defaults[cmd.command].params[_param].includes(val)){
            // add val to the values list
            cmd.params[_param].push(val)
          }else{
            throw new Error(`no such ${_param}: ${val}`)
          }
        })
      }else{
        // get the default parameter
        let default_param = this.defaults[cmd.command].default_param
        // check if default parameter accepts the passed value
        if(this.defaults[cmd.command].params[default_param].includes(_param)){
          // assign passed value to default parameter
          cmd.params[default_param] = _param
        }else{
          throw new Error(`no such ${default_param}: ${_param}`)
        }
      }
    }
    return cmd
  }
}
export default Commander

/*Testing*/
/*
let cmd = new Commander()
cmd.add_to_send('123-456-789', 'p1')
cmd.add_to_send('123-654-965', 'p2')
cmd.add_to_send('156-895-874', 'p3')
cmd.add_to_connect('124-235-568', 'p4')
cmd.add_to_accept('23', '15467', 'p5')
console.log(cmd.defaults.connect.params)
let c = 'send -tcp -name p1 p2 "hello world"'
c = 'send p1 p2 p3 -tcp "hello, SSSsup"'
c = 'connect p4'
c = 'accept -name p5'
c = 'show requests'
let r = cmd.refactor_command(c)
console.log(r)
*/
