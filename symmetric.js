// this file is retyped from https://github.com/dchest/tweetnacl-js/wiki/Examples

import tweetnacl from "tweetnacl"
const {secretbox, randomBytes} = tweetnacl
//import types
import pkg from "tweetnacl-util"
const { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64} = pkg

function newNonce(){
  return randomBytes(secretbox.nonceLength)
}

export function generateSymmetricKey(){
  return encodeBase64(randomBytes(secretbox.keyLength))
}

export function SymEncrypt(json, key){
  const keyUnit8Array = decodeBase64(key)

  const nonce = newNonce()
  const messageUnit8 = decodeUTF8(JSON.stringify(json))
  const box = secretbox(messageUnit8, nonce, keyUnit8Array)

  const fullMessage = new Uint8Array(nonce.length + box.length)
  fullMessage.set(nonce)
  fullMessage.set(box, nonce.length)

  const base64FullMessage = encodeBase64(fullMessage)

  return base64FullMessage
}

export function SymDecrypt(messageWithNonce, key){
  const keyUnit8Array = decodeBase64(key)
  const messageWithNonceAsUnit8Array = decodeBase64(messageWithNonce)
  const nonce = messageWithNonceAsUnit8Array.slice(0, secretbox.nonceLength)
  const message = messageWithNonceAsUnit8Array.slice(
    secretbox.nonceLength,
    messageWithNonce.length
  )

  const decrypted = secretbox.open(message, nonce, keyUnit8Array)

  if(!decrypted){
    throw new Error('Could not decrypt message')
  }

  const base46DecryptedMessage = encodeUTF8(decrypted)
  return JSON.parse(base46DecryptedMessage)
}
/*
const key = generateKey()
const obj = {"hello": "world"}
console.log("Original:", obj)

const encrypted = encrypt(obj, key)
console.log("Encrypted", encrypted)

const decrypted = decrypt(encrypted, key)

console.log("Decrypted:", decrypted)
*/
/*
const key = generateSymmetricKey()
let msg = {"kkk": "kkk", "mmm": "mpkj"}
msg = SymEncrypt(msg, key)
console.log(msg)
msg = SymDecrypt(msg, key)
console.log(msg)
*/
