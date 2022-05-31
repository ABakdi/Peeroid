# KeyStore:
This class is responsible for generating keys, encrypting and decrypting data.

contains a list of crates, each one has an ID and contains a list of symetric and a symetric keys, each key has stamp.

```JSON
Store = [
	{
		ID: '123-546-abc2',
		keys:{
			sym: [
				{
					key: 'lgfkgtijt....',
					stamp: 'hj5...'
				}
			],
			asym: [
				{
					publicKey: 'mlghpyy4....',
					stamp: 'ihj548h5d5d4v1v2gtt5'
				},
				{
					publicKey: 'mlghpyy4hy5.....',
					privateKey: 'lkjlkuom4u....'
					stamp: 'ihj548..'
				}
			]
		}
	}
]
```

## Methods:
1. checkKey(ID, stamp):
returns `true` if **symmetric key** with a given ID and stamp exists.
`false` if Not.

2. addSymKey(ID, stamp, key):
adds symmetric key with a given stamp to a crate with a given ID, if the crate does not exist it will be created.

3. generateSymKey(ID, stamp):
generates symmetric key with a given stamp for a crate with a given ID,
if crate with given ID does not exist, one will be created.
`returns` generated key.

4. generateAsymKey(ID, stamp):
generate public and private key with a given stamp a crate with a given ID,
if crate with given ID does not exist, one will be created.
`returns` generated public key.

5. Purge(ID):
removes a crate with a given id, it purge store from it.
attemting to purge a non-existent crate will raise an exception `no such ID`

6. removeSymKey(ID, stamp):
removes symmetric key with a given stamp from a crate with a given ID,
passing non-existent ID or stamp will raise an exception `no such ID` , `no such Stamp`

7. removeAsymKey(ID, stamp):
removes Asymmetric key with a given stamp from a crate with a given ID,
passing non-existent ID or stamp will raise an exception `no such ID` , `no such Stamp`

8. symmetricEncrypt(ID, stamp, json):
encrypts json using symmetric key with a given stamp and a crate ID.

9. aSymmetricEncrypt(ID, stamp, json):
encrypts json using Asymmetric key (public key) with a given stamp and a crate ID.

10. publicKeyEncrypt(publicKey, json):
encrypts json using a given public key.

11. symmetricDecrypt(ID, stamp, message):
decrypts cipher text back to json using symmetric key with a given a crate ID and stamp.

12. aSymmetricDecrypt(ID, stamp, message):
decrypts cipher text back to json using Asymmetric key (private key) with a given a crate ID and stamp.

13.   checkStamp(ID, stamp):
returns `true` if key with a given stamp in a crate with a given ID exists,
`false` if it does not exist.