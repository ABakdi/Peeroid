## Classes:
1. **eventBus**:
	emmits and listen to events.
	it only allow a set of events to be emmited and listened to.
2. **Discover**:
	responsible for finding peers on the network
	and make other peers able to find us.

3. **fileHandler**:
	handles reading and writing files.

4. **keyStore**:
	generates keys symmetric and asymmetric , encryptes and decryptes objects.

5. **Linker**:
	responsible for creating and distroying connections (i.e linking peers).

6. **Peer**:
	creates a UDP and a TCP sockets, these sokets are what other peer connect to,
	and use to find us.

7. **PeersManager**:
	manages connected peers.

8. **requests**:
	manages connection requests.

9. **Peeroid**:
	ties every thing together.

10. **Peeroid_Client**:
	offers an api to interract with peeroid.
