import fs, { readFile } from 'fs'

import pkg from "tweetnacl-util"
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64} = pkg

class FilesHandler{
  constructor(eventBus){
    this.writeFileStreams = []
    this.readFileStreams = []
    this.eventBus = eventBus
    this.eventBus._addEvents(['begin-incoming-file', 'incoming-file-chunk',
                              'end-incoming-file', 'begin-outgoing-file',
                              'outgoing-file-chunk', 'end-outgoing-file'])
    this.dir = "./dwn"
    // update thresh hold (5% of file size)
    // to avoid fludding user with events
    this.ut = 0.05
  }

  getWriteFile(id, fileName){
    return this.writeFileStreams.find((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  getReadFile(id, fileName){
    return this.readFileStreams.find((f)=>{
      return (fileName ==f.fileName && f.id == id)
    })
  }

  removeReadFile(id, fileName){
    this.readFileStreams = this.readFileStreams.filter((f)=>{
      return !(fileName ==f.fileName && f.id == id)
    })
  }

  removeWriteFile(id, fileName){
    this.writeFileStreams = this.writeFileStreams.filter((f)=>{
      return !(fileName ==f.fileName && f.id == id)
    })
  }

  newChunk(id, fileName, fileSize, chunk){
    let file = this.getWriteFile(id, fileName)
    if(file){
      // check end of file
      if(chunk == '__END_OF_FILE'){
        file.stream.close()
        this.eventBus.Emit('end-incoming-file', id, fileName)
      }else{
        // write chunk to file
        chunk = decodeBase64(chunk)
        file.stream.write(chunk)
        file.receivedBytes += Buffer.byteLength(chunk)
        // emit event when threshold is reached
        //                     [the oldest question in the universe,
        // do I calculate it every time, do I sotore it in a variabl]
        if(file.receivedBytes % file.fileSize*this.ut > file.fileSize*this.ut)
          this.eventBus.Emit('incoming-file-chunk', id, fileName, fileSize,file.receivedBytes)
      }
    }else{
      this.eventBus.Emit('begin-incoming-file', id, fileName, fileSize, chunk)
    }
  }

  newFile(id, fileName, fileSize, chunk){
    let stream = fs.createWriteStream(`${this.dir}/${fileName}`, 'binary')
    chunk = decodeBase64(chunk)
    stream.write(chunk)
      this.writeFileStreams.push({
        'id': id,
        'fileName': fileName,
        'stream': stream,
        'fileSize': fileSize,
        'receivedBytes': Buffer.byteLength(chunk)
      })
  }

  readFile(id, fileName){
    let file = this.getReadFile(id, fileName)
    if(file)
      throw new Error('file in use')
    let stream = fs.createReadStream(`${fileName}`)
    let fileSize = fs.statSync(`${fileName}`).size

    this.readFileStreams.push({
      'id': id,
      'fileName': fileName,
      'stream': stream,
      'size': fileSize,
      'sentBytes': 0
    })

    stream.on('open', ()=>{
      this.eventBus.Emit('begin-outgoing-file', id, fileName, fileSize)
    })

    stream.on('data', (chunk)=>{
      let file = this.getReadFile(id, fileName)
      file.sentBytes += Buffer.byteLength(chunk)
      chunk = encodeBase64(chunk)
      if(file.receivedBytes % file.fileSize*this.ut > file.fileSize*this.ut)
        this.eventBus.Emit('outgoing-file-chunk', id, fileName, fileSize, chunk, file.sentBytes)
    })

    stream.on('end', ()=>{
      this.eventBus.Emit('end-outgoing-file', id, fileName, fileSize)
      stream.close()
      this.removeReadFile(id, fileName)
    })
  }
}

export default FilesHandler
