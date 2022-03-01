import terminal from 'terminal-kit';
const {terminal: term, TextTable, TextBox} = terminal;
class layout{
  constructor(){
    this.tables = {}
    this.boards = {}
    this.document = term.createDocument()
    this.scrollableGroups = {}
    this.Input_actions = {}
    this.keyBoardContext = {}
    this.#start()
  }

  setKeyBoardContext(name, markup){
    if(!(name in this.boards))
      throw new Error(`${name} does not exist`)

    this.keyBoardContext = {
      'name': name,
      'currentLine': '',
      'markup': markup ? markup: '',
      'LifoIndex': 0
    }
  }


  #start(){
    let hist = ''
    term.on('key', (key, matches, data)=>{
      let contextName = this.keyBoardContext.name
      let markup = this.keyBoardContext.markup
      let c_line = this.keyBoardContext.currentLine
      let x_cursor = this.boards[contextName].Xcursor
      switch(key){
        case 'CTRL_C':
          term.clear()
          process.exit()
          break
        case 'LEFT':
          if(this.boards[contextName].Xcursor > 2)
            this.boards[contextName].Xcursor -= 1
          break
        case 'RIGHT':
          if(this.boards[contextName].Xcursor < this.keyBoardContext.currentLine.length+2)
            this.boards[contextName].Xcursor += 1
          break
        case 'UP':
          // this code is not effecient
          // but I perfer not to believe that
          // FIXME
          if(this.boards[contextName].inputs.length == 0)
            break

          if(this.keyBoardContext.LifoIndex < 0)
            this.keyBoardContext.LifoIndex = 1

          if(this.keyBoardContext.LifoIndex >= this.boards[contextName].inputs.length)
            this.keyBoardContext.LifoIndex = this.boards[contextName].inputs.length - 1

          this.boards[contextName].ref.textBuffer.moveToEndOfLine()
          this.delete_content(contextName, this.keyBoardContext.currentLine.length)
          this.boards[contextName].Xcursor = 2
          this.insert_content(contextName,
                              markup.concat( this.boards[contextName].inputs[this.keyBoardContext.LifoIndex]))
          this.keyBoardContext.currentLine = this.boards[contextName].inputs[this.keyBoardContext.LifoIndex]
          this.keyBoardContext.LifoIndex += 1
          break
        case 'DOWN':
          // FIXME
          if(this.boards[contextName].inputs.length == 0)
            break

          if(this.keyBoardContext.LifoIndex >= this.boards[contextName].inputs.length &&
            this.boards[contextName].inputs.length > 1)
            this.keyBoardContext.LifoIndex = this.boards[contextName].inputs.length - 2

          if(this.keyBoardContext.LifoIndex < 0 || this.boards[contextName].inputs.length == 1)
            this.keyBoardContext.LifoIndex = 0

          this.boards[contextName].ref.textBuffer.moveToEndOfLine()
          this.delete_content(contextName, this.keyBoardContext.currentLine.length)
          this.boards[contextName].Xcursor = 2
          this.insert_content(contextName,
                              markup.concat( this.boards[contextName].inputs[this.keyBoardContext.LifoIndex]))
          this.keyBoardContext.currentLine = this.boards[contextName].inputs[this.keyBoardContext.LifoIndex]
          this.keyBoardContext.LifoIndex += -1
          break
        case 'BACKSPACE':
          if(this.boards[contextName].Xcursor > 2){
            let line = this.keyBoardContext.currentLine,
                X = this.boards[contextName].Xcursor - 2
            this.keyBoardContext.currentLine = line.slice(0, X-1) + line.slice(X)
            this.boards[contextName].ref.textBuffer.moveToEndOfLine()
            this.delete_content(contextName, this.keyBoardContext.currentLine.length+1)
            this.insert_content(contextName, markup.concat(this.keyBoardContext.currentLine))
          }
          break
        case 'ENTER':
          this.insert_content(contextName, '\n')
          this.boards[contextName].Xcursor = 0

          if(this.keyBoardContext.currentLine)
            this.boards[contextName].inputs.unshift(this.keyBoardContext.currentLine)

          if('ENTER' in this.Input_actions)
            this.Input_actions[key](this.keyBoardContext.currentLine)

          this.keyBoardContext.currentLine = ''
          break
        default:
          if(key in this.Input_actions){
            this.Input_actions[key]()
            return
          }

          let char = Buffer.isBuffer(data.code) ? data.code : String.fromCharCode(data.code)
          char = char.toString()
          if(contextName && char.length == 1){
            this.keyBoardContext.currentLine = c_line.substr(0, x_cursor-2).concat(char).concat(c_line.substr(x_cursor-2))
            this.boards[contextName].ref.textBuffer.moveToEndOfLine()
            this.boards[contextName].ref.textBuffer.backDelete(c_line.length)
            this.insert_content(contextName, markup.concat(this.keyBoardContext.currentLine))
            this.boards[contextName].Xcursor = x_cursor + 1
            this.boards[contextName].ref.redraw()
          }
      }
      term.moveTo(this.boards[contextName].Xcursor + 1, this.boards[contextName].Ycursor + 1)
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

  add_inputAction(key, callback, force=false){
    if(key in this.Input_actions && !force)
      throw new Error(`${key} is already related to an action`)

    this.Input_actions[key] = callback
  }

  new_table(name, header, height, width, x, y){
    if(name in this.tables)
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
      'rows': contents.length-1,
      'content': [],
      'contentIndex': 0,
      'tableIndex': 0,
      'hidden': true
    }
  }

  add_row(name, content){
    if(!(name in this.tables))
      throw new Error(`no such table ${name}`)
    if(!content.length == this.tables[name].columns)
      throw new Error(`row must have ${this.tables[name].columns}`
                      +`elements, got ${content.length}`)
    this.tables[name].content.push(content)
    if(this.tables[name].tableIndex < this.tables[name].rows){
      this.tables[name].tableIndex = this.tables[name].tableIndex + 1
      for(let i = 0; i < content.length; i++){
        this.tables[name].ref.setCellContent(i, this.tables[name].tableIndex, content[i])
      }
    }
    this.tables[name].ref.redraw()
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

  scroll_table(tableName, step){
    if(!(tableName in this.tables))
      throw new Error(`${tableName}: does not exists`)
    let content = this.tables[tableName].content
    let contentIndex = this.tables[tableName].contentIndex
    if(contentIndex + step < 0 || contentIndex + step + this.tables[tableName].rows > content.length)
      return
    this.fill_table(tableName, contentIndex + step, this.tables[tableName].rows)
    this.tables[tableName].contentIndex = contentIndex + step
    this.tables[tableName].ref.redraw()
  }

  fill_table(name, start, num, offset=0){
    if(!(name in this.tables))
      throw new Error(`${name}: does not exists`)

    if(offset > this.tables[name].rows)
      throw new Error(`offset must be less than table columns (${this.tables[name].columns})`)

    if(start > this.tables[name].content.length || start < 0)
      throw new Error(`${name}: start out of bound`)

    if(num < 0)
      throw new Error(`${num}:  out of bound`)

    let r = start+num > this.tables[name].content.length ? start + (this.tables[name].content.length - num) -1: start+num

    let j = offset
    for(let i = start; i <= r && j < this.tables[name].rows; i++){
      this.fill_row(name, j, this.tables[name].content[i])
      j = j + 1
    }
    this.tables[name].contentIndex = start
  }

  fill_row(tableName, rowIndex, rowContent){
    if(!(tableName in this.tables))
      throw new Error(`${name}: does not exists`)
    // starts from 0
    if(rowIndex > this.tables[tableName].ref.rows && rowIndex < 0)
      throw new Error(`row index ${rowIndex} out of bound`)

    if(!rowContent ||rowContent.length != this.tables[tableName].columns)
      throw new Error(`row content length ${rowContent} isn't right`)

    for(let i = 0; i < rowContent.length; i++)
      this.tables[tableName].ref.setCellContent(i, rowIndex+1, rowContent[i])

    this.tables[tableName].ref.redraw()
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
      contentHasMarkup: true,
      textAttr: { bgColor: 'default' },
      width: progressBars? width/2 : width,
      height: height,
    })
    board.hide()

    this.boards[name] = {
      'title': title,
      'ref': board,
      'inputs': [], // LIFO
      'Xcursor': 0,
      'Ycursor': 0,
      'hidden': true,
      'pBarIndex': 0
    }
    if(progressBars)
      this.boards[name].progressBars = {}
  }

  insert_content(boardName, content){
    if(!(boardName in this.boards))
      throw new Error(`board '${boardName}' does not exist`)

    let textBuffer = this.boards[boardName].ref.textBuffer
    textBuffer.insert(content, true)
    // seperate lines \n
    content = content.split(/\n/)

    // the new cursor coords after writing
    if(content.length - 1 == 0)
      this.boards[boardName].Xcursor += content.join('').split(/\^./).join('').length
    else
      this.boards[boardName].Xcursor = 0

    this.boards[boardName].Ycursor += content.length - 1

    this.boards[boardName].ref.redraw()
  }

  delete_content(boardName, n){
    if(!(boardName in this.boards))
      throw new Error(`board '${boardName}' does not exist`)

    let textBuffer = this.boards[boardName].ref.textBuffer
    this.boards[boardName].Xcursor -= n
    textBuffer.backDelete(n)
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
      throw new Error(`no such board ${elName}`)

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
        return {'type': 'table', 'name': this.scrollableGroups[name].names[index + step]}
      }else if(type == 'board'){
        this.hide_board(this.scrollableGroups[name].names[index])
        this.show_board(this.scrollableGroups[name].names[index + step])
        this.scrollableGroups[name].index = index + step
        return {'type': 'board', 'name': this.scrollableGroups[name].names[index + step]}
      }
    }else{
      return false
    }
  }
}

export default layout
/*
 * 13/2/2022 00:58 GMT+1
 *
 * I just found out that there is another project
 * called Peeroid, that attempted to do what
 * I'm trying to do here: https://peeriodproject.github.io/
 * as far as I can tell
 * the project has been dead scince 2014
 * the last activity is an issue opend in 2015
 * I googled "peeriod" before I named my project
 * and I found nothing but now out of criousity
 * googled it again and there it is
 * ///////
 * turns out the name is Peeriod not Peeroid
 * but nonetheless it seems that the work is interesting
 * I may take a look later.
 */
