import terminal from 'terminal-kit';
const {terminal: term, TextTable, TextBox} = terminal;
import Peeroid_client from './Peeroid_client.js'
import Commander from './commander.js'
var cursorIndex = 0,
    command = '',
    history = [],
    historyIndex = -1
var Xcursor = 0,
    Ycursor = 0

let doc = term.createDocument()
let commander  = new Commander()
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


function make_table(header){
    // generate empty table with
    // number of rows depending on the terminal height
    let row_num = parseInt((term.height/2 -1)/2)
    let content = []
    // add header to table
    content.push(header)
    let empty_row = new Array(header.length).fill(' ')
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

let p_log0 = new TextBox({
    parent: doc,
    x: term.width/2,
    y: term.height/2,
    scrollable: true,
    hasVScrollBar: true,
    scrollY: 0,
    extraScrolling: true,
    contentHasMarkup: true,
    textAttr: { bgColor: 'default' },
    width: term.width/4,
    height: term.height/2,
})

let p_log1 = new TextBox({
    parent: doc,
    x: term.width/4,
    y: term.height/2,
    scrollable: true,
    hasVScrollBar: true,
    scrollY: 0,
    extraScrolling: true,
    contentHasMarkup: true,
    textAttr: { bgColor: 'default' },
    width: term.width/4,
    height: term.height/2,
})

let peer_log = [p_log0, p_log1]

function delete_handler(){
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
        text.textBuffer.moveToEndOfLine()
        text.textBuffer.backDelete(command.length)
        command = history[historyIndex]
        text.appendContent('^G'+command)
        cursorIndex = command.length
        Xcursor = command.length + 3
    }
}

function excute_command(command){
    let cmd = null
    // convert text command to object
    // if command syntax is not valid
    // show exeption
    try{
        cmd = commander.refactor_command(command)
    }catch(e){
        text.appendContent(`\n^R${e}`)
        Ycursor = Ycursor + 1
        return
    }
    let peerIDs = null
    switch(cmd.command){
        case 'search':
            break
        case 'connect':
            text.appendContent(`\n^B request has been sent if peer(s): ^G'+ ${peerIDs}`+
                               `\n^Baccepts it(they) will show up on the table`)
            peeroid_client.command(cmd)
            Ycursor = Ycursor + 2
        case 'send':
            peer_log[Number(cmd[2])-1].appendContent(`^G + ${cmd.input} \n`)
            peeroid_client.command(cmd)
            break
        case 'accept':
            text.appendContent(`\n^B Connecting to: ^G ${peerIDs}` +
                               '\n^B peer(s) will apear on table when connection is established')
            Ycursor = Ycursor + 2
            peeroid_client.command(cmd)
            break
        case 'show':
            switch(cmd.params.table){
                case 'search':
                    req_table.hide()
                    search_table.show()
                    break
                case 'requests':
                    search_table.hide()
                    req_table.show()
                    break
            }
        break
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
let peeroid_client = new Peeroid_client()
const port = process.argv[2]
const host = '127.0.0.1'
peeroid_client.on('open', ()=>{
    text.appendContent('^Bconnecting to Peeriod daemon....^Gconnected.'+
                    '\nyou can start commanding peeriod. Type ^Ghelp '+
                    'to list commands,\n^Ghelp command^ for command details.')
    text.appendContent('\n^G> ')

    Ycursor = Ycursor + 4
    Xcursor = Xcursor + 3
})

peeroid_client.connect(host, port)
let requests = [],
    req_index = 1

let found = [],
    found_index = 1

let peers = [],
    peers_index = 0

function get_peer_index(id){
    for(let i = 0; i<peers.length; i++){
        if(peers[i].id == id)
            return i
    }
    return false
}
peeroid_client.on('connection-request', (id, name, timeout)=>{
    if(req_index < 8){
        req_table.setCellContent(0, req_index, req_index)
        req_table.setCellContent(1, req_index, id)
        req_table.setCellContent(2, req_index, name)
        req_table.setCellContent(3, req_index, 'inf   ')
        req_table.redraw()
        term.moveTo(Xcursor, Ycursor)
    }
    commander.add_to_accept(req_index, id, name)
    req_index = req_index + 1
})

peeroid_client.on('found-peer', (id, name)=>{
    if(req_index < 8){
        search_table.setCellContent(0, req_index, req_index)
        search_table.setCellContent(1, req_index, id)
        search_table.setCellContent(2, req_index, name)
        search_table.redraw()
        term.moveTo(Xcursor, Ycursor)
    }
    commander.add_to_connect(id, name)
    found_index = req_index + 1
})

peeroid_client.on('peer-connected', (id, name)=>{
    if(peers_index < 2){
        peer_log[peers_index].appendContent("^Y" + id + "\n^Y" + name+ "\n^GConnected\n")
        term.moveTo(Xcursor, Ycursor)
    }
    commander.add_to_send(id, name)
    peers_index = peers_index + 1
})

peeroid_client.on('tcp-data', (id, data)=>{
    let index = get_peer_index(id)
    if(index < 2){
        peer_log[index].appendContent(data + "\n")
    }
    term.moveTo(Xcursor, Ycursor)
})

peeroid_client.on('udp-data', (id, data)=>{
    let index = get_peer_index(id)
    if(index < 2){
        peer_log[index].appendContent(data + "\n")
    }
    term.moveTo(Xcursor, Ycursor)
})
term.grabInput()

doc.redraw()
term.moveTo(Xcursor, Ycursor)
