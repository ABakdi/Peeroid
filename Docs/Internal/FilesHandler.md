# FilesHandler:
responsible for reading and writing files, provides a simple way to send and recieve files.
files are read and written in chunks

# Evants:
#### public:
`begin-incoming-file`
`incoming-file-chunk`
`end-incoming-file`
`begin-outgoing-file`
`outgoing-file-chunk`
`end-outgoing-file`

# Methods:
1. getWriteFile(id, fileName):
returns object containing `id, fileName, writeStream, fileSize(bytes), receivedBytes`
2. getReadFile(id, fileName):
returns object containing `id, fileName, readStream, fileSize(bytes), sentBytes`
3. removeReadFile(id, fileName)
deletes object containing read stream.
4. removeWriteFile(id, fileName)
deletes object containing write stream
5. newChunk(id, fileName, fileSize, chunk):
write new file chunk into file. emmits `begin-incoming-file` when stream opens, `outgoing-file-chunk` when data is writted to file, `end-outgoing-file` when EOF is reached (last chunk written to file).
6. newFile(id, fileName, fileSize, chunk):
creates new write stream to wirite the incoming chunks to file.
7. readFile(id, fileName):
creates new read stream. emmits `begin-outgoing-file` when stream opens, `outgoing-file-chunk` when data is read from file, `end-outgoing-file` when EOF is reached.