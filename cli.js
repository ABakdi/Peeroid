import terminal from 'terminal-kit';
const {terminal: term, TextTable, TextBox} = terminal;
var cursorIndex = 0,
    command = '',
    history = [],
    historyIndex = -1
var Xcursor = 0,
    Ycursor = 0

let doc = term.createDocument()

// text box for writing commands
let text = new TextBox({
    parent: doc,
    x: 0,
    y: 0,
    scrollable: true,
    hasVScrollBar: true,
    scrollY: 0,
    extraScrolling: true,
    contentHasMarkup: true,
    textAttr: { bgColor: 'default' },
    width: term.width/2,
    height: term.height,
})

// generate empty table with
// number of rows depending on the terminal height
let row_num = parseInt((term.height/2 -1)/2)
let content = []
for(let i = 0; i < row_num; i++)
    content.push(['', '', '', ''])

function make_table(header){
    // generate empty table with
    // number of rows depending on the terminal height
    let row_num = parseInt((term.height/2 -1)/2)
    let content = []
    // add header to table
    content.push(header)
    let empty_row = new Array(4).fill(' ')
    for(let i = 0; i < row_num-1; i++){
        content.push(empty_row)
    }

    return content
}

let req_table = new TextTable(
    {
        cellContents: make_table(['req ID', 'peer ID', 'name', 'timeout']),
        parent: doc,
        x: term.width/2,
        y: 0,
        hasBorder: true,
        contentHasMarkup: true,
        textAttr: { bgColor: 'default' },
        width: term.width/2,
        height: term.height/2 - 1,
        fit: true   // Activate all expand/shrink + wordWrap
    }
)

let search_table = new TextTable(
    {
        cellContents: make_table(['shourtcut', 'peer ID', 'name']),
        parent: doc,
        x: term.width/2,
        y: 0,
        hasBorder: true,
        contentHasMarkup: true,
        textAttr: { bgColor: 'default' },
        width: term.width/2,
        height: term.height/2 - 1,
        fit: true   // Activate all expand/shrink + wordWrap
    }
)
search_table.hide()
let peers_table = new TextTable(
  {
    cellContents: content,
    parent: doc,
    x: term.width/2,
    y: term.height/2,
    hasBorder: true,
    contentHasMarkup: true,
    textAttr: { bgColor: 'default' },
    width: term.width/2,
    height: term.height/2 - 1,
    fit: true   // Activate all expand/shrink + wordWrap
  }
)

function delete_handler(){
    // term.left(1)
    // term.delete(1)
    text.textBuffer.backDelete(1)
    command = command.substring(0, cursorIndex-1)+
        command.substring(cursorIndex)
    cursorIndex = cursorIndex - 1
    Xcursor = Xcursor - 1
}

function history_handler(dir){
    // do nothing if there is no
    if(history.length == 0)
        return

    if(dir == 'up'){
        if(historyIndex < history.length-1)
            historyIndex = historyIndex +1
    }else{
        if(historyIndex > 0)
            historyIndex = historyIndex -1
    }

    if(historyIndex >= 0 && historyIndex < history.length){
        // term.deleteLine()
        // term.column(0)
        // term.bold.green("> "+command)
        // FIXED
        text.textBuffer.moveToEndOfLine()
        text.textBuffer.backDelete(command.length)
        command = history[historyIndex]
        text.appendContent('^G'+command)
        cursorIndex = command.length
        Xcursor = command.length + 3
    }
}

function excute_command(command){
    // if command is empty do nothing
    if(command == "")
        return

    let cmd = command.split(' ')
    let send_to_peeroid = null
    let peerID = null
    switch(cmd[0]){
        case 'search':
            send_to_peeroid = {'command': 'local-search'}
            break
        case 'connect':
            try{
                peerID = found[Number(cmd[1])-1].id
                send_to_peeroid = {'command': 'connect', 'param':{'id': peerID}}
                text.appendContent('\n^B request has been sent if peer: ^G'+ peerID +
                                   '\n^Baccepts it will show up on the table')
                Ycursor = Ycursor + 2
            }catch(e){
                text.appendContent('\n^RError: ^B parameter must be a number ^G*shortcut*, got: ' + cmd[1])
                Ycursor = Ycursor + 1
            }
            break
        case 'send':
            let protocol
            switch(cmd[1]){
                case 'tcp':
                    protocol = 'tcp'
                    break
                case 'udp':
                    protocol = 'udp'
                    break
                default:
                    text.appendContent('\RError: ^B no such protocol: ^R' + cmd[1])
                    Ycursor = Ycursor + 1
            }

            try{
                peerID = peers[Number(cmd[2])-1].id
                send_to_peeroid = {'command': 'send', 'param':{'id': peerID, 'payload': cmd[3]}}
            }catch(e){
                text.appendContent('\n^RError: ^B parameter must be a number ^G*shortcut*, got: ' + cmd[2])
                Ycursor = Ycursor + 1
            }

            break
        case 'accept':
            try{
                let peerID = requests[Number(cmd[1])-1].id
                send_to_peeroid = {'command': 'accept', 'param':{'id': peerID}}
                text.appendContent('\n^B Connecting to: ^G'+ peerID +
                                   '\n^B peer will apear on table when connection is established')
                Ycursor = Ycursor + 2
            }catch(e){
                text.appendContent('\n^RError: ^B parameter must be a number ^G*shortcut*, got: ' + cmd[1])
                Ycursor = Ycursor + 1
            }
            break
        case 'show':
            switch(cmd[1]){
                case 'search':
                    req_table.hide()
                    search_table.show()
                    break
                case 'requests':
                    search_table.hide()
                    req_table.show()
                    break
                default:
                    text.appendContent('\n^RError: ^Bno such parameter for ^Gshow command ^G' + cmd[1])
                    Ycursor = Ycursor + 1
            }
            send_to_peeroid = null
        break

        default:
            // term.red('\nError:')
            // term.blue(' no such command')
            // term.green(cmd)
            text.appendContent('\n^RError: ^Bno such command ^G' + cmd[0])
            Ycursor = Ycursor + 1
    }

    // send command to peeriod daemon
    if(send_to_peeroid){
        send_to_peeroid = JSON.stringify(send_to_peeroid)
        peeriod_client.send(send_to_peeroid)
    }

}

term.on('key', function(key, matches, data){
    switch(key){
        case 'UP':
            history_handler('up')
            break
        case 'DOWN':
            history_handler('dwn')
            break
        case 'RIGHT':
            if(cursorIndex == command.length)
                break
            //term.right(1);
            text.textBuffer.moveRight()
            cursorIndex = cursorIndex + 1
            Xcursor = Xcursor + 1
            break
        case 'LEFT':
            if(cursorIndex == 0)
                break
            //term.left(1)
            text.textBuffer.moveLeft()
            cursorIndex = cursorIndex - 1
            Xcursor = Xcursor - 1
            break
        case 'CTRL_C':
            term.clear()
            process.exit()
            break

        case 'CTRL_L':
            text.textBuffer.setText('')
            text.appendContent('^G> '+command)
            Xcursor = 3 + command.length
            Ycursor = 1
            break

        case 'BACKSPACE':
            if(cursorIndex == 0)
                break
            historyIndex = -1
            delete_handler()
            break

        case 'ENTER':
            if(command.length > 0)
                history.unshift(command)
            excute_command(command)
            command = ''
            cursorIndex = 0
            Xcursor = 2
            historyIndex = -1
            // term.bold.green('\n> ')
            text.appendContent('\n^G> ')
            Xcursor = Xcursor + 1
            Ycursor = Ycursor + 1
            break

        default:
            let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
            //term.bold.green(char)
            text.textBuffer.insert('^G'+char, true)
            command = command.substring(0, cursorIndex) + char +
                command.substring(cursorIndex+1)
            cursorIndex = cursorIndex + 1
            Xcursor = Xcursor + 1
            break
    }

    // update TextBox
    text.redraw()
    // update cursor
    term.moveTo(Xcursor, Ycursor)
    
})
// connecting to Peeriod daemon
import WebSocket from 'ws'
const port = process.argv[2]
const url = `ws://127.0.0.1:${port}`
const peeriod_client = new WebSocket(url)
peeriod_client.on('open', ()=>{
    text.appendContent('^Bconnecting to Peeriod daemon....^Gconnected.'+
                    '\nyou can start commanding peeriod. Type ^Ghelp '+
                    'to list commands,\n^Ghelp command^ for command details.')
    text.appendContent('\n^G> ')

    Ycursor = Ycursor + 4
    Xcursor = Xcursor + 3
})

let requests = [],
    req_index = 1

let found = [],
    found_index = 1

let peers = [],
    peers_index = 0

peeriod_client.on('message', (msg)=>{
    // recive updates from peeriod daemon
    msg = JSON.parse(msg.toString())
    switch(msg.event){
        case 'connection-request':
            requests.push({'id' : msg.info.id, 'name': msg.info.name, 'timeout': 'inf'})
            if(req_index < 8){
                req_table.setCellContent(0, req_index, req_index)
                req_table.setCellContent(1, req_index, msg.info.id)
                req_table.setCellContent(2, req_index, msg.info.name)
                req_table.setCellContent(3, req_index, 'inf   ')
                req_table.redraw()
                term.moveTo(Xcursor, Ycursor)
            }
            req_index = req_index + 1
            break
        case 'found-peer':
            found.push({'id': msg.info.id, 'name': msg.info.name})
            if(req_index < 8){
                search_table.setCellContent(0, req_index, req_index)
                search_table.setCellContent(1, req_index, msg.info.id)
                search_table.setCellContent(2, req_index, msg.info.name)
                search_table.redraw()
                term.moveTo(Xcursor, Ycursor)
            }
            found_index = req_index + 1
            break
        case 'peer-connected':
            peers.push({'id': msg.info.id, 'name': msg.info.name})
            if(peers_index < 4){
                peers_table.setCellContent(0, peers_index, msg.info.name)
                peers_table.redraw()
                term.moveTo(Xcursor, Ycursor)
            }
            peers_index = peers_index + 1
            break

        case 'tcp-data':
            peers_table.setCellContent(1, 0, msg.data.payload)
            peers_table.redraw()
            term.moveTo(Xcursor, Ycursor)
            break
    }
})

term.grabInput()

doc.redraw()
term.moveTo(Xcursor, Ycursor)
