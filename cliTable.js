import terminal from 'terminal-kit';
const {terminal: term, TextTable, TextBox} = terminal;

term.on('key', function(key, matches, data){
  if(key == 'CTRL_C')
    term.clear()
    process.exit()
})

let doc = term.createDocument()

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
    height: term.height -10,
})

function drawTable(){
  let w = term.width/2
  let h = term.height-10
  let y_lines = [0, w/4, w/2, w]
  for(let y = 0; y<=h; y++){
    for(let x = 0; x<4; x++){
      // console.log(y_lines[x], y)
      text.textBuffer.moveTo(parseInt(y_lines[x]), y)
      text.textBuffer.insert('0')
    }
  }
  text.redraw()
}
text.appendContent('plgptlhptlhyokhoy\nolkhlkylhkymlhùthmùtmhùtmhùmtùhmùtmhùtmhùtmùhmtùmhùtmhùt\”nkhkjkjhkh')
doc.draw()
drawTable()
