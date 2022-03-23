import layout from './layout.js'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;
import commander from './commander.js'
import Peeroid_client from './Peeroid_client.js'
let HOST = '127.0.0.1',
    PORT = process.argv[2]

const CmdLineInterface = new layout()
const Commander = new commander()
const peeriod_client = new Peeroid_client()
// coordinates and dimensions
let x_cmd = 0,
    y_cmd = 0,
    cmd_width = term.width/2,
    cmd_height = term.height,

    x_tables = term.width/2,
    y_tables = 0,
    tables_width = term.width/2,
    tables_height = term.height/2,

    x_boardes = term.width/2,
    y_boardes = term.height/2 + 1,
    boardes_width = term.width/2,
    boards_height = term.height/2

// command line
CmdLineInterface.new_board('cmd', 'command line', cmd_height, cmd_width, x_cmd, y_cmd, false)
CmdLineInterface.show_board('cmd')
// fill bords with text
CmdLineInterface.insert_content('cmd', '^G> ')
// tables
CmdLineInterface.new_table('requests', ['reqID', 'name', 'ID', 'timout'], tables_height, tables_width, x_tables, y_tables)
CmdLineInterface.new_table('search', ['name', 'id'], tables_height, tables_width, x_tables, y_tables)
CmdLineInterface.show_table('search')

// scrollable

// tables
CmdLineInterface.new_scrollable_group('tables')
CmdLineInterface.add_to_scrollable_group('tables', 'requests', 'table')
CmdLineInterface.add_to_scrollable_group('tables', 'search', 'table')

// boards
CmdLineInterface.new_scrollable_group('boards')


// use key board to scroll

// scroll through tables
CmdLineInterface.add_inputAction('CTRL_LEFT', function(){
  let table = CmdLineInterface.scroll_next('tables', 1)

  // scroll tables
  CmdLineInterface.add_inputAction('CTRL_UP', function(){
    CmdLineInterface.scroll_table(table.name, 1)
  }, true)

  CmdLineInterface.add_inputAction('CTRL_DOWN', function(){
    CmdLineInterface.scroll_table(table.name, -1)
  }, true)

})

CmdLineInterface.add_inputAction('CTRL_RIGHT', function(){
  let table = CmdLineInterface.scroll_next('tables', -1)
  // scroll tables
  CmdLineInterface.add_inputAction('CTRL_UP', function(){
    CmdLineInterface.scroll_table(table.name, 1)
  }, true)
  CmdLineInterface.add_inputAction('CTRL_DOWN', function(){
    CmdLineInterface.scroll_table(table.name, -1)
  }, true)
})

// scroll through message boards

CmdLineInterface.add_inputAction('ALT_LEFT', function(){
  CmdLineInterface.scroll_next('boards', 1)
})

CmdLineInterface.add_inputAction('ALT_RIGHT', function(){
  CmdLineInterface.scroll_next('boards', -1)
})

CmdLineInterface.add_inputAction('ENTER', function(command){

  let cmd
  try{
    cmd = Commander.refactor_command(command)
    peeriod_client.command(cmd)
  }catch(e){
    CmdLineInterface.insert_content('cmd', `^R${e.message}\n`)
  }

  CmdLineInterface.insert_content('cmd', '^G> ')

})


// scroll tables
CmdLineInterface.add_inputAction('ALT_UP', function(){

})

CmdLineInterface.add_inputAction('ALT_DOWN', function(){

})

// keyboard context
CmdLineInterface.setKeyBoardContext('cmd', '^G')

peeriod_client.on('found-peer', (id, name)=>{
  Commander.add_to_connect(id, name)
  CmdLineInterface.add_row('search', [name, id])
})

let reqID = 0
peeriod_client.on('connection-request', (id, name, timeout)=>{
  reqID = reqID + 1
  Commander.add_to_accept(reqID.toString(), id, name)
  CmdLineInterface.add_row('requests', [reqID, name, id, timeout])
})

peeriod_client.on('peer-connected', (id, name)=>{

  CmdLineInterface.new_board(`${id}`, `${name}`, boards_height, boardes_width,
                            x_boardes, y_boardes, true)
  Commander.add_to_send(id, name)

  CmdLineInterface.insert_content(`${id}`, `^Rname: ^Y${name}\n^Rid: ^Y${id}`)

  CmdLineInterface.show_board(`${id}`)

  CmdLineInterface.add_to_scrollable_group('boards', `${id}`, 'board')

})

peeriod_client.on('tcp-data', (id, data)=>{
  CmdLineInterface.insert_content(`${id}`, `\n^G<: ^W${data.payload}`)
})

peeriod_client.on('tcp-data-sent', (id, data)=>{
  CmdLineInterface.insert_content(`${id}`, `\n^G:> ^w${data.payload}`)
})

peeriod_client.on('transfer-begins', (id, fileName, fileSize, direction)=>{
  try{
    CmdLineInterface.add_progressBar(`${id}`, `${fileName}`, `${direction=='incoming'? '<:' : ':>'}`+
                                   `${formatBytes(fileSize)}`)
  }catch(e){
    CmdLineInterface.insert_content('cmd', `^Rfile elready being sent.\n^G> `)
  }
})

peeriod_client.on('in-transfer', (id, fileName, fileSize, transBytes, direction)=>{
  CmdLineInterface.update_progressBar(`${id}`, `${fileName}`, transBytes/fileSize)
})

peeriod_client.on('transfer-ends', (id, fileName, fileSize, direction)=>{

})

try{
  peeriod_client.connect(HOST, PORT)
}catch(e){
  term.clear()
  term.red(`can't connect to peeriod daemon on ${HOST}:${PORT}`)
}

// code from
// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + '(' + sizes[i] + ')';
}
