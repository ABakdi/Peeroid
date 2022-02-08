import terminal from 'terminal-kit';
const {terminal: term, TextTable, TextBox} = terminal;
class layout{
  constructor(){
    this.tables = {}
    this.boards = {}
    this.document = term.createDocument()
    this.scrollableGroups = {}
    this.Input_actions = {}
    this.#start()
  }

  #start(){
    term.on('key', (key, matches, data)=>{
      switch(key){
        case 'CTRL_C':
          term.clear()
          process.exit()
          break
        default:
          if(key in this.Input_actions)
            this.Input_actions[key]()
      }
    })
  }


  #make_table(header, height, rows = null){
    // generate empty table with
    // number of rows depending on the terminal height
    let row_num
    if(rows)
      row_num = rows
    else
      row_num = parseInt((height -1)/2)
    let content = []
    // add header to table
    content.push(header)
    let empty_row = new Array(header.length).fill(' ')
    for(let i = 0; i < row_num-1; i++){
        content.push(empty_row)
    }
    return content
  }

  add_inputAction(key, callback){
    if(this.Input_actions[key])
      throw new Error('${key} is already related to an action')

    this.Input_actions[key] = callback
  }

  new_table(name, header, height, width, x, y){
    if(this.tables[name])
      throw new Error(`${name}: already exists`)
    let contents = this.#make_table(header, height)
    let table = new TextTable({
      cellContents: contents,
      parent: this.document,
      x: x,
      y: y,
      hasBorder: true,
      contentHasMarkup: true,
      textAttr: { bgColor: 'default' },
      width: width,
      height: height,
      fit: true   // Activate all expand/shrink + wordWrap

    })
    table.hide()

    this.tables[name] = {
      'ref': table,
      'header': header,
      'columns': header.length,
      'rows': contents.length,
      'content': [],
      'contentIndex': 0,
      'tableIndex': 0,
      'hidden': true
    }
  }

  add_row(name, content){
    if(!this.tables[name])
      throw new Error(`no such table ${name}`)
    if(!content.length == this.tables[name].columns)
      throw new Error(`row must have ${this.tables[name].columns}`
                      +`elements, got ${content.length}`)
    this.tables[name].content.push(content)
  }

  delete_row(name, identifier, value){
    if(!this.tables[name])
      throw new Error(`no such table: ${name}`)

    if(!this.tables[name].header.includes(identifier))
      throw new Error(`no such identifier: ${identifier}`)

    let idIndex = this.tables[name].header.indexOf(identifier)

    let offset
    this.tables[name].content.forEach((row, index)=>{
      if(row[idIndex]==value){
        this.tables[name].content.splice(index, 1)
        offset = index
      }
    })

    if(offset && offset < this.tables[name].columns){
      this.fill_table(name, 0, this.tables[name].columns, offset)
      this.tables[name].ref.redraw()
    }
  }

  fill_table(name, start, end, offset=0){
    if(this.tables[name])
      throw new Error(`${name}: already exists`)

    if(offset > this.tables[name].columns)
      throw new Error(`offset must be less than table columns (${this.tables[name].columns})`)

    if(start > this.tables[name].content.length || start < 0)
      throw new Error(`${name}: start out of bound`)

    if(end < start)
      throw new Error(`start < end ... WTF?`)

    if(end > this.tables[name].content.length || end < 0)
      throw new Error(`${name}: end out of bound`)

    for(let i = start; i <= end; i++){
      for(let j = 0; j < this.tables[name].columns; j++){
        this.tables[name].ref.setCellContent(start - i + offset, j, this.tables[name].content[i][j])
      }
    }
  }

  show_table(name){
    if(!(name in this.tables))
      throw new Error(`${name}: does not exist`)

    this.tables[name].ref.show()
    this.tables[name].hidden = false
  }

  hide_table(name){
    if(!this.tables[name])
      throw new Error(`${name}: does not exist`)

    this.tables[name].ref.hide()
    this.tables[name].hidden = true
  }

  new_board(name, title, height, width, x, y, progressBars = false){
    if(this.boards[name])
      throw new Error(`${name}: already exists`)

    let board = new TextBox({
      parent: this.document,
      x: x,
      y: y,
      scrollable: true,
      hasVScrollBar: true,
      scrollY: 0,
      extraScrolling: true,
      contentHasMarkup: true,
      textAttr: { bgColor: 'default' },
      width: progressBars? width : width/2,
      height: height,
    })
    board.hide()

    this.boards[name] = {
      'title': title,
      'ref': board,
      'rows': [],
      'startIndex': 0,
      'columnIndex': 0,
      'hidden': true,
      'pBarIndex': 0
    }
    if(progressBars)
      this.boards[name].progressBars = {}
  }

  insert_content(boardName, content, x, y){
    if(!(boardName in this.boards))
      throw new Error(`board '${boardName}' does not exist`)

    let textBuffer = this.boards[boardName].ref.textBuffer
    textBuffer.moveTo(x, y)
    textBuffer.insert(content)
    this.boards[boardName].ref.redraw()
  }

  add_progressBar(boardName, barName, title){
    if(!this.boards[boardName])
      throw new Error(`no such board '${boardName}'`)

    if(!this.boards[boardName].progressBars)
      throw new Error(`'${boardName}' does not support progress bars`)

    if(this.boards[boardName].progressBars[barName])
      throw new Error(`progress bar '${barName}' already exists`)

    let width = this.boards[name].ref.x
    let pBarIndex = this.boards[name].pBarIndex

    let progressBar = term.progressBar({
      x: this.boards[boardName].ref.x + width,
      y: pBarIndex,
      width: width/2,
      'title': title,
      eta: true,
      percent:true,
    })

    if(pBarIndex > this.boards[name].ref.hidden)
      progressBar.hide()

    pBarIndex = pBarIndex + 1

    if(this.boards[name].hidden)
      progressBar.hide()
    this.boards[boardName].progressBars[barName] = {
      'ref': progressBar,
      'progress': 0
    }
  }

  update_progressBar(boardName, barName, progress){
    if(!this.boards[bordName])
      throw new Error(`no such board '${boardName}'`)

    if(!this.boards[bordName].progressBars[barName])
      throw new Error(`no such progress bar '${barName}' for board '${boardName}'`)

    if(progress<1 && progress>0){
      this.boards[boardName].progressBars[barName].ref.update(progress)

    }else if(progress >= 1){
      this.boards[boardName].progressBars[barName].ref.update(1)

      // when progress bar reaches 100%
      // wait 3 seconds than delete it
      // and shift all progress bars under it
      // on step up (y axis)
      setTimeout(()=>{
        // let x = this.boards[boardName].progressBars[barName]
        let y = this.boards[boardName].progressBars[barName].y
        let pBarIndex = this.boards[boardName].progressBars.pBarIndex

        delete this.boards[boardName].progressBars[barName]

        if(y == this.boards[boardName].progressBars.pBarIndex){
          pBarIndex = pBarIndex - 1
        }else{
          this.boards[this.boards].progressBars.forEach((name, val)=>{
            if(val.ref.y > y){
              val.ref.y = val.ref.y - 1
            }
          })
        }
      }, 3000)
    }
  }

  scroll_progress_bars(boardName, step = 1){
    if(!(bordName in this.boards))
      throw new Error(`no such board '${boardName}'`)

    if(!this.boards[boardName].progressBars)
      throw new Error(`'${boardName}' does not support progress bars`)

    let hide = step
    if(this.boards[boardName].progressBars.length > this.boards[boardName].height){
      for(let i =0; i< step; i++){
        let y = this.boards[boardName].progressBars[i].ref.y
        y = y + step
      }
    }
  }

  show_board(name){
    if(!(name in this.boards))
      throw new Error(`board '${name}' does not exist`)

    this.boards[name].ref.show()
    this.boards[name].hidden = false
    let pBars = this.boards[name].progressBars
    if(pBars)
      for(const [name, val] of Object.entries(pBars)){
        val.ref.hide()
      }
  }

  hide_board(name){
    if(!(name in this.boards))
      throw new Error(`board '${name}' does not exist`)

    this.boards[name].ref.hide()
    this.boards[name].hidden = true
    let pBars = this.boards[name].progressBars
    if(pBars)
      for(const [name, val] of Object.entries(pBars)){
        val.ref.hide()
      }
  }

  new_scrollable_group(name){
    if(this.scrollableGroups[name.toString()])
      throw new Error('${name}: group name already exists')
    this.scrollableGroups[name.toString()] = {
      'types': [],
      'names': [],
      'index': 0
    }
  }

  add_to_scrollable_group(grName, elName, type){
    // elName: element's name
    // grName: group's name
    // type: table, board ...
    if(!type || type != "board" && type != "table")
      throw new Error(`type must be board or table got: ${type}`)

    if(!this.scrollableGroups[grName])
      throw new Error(`no such group ${grName}`)

    if(!this.tables[elName] && type == 'table')
      throw new Error(`no such table ${elName}`)

    if(!this.boards[elName] && type == 'board')
      throw new Error(`no such group ${elName}`)

    this.scrollableGroups[grName].names.push(elName)
    this.scrollableGroups[grName].types.push(type)
  }

  scroll_next(name, step=1){

    if(!(name in this.scrollableGroups))
      throw new Error(`no such group ${name}`)

    if(this.scrollableGroups[name].names.length == 0)
      throw new Error(`group ${name} is empy`)

    let index = this.scrollableGroups[name].index
    if(index + step < this.scrollableGroups[name].names.length && index + step >= 0){
      let type = this.scrollableGroups[name].types[index]
      if(type == 'table'){
        this.hide_table(this.scrollableGroups[name].names[index])
        this.show_table(this.scrollableGroups[name].names[index + step])
        this.scrollableGroups[name].index = index + step
        return true
      }else if(type == 'board'){
        this.hide_board(this.scrollableGroups[name].names[index])
        this.show_board(this.scrollableGroups[name].names[index + step])
        this.scrollableGroups[name].index = index + step
        return true
      }
    }else{
      return false
    }
  }


}

export default layout
