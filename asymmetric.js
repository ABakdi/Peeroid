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
const obj = {hello: 'world'}
const key = generateKey()

const encrypted = encrypt(key[0], obj)
const decrypted = decrypt(key[1], encrypted)

console.log(obj, encrypted, decrypted)
*/
/*
let x = '192.168.8.255:6563'
x = Hash(x)
console.log(x)
*/
