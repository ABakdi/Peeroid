class layout{
  constructor(){
    this.tables = {}
    this.boards = {}
  }

  #make_table(header){
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

  new_table(name, header, height, width, x, y){
    if(this.tables[name])
      throw new Error(`${name}: already exists`)
    let table = new TextTable({
      cellContents: make_table(header),
      parent: doc,
      x: term.width/2,
      y: 0,
      hasBorder: true,
      contentHasMarkup: true,
      textAttr: { bgColor: 'default' },
      width: term.width/2,
      height: term.height/2 - 1,
      fit: true   // Activate all expand/shrink + wordWrap

    })

    this.tables[name] = {
      'ref': table,
      'content': [],
      'startIndex': 0
    }

  }

  show_table(name){
    if(!this.tables[name])
      throw new Error(`${name}: does not exist`)

    this.tables[name].ref.show()
  }

  hide_table(name){
    if(!this.tables[name])
      throw new Error(`${name}: does not exist`)

    this.tables[name].ref.hide()
  }

  new_board(name, title, height, width, x, y){
    if(this.boards[name])
      throw new Error(`${name}: already exists`)
  }

  show_board(name){
    if(!this.boards[name])
      throw new Error(`${name}: does not exist`)

    this.boards[name].ref.show()
  }

  hide_board(name){
    if(!this.boards[name])
      throw new Error(`${name}: does not exist`)

    this.boards[name].ref.hide()
  }
}
