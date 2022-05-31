# Commander:
main job is to enable command line, turns string command into json understandble by peeroid.
every command has a list of allowable values for its parametes, you can add them using methods.

### command format:
**command** default_value *-default_parameter* |**-parameter** *value*| |Input|

### commands list:

|command |default_value|default_param|params             |
|--------|-------------|-------------|-------------------|
|send    |name         |protocol     |protocol, name, id |
|search  |   	       |             |   	             |
|connect |name         |name	     |name, id  	     |
|accept  |request  	   |request      |request, name, id  |
##### examples:
using peeroid CLI
```sh
# search for peers
$> search

# connect to peer (send a request)
$> connect -peer_name
#or
$> connect -id peer_id

# accept connection request to peer
$> accept 1 # request numbre 1 in request table
# or
$> accept -name peer_name

# send message to connected peer
$> send peer_name -tcp "hello there"
# or
$> send -id peer_id -protocol udp "hello there"
# or
$> send peer1 peer2 peer3 -tcp "hello" "there"
```


# Methods:
1. add_to_send(id, name)
2. add_to_accept(reqID, id, name)
3. add_to_connect(id, name)
4. refactor_command(command):
takes command string and return json.
