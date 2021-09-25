import terminal from 'terminal-kit';
const {terminal: term} = terminal;
const help = "\n help start search connect send recieve"
var command = ''
var lastTyped = ''
var history = [],
    index = -1

term.bold.green("> ")
term.grabInput()

function delete_handler(){
    command = command.substr(0, command.length -1)
    if(command == '')
        return
    term.left(1)
    term.delete(1)
}

function log_history(){
    if(!history.toString())
        return

    history.forEach(h =>{
        term.grey('\n' + h)
    })
}

function change_line(command){
    term.eraseLine.column(1)
    term.bold.green('> ' + command)
}

function history_handler(direction){

    if(!history.toString())
        return

    if(direction == 'up' && index < history.length - 1){
        index = index + 1
    }else if(direction == 'down' && index >= 0){
        index = index - 1
    }

    if(direction == 'down' && index == -1){
        command = lastTyped
        change_line(command)
        index = 0
        return
    }

    command = history[index]
    change_line(history[index])
}

function reformCommand(command){
    //split command string using spaces then remove emty strings
    // to get rid of extra spaces
    return command.split(' ').filter(c => c != '')
}

term.on('key', function(key, matches, data){
    switch(key){
        case 'UP':
            history_handler('up')
            break
        case 'DOWN':
            history_handler('down')
            break
        case 'RIGHT': term.right(1); break
        case 'LEFT': term.left(1); break
        case 'CTRL_C':
            term('\n')
            process.exit()

        case 'BACKSPACE':
            delete_handler()
            break

        case 'ENTER':

            index = -1
            //chek if user wrote somthing
            if(command != ''){
                history.unshift(command)
                let __command = reformCommand(command)

                // the first word in a cammand is the leader
                // it states the action that should be taken
                // the rest are parameters
                let leader = __command[0]

                //see what action the user wants (start, search, send ...)
                switch(leader){
                    case 'help':
                        //log help
                        term(help)
                        break
                        
                    case 'history':
                        log_history()

                    case 'start':
                        //Start()
                        break

                    case 'search':
                        //Search()
                        break

                    case 'connect':
                        //Connect()
                        break

                    case 'send':
                        //Send()
                        break

                    default:
                        term.bold.red("\n%s is not a valid command", leader)
                }

            }
            lastTyped = ''
            command = ''
            term.bold.green("\n> ")
            break

        default:
            let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
            lastTyped = lastTyped.concat(char)
            command = lastTyped
            term.bold.green(char)
            break

    }
    
})
