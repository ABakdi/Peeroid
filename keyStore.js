import {generateAsymmetricKey,
        AsymEncrypt, AsymDecrypt, Hash } from './asymmetric.js'

import {generateSymmetricKey,
        SymEncrypt, SymDecrypt} from './symmetric.js'

class keyStore{
  constructor(){
    // contains a list of crates each has an id and the relevent keys
    this.Store = []
  }

  #getPrivateKey(peerID, stamp){
    const crate = this.#getCrate(peerID)
    if(!crate)
      throw new Error('peer is not recognized')

    let block = crate.keys.asym.find((el)=> el.stamp == stamp)

    if(!block)
      throw Error('no key stamped with: ' + stamp)

    return block.privateKey
  }

  #getPublicKey(peerID, stamp){
    const crate = this.#getCrate(peerID)
    if(!crate)
      throw new Error('peer is not recognized')

    let block = crate.keys.asym.find((el)=> el.stamp == stamp)


    if(!block)
      throw Error('no key stamped with: ' + stamp)

    return block.publicKey
  }

  #getKey(peerID, stamp){
    const crate = this.#getCrate(peerID)
    if(!crate)
      throw new Error('peer is not recognized')

    let block = crate.keys.sym.find((el)=> el.stamp == stamp)

    if(!block)
      throw Error('no key stamped with: ' + stamp)

    return block.key

  }

  #getCrate(peerID){
    return this.Store.find((crate)=> crate.id == peerID)
  }

  generateSymKey(peerID, stamp){
    const key = generateSymmetricKey()
    let crate = this.#getCrate()
    if(!crate){
      crate = {
        'id': peerID,
        'keys':{
          'sym': [],
          'asym': []
        }
      }
      crate.keys.sym.push({'stamp': stamp, 'key': key})
      this.Store.push(crate)
    }else{
      crate.keys.sym.push({'stamp': stamp, 'key': key})
    }
  }
  generateAsymKey(peerID, stamp){
    const key = generateAsymmetricKey()
    let crate = this.#getCrate(peerID)
    if(!crate){
      crate = {
        'id': peerID,
        'keys':{
          'sym': [],
          'asym': []
        }
      }

      crate.keys.asym.push({
        'stamp': stamp,
        'publicKey': key[0],
        'privateKey':key[1],
      })
      this.Store.push(crate)
    }else{
      crate.keys.asym.push({
        'stamp': stamp,
        'publicKey': key[0],
        'privateKey':key[1],
      })
    }

  }

  symetricEncrypt(peerID, stamp, json){
    const key = this.#getKey(peerID, stamp)
    return SymEncrypt(json, key)
  }

  aSymetricEncrypt(peerID, stamp, json){
    const key = this.#getPublicKey(peerID, stamp)
    return AsymEncrypt(key, json)
  }

  symetricDecrypt(peerID, stamp, message){
    const key = this.#getKey(peerID, stamp)
    return SymDecrypt(message, key)
  }

  aSymetricDecrypt(peerID, stamp, message){
    const key = this.#getPrivateKey(peerID, stamp)
    return AsymDecrypt(key, message)
  }
}

///testing///
import {v4 as uuid4} from 'uuid'
const key_store = new keyStore()
let peers = [uuid4(), uuid4(), uuid4()]
let stamps = ['p1', 'p2', 'p3']
for(let i in peers)
  for(let j in stamps)
    key_store.generateAsymKey(peers[i], stamps[j])
console.log(key_store.Store[1].keys.asym)

const msg = {'hello': 'world'}
let enc
enc = key_store.aSymetricEncrypt(peers[0], stamps[0], msg)
console.log(enc)
console.log(key_store.aSymetricDecrypt(peers[0], stamps[0], enc))
