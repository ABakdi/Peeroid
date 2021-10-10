import terminal from 'terminal-kit';
const {terminal: term} = terminal;

import Server from './server.js'
import Client from './client.js'

const help = "\n help start search connect send standby"
var prevent_normal_operation = false

var command = ''
var lastTyped = ''
var history = [],
    index = -1
var cursorIndex = -1
term.bold.green("> ")
term.grabInput()
var deadMf = {}
var server = null
var peers_list = []
function Start(name){

    server = new Server(name)

    server.setNewTcpClientHandler(function(client){
        term.green('\nnew Tcp Client:', client)
    })

    server.setServerCloseHandler(function(){
        term.red("\nserver closed")
    })

    server.setServerErrorHandler(function(error){
        term.red('\nError: ', error)
    })

    server.setTcpDataHandler(function(data){
        term.blue("\nrecived: ", data)
    })

    server.setTcpEndHandler(function(){
        term.yellow('\nclient disconnect')
    })

    server.Start()
}

function ConnectByName(name){
    var peer = peers_list.find((e)=> e.name == name)
    if(peer){
        server.ConnectToPeer(peer.id)
    }else{
        term.red('\nno Such Peer: '+ name)
    }
}
function ConnectById(id){
    var peer = peers_list.find((e)=> e.id == id)
    if(peer){
        server.ConnectToPeer(peer.id)
    }else{
        term.red('\nno Such Peer id: '+ id)
    }
}

function Search(time){
    let nbFound = 0
    server.Search(6562, function(obj){
        nbFound += 1
        let peer = {
            "name":obj.name,
            "id": obj.id
        }
        peers_list.push(peer)
        term.blue("\n" + nbFound + ". " + peer.name + ": " + peer.id)
    })

    return new Promise(resolve =>{
        setTimeout(()=>{
            server.stopSearching()
            resolve( "Found " + nbFound + " peers")
        }, time*1000)
    })
}


function SendUdp(name, payload){
    peer.peers_list.find((e) => e.name == name)
    server.UdpSend(payload)
}

function StandBy(name){
    let client = new Client(name)

    client.setTcpDataHandler(function(data){
        term.white(data)
    })

    client.setTcpEndHandler(function(){
        term.yellow('\nConnection ended')
    })

    client.setTcpErrorHandler(function(err){
        term.error.red("\nError: "+err)
    })

    client.setNewTcpConnectionHandler(function(info){
        deadMf.id = info.id
        term.green("\n" + info.name + ' Connected, id: '+ info.id +'\n')
        term("\n" + info.localAddress + ', ' + info.remoteAddress)
    })

    client.Start()
    deadMf.client = client
    prevent_normal_operation = true
    term.grey("\nStandby mode: waiting for data\n CTRL_X to exit.\n")
}



// handle deleting charecters with backspace
function delete_handler(){
    //prevent more deletion if command is empty
    // or cursor is at the beginning
    if(command == '' || cursorIndex <= -1)
        return
    command = command.substr(0 ,cursorIndex) + command.substr(cursorIndex + 1)
    lastTyped = command
    term.left(1)
    term.delete(1)
    cursorIndex = cursorIndex - 1
}

function log_history(){
    if(!history.toString())
        return
    let i = 0
    history.forEach(h =>{
        i = i + 1
        term.grey('\n' + i + ": " + h)
    })
}

function change_line(command){
    term.eraseLine.column(1)
    term.bold.green('> ' + command)
    cursorIndex = command.length - 1
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

term.on('key', async function(key, matches, data){

    if(key == 'CTRL_X'){
        if(deadMf){
            deadMf.client.destroyConnection(deadMf.id, (info)=>{
                term.yellow('\ndisconnected from:\n'+ {...info})
                deadMf.client = null
                deadMf = {}
            })
        }
        prevent_normal_operation = false
        term.bold.green('\n> ')
        return
    }

    if(prevent_normal_operation)
        return

    switch(key){
        case 'UP':
            history_handler('up')
            break
        case 'DOWN':
            history_handler('down')
            break
        case 'RIGHT':
            term.right(1);
            cursorIndex = cursorIndex + 1
            break
        case 'LEFT':
            term.left(1)
            cursorIndex = cursorIndex - 1
            break
        case 'CTRL_C':
            term('\n')
            process.exit()

        case 'BACKSPACE':
            delete_handler()
            break

        case 'ENTER':
            cursorIndex = -1
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

                    case 'standby':
                        if(!__command[1]){
                            term.red.error('\n standby must have parameter name')
                            break
                        }
                        StandBy(__command[1])
                        break

                    case 'start':
                        if(__command[1]){
                            Start(__command[1])
                        }else{
                            term.red("\nServer Must have a name")
                        }
                        break

                    case 'search':
                        if(__command[1]){
                            let msg = await Search(Number(__command[1]))
                            term.blue('\n'+msg)
                        }else{
                            term.red("\n Must specify search time")
                        }
                        break

                    case 'connect':
                        if(__command[1]){
                            if(__command[1] == 'id'){
                                if(__command[2]){
                                    ConnectById(__command[2])
                                }else{
                                    term.red("\nMust specify remote peer id")
                                }
                            }else{
                                ConnectByName(__command[1])
                            }
                        }else{
                            term.red("\nMust specify remote peer id or name")
                        }
                        break

                    case 'send':
                        if(__command[1]){
                            if(__command[1] == "tcp"){
                                //SendTcp()
                            }else if(__command[1] == "udp"){
                                if(_command[2] == "files"){
                                  // SendFilesUdp()
                                }else{
                                    if(__command[2]){
                                        SendUdp(__command[2])
                                    }else{
                                        term.red("\nMust specify something to send String/files")
                                    }
                                }
                            }else{
                                term.red("\n" + __command[1] + " is not a valid protocal")
                            }
                        }else{
                            term.red("\nMust specify protocol udp/tcp")
                        }
                        //Send()
                        break

                    default:
                        term.bold.red("\n%s is not a valid command", leader)
                }

            }
            lastTyped = ''
            command = ''
            if(!prevent_normal_operation)
                term.bold.green("\n> ")
            break

        default:
            let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
            term.bold.green(char)
            cursorIndex = cursorIndex + 1
            command = command.concat(char)
            lastTyped = command
            break

    }
    
})
