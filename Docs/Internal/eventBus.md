# EventBus:
this is the wire that connects all other part of peeroid and give them the ability to comunicate internally.
Almost every  action taken by the user directly or indirectly will trigger an event that is going to be captured by some other part of peeroid that is specialized to process that particular event.
eventBus has a **white-list**, only events in this list can be Emmited or Captured, attempting to emit or listen to an event that is not in the white list will resault in an Exception: **no such event**

## Events:
event has a name and parameters.
- name: **String**
- params: **any**

### Methods:
1. `__`AddEvents(events: `Array[String]||String` ):`Array`  :
adds list of events to the white-list if not white listed.
**returns** a list of added events that already white listed.
- events must be a `String` or an `Array` of `String`s, attempting to use a diffrent type will resault in an Exception: 
- **event name must be string**: in case events is an array with at least one non-string entry .
- **events must be string or Array of strings**: in case eventsis  neither a string or an array.

2. `__`AddEvents(events: `Array[String]||String` ):`Array`  :
removes list of events to the white-list if already white listed.
**returns** a list of removed events that already not white listed.
- Same exceptions as `__`addEvents.

3. addEventListener(event, callback):
takes event name and callback function to be called when event is emmited
- event must be **white-listed** attempting to pass a non-white-list event will resault in an Exception: **no such event**

4. removeEventListener(event, callback):
removes listener on event
same exceptions as addEvent listener.

5. Emit(event, ...params):
Emits event with parameters `params`.
- event must be **white-listed** attempting to pass a non-white-list event will resault in an Exception: **no such event**
