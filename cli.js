import terminal from 'terminal-kit';
const {terminal: term} = terminal;
var cursorIndex = 0,
    command = ''

term.on('key', function(key, matches, data){
    switch(key){
        case 'UP':
            break
        case 'DOWN':
            break
        case 'RIGHT':
            if(cursorIndex == command.length)
                break
            term.right(1);
            cursorIndex = cursorIndex + 1
            break
        case 'LEFT':
            if(cursorIndex == 0)
                break
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
            break

        default:
            let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
            term.bold.green(char)
            cursorIndex = cursorIndex + 1
            command = command.concat(char)
            break

    }
    
})
term.grabInput()
