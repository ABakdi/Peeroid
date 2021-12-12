 // retyped from https://github.com/dchest/tweetnacl-js/wiki/Examples

import tweetnacl from "tweetnacl"
const {box, randomBytes, hash} = tweetnacl
//import utility functions
import pkg from "tweetnacl-util"
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64} = pkg

function newNonce(){
  return randomBytes(box.nonceLength)
}

function generateKeyPair(){
  return box.keyPair()
}

export function AsymEncrypt(secretOrSharedKey, json, key){
  const nonce = newNonce()
  const messageUint8 = decodeUTF8(JSON.stringify(json))
  const encrypted = key?
        box(messageUint8, nonce, key, secretOrSharedKey):
        box.after(messageUint8, nonce, secretOrSharedKey)

  const fullMessage = new Uint8Array(nonce.length + encrypted.length)
  fullMessage.set(nonce)
  fullMessage.set(encrypted, nonce.length)

  const base64FullMessage = encodeBase64(fullMessage)

  return base64FullMessage
}

export function AsymDecrypt(secretOrSharedKey, messageWithNonce, key){
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce)
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength)
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  )

  const decrypted = key?
        box.open(message, nonce, key, secretOrSharedKey):
        box.open.after(message, nonce, secretOrSharedKey)

  if(!decrypted){
    throw new Error('Could not decrypt message')
  }

  const base64DecryptedMessage = encodeUTF8(decrypted)
  return JSON.parse(base64DecryptedMessage)
}

// FIXME public and private key
// should not be the same
export function generateAsymmetricKey(){
  const pairA = generateKeyPair()
  const pairB = generateKeyPair()

  const PublicKey = box.before(pairB.publicKey, pairA.secretKey)
  const PrivateKey = box.before(pairA.publicKey, pairB.secretKey)

  return [PublicKey, PrivateKey]
}

export function Hash(string){
  let s = decodeUTF8(string)
  s = encodeBase64(hash(s))
  return s
}
/*
/wtf public and privete key are the same
//this is some sirous security flaw
const key = generateAsymmetricKey()
console.log(key)
let msg = {"hh": "lll", "lklk": "lklk"}
console.log(msg)
msg = AsymEncrypt(key[0], msg)
console.log(msg)
msg = AsymDecrypt(key[1], msg)
console.log(msg)
*/
