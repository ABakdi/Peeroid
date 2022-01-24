import fs, { readFile } from 'fs'

class FilesHandler{
  constructor(eventBus){
    this.writeFileStreams = []
    this.readFileStreams = []
    this.eventBus = eventBus
    this.eventBus._addEvents(['begin-incoming-file', 'incoming-file-chunk',
                              'end-incoming-file', 'begin-outgoing-file',
                              'outgoing-file-chunk', 'end-outgoing-file'])
    this.dir = "./dwn"
  }

  getWriteFile(id, fileName){
    this.writeFileStreams.find((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  getReadFile(id, fileName){
    this.readFileStreams.find((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  removeReadFile(id, fileName){
    this.readFileStreams = this.readFileStreams.filter((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  removeWriteFile(id, fileName){
    this.writeFileStreams = this.writeFileStreams.filter((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  newChunk(id, fileName, chunk){
    let file = this.getWriteFile(fileName)
    if(file){
      // check end of file
      if(chunk == '__END_OF_FILE'){
        file.stream.close()
        this.eventBus.Emit('end-incoming-file', id, fileName)
      }else{
        // write chunk to file
        this.eventBus.Emit('incoming-file-chunk', id, fileName)
        file.stream.write(chunk)
      }
    }else{
      this.eventBus.Emit('begin-incoming-file', id, fileName, chunk)
    }
  }

  newFile(id, fileName, chunk){
      let stream = fs.createWriteStream(`${this.dir}/${fileName}`)
      stream.write(chunk)
      this.writeFileStreams.push({
        'fileName': fileName,
        'stream': stream,
        'id': id,
      })
  }

  readFile(id, fileName){
    let stream = fs.createReadStream(`${fileName}`, {highWaterMark: 512})
    stream.setEncoding('utf8')

    this.readFileStreams.push({
      'id': id,
      'fileName': fileName,
      'stream': stream,
    })

    stream.on('open', ()=>{
      this.eventBus.Emit('begin-outgoing-file', id, fileName)
    })

    stream.on('data', (chunk)=>{
      this.eventBus.Emit('outgoing-file-chunk', id, fileName, chunk.toString())
    })

    stream.on('end', ()=>{
      this.eventBus.Emit('end-outgoing-file', id, fileName)
      stream.close()
      this.removeReadFile(fileName, id)
    })
  }
}

export default FilesHandler
