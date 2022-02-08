import layout from './layout.js'
import terminal from 'terminal-kit';
const {terminal: term} = terminal;

const CmdLineInterface = new layout()

// coordinates and dimensions
let x_cmd = 0,
    y_cmd = 0,
    cmd_width = term.width/2,
    cmd_height = term.height,

    x_tables = term.width/2,
    y_tables = 0,
    tables_width = term.width/2,
    tables_height = term.height/2 - 1,

    x_boardes = term.width/2,
    y_boardes = term.height/2,
    boardes_width = term.width/2,
    boards_height = term.height/2

// command line
CmdLineInterface.new_board('cmd', 'command line', cmd_height, cmd_width, x_cmd, y_cmd, false)
CmdLineInterface.show_board('cmd')
// message boards
CmdLineInterface.new_board('p1', 'p1 message board', boards_height, boardes_width, x_boardes, y_boardes, true)
CmdLineInterface.new_board('p2', 'p2 message board', boards_height, boardes_width, x_boardes, y_boardes, true)
CmdLineInterface.show_board('p1')
// fill bords with text
CmdLineInterface.insert_content('cmd', 'write commands here', 0, 0)
CmdLineInterface.insert_content('p1', 'peer 001 message board', 0, 0)
CmdLineInterface.insert_content('p2', 'peer 002 message board', 0, 0)
// tables
CmdLineInterface.new_table('requests', ['reqID', 'name', 'ID', 'timout'], tables_height, tables_width, x_tables, y_tables)
CmdLineInterface.new_table('search', ['name', 'id'], tables_height, tables_width, x_tables, y_tables)
CmdLineInterface.show_table('requests')

// scrollable

// tables
CmdLineInterface.new_scrollable_group('tables')
CmdLineInterface.add_to_scrollable_group('tables', 'requests', 'table')
CmdLineInterface.add_to_scrollable_group('tables', 'search', 'table')

// boards
CmdLineInterface.new_scrollable_group('boards')
CmdLineInterface.add_to_scrollable_group('boards', 'p1', 'board')
CmdLineInterface.add_to_scrollable_group('boards', 'p2', 'board')


// use key board to scroll

// scroll through tables
CmdLineInterface.add_inputAction('CTRL_LEFT', function(){
  CmdLineInterface.scroll_next('tables', 1)
})

CmdLineInterface.add_inputAction('CTRL_RIGHT', function(){
  CmdLineInterface.scroll_next('tables', -1)
})

// scroll through message boards

CmdLineInterface.add_inputAction('ALT_LEFT', function(){
  CmdLineInterface.scroll_next('boards', 1)
})

CmdLineInterface.add_inputAction('ALT_RIGHT', function(){
  CmdLineInterface.scroll_next('boards', -1)
})
