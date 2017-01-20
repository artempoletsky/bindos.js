# EventDispatcher 

Extends from Class

Basic usage:

```javaScript
let e = new EventDisplatcher();
let callback = ()=>console.log('triggered!');
e.on('myEvent', callback);
e.fire('myEvent'); //triggered!
```

## Public methods

### on(events, fn, context, callOnce)

Subscribe to event. 

`events` - string that contains event names separated with spaces 

```javaScript
e.on('event1 event2', ()=>console.log('triggered!'));
e.fire('event1'); //triggered!
e.fire('event2'); //triggered! once again
```

If `events` is plain object you can subscribe on multiple events at once

```javaScript
e.on({
    event1(){console.log('event1')},
    event2(){console.log('event2')}
});

e.fire('event1'); //logged "event1"
e.fire('event2'); //logged "event2"
```
If `context` is set context of callbacks will be given value, otherwise EventDispatcher event.

```javaScript
let context = {};
e.on('event1', function(){
    console.log(this === e);//true
});
e.on('event1', function(){
    console.log(this === context);//true
}, context);

//as usual arrow function's context always will be global object
e.on('event1', ()=>{
    console.log(this === window);//true
});

//works with multiple events syntax
e.on({
    event1(){
        console.log(this === context);//true
    }
}, context);
e.fire('event1');
```

if `callOnce` is set and truthy callback will be called only once regardless of number of `fire` method calls.

```javaScript
e.on('event1', ()=>{console.log('triggered!')}, e, true);
e.fire('event1');//triggered!
e.fire('event1');//nothing happens
```

You can define namespace for events and bind, unbind and trigger events by namespace. 

```javaScript
e.on('event1.foo', ()=>{console.log('event1')});
e.on('event2.foo', ()=>{console.log('event2')});
e.fire('.foo');//both listeners fired
e.off('.foo'); //both listeners removed

//multiple namespaces works too
e.on('event1.foo.bar.baz', callback);
```

### off(events, callback, context)

Unbinds listeners from `EventDisplatcher` object. 

Examples 

```javaScript
//unbind 'event1' with callback and context
e.off('event1', callback, context);
//unbind all 'event1' events
e.off('event1');

//unbind all events with context
e.off(0, 0, context);
//or you can give any falsy arguments
e.off(false, undefined, context);

//unbind all events with callback
e.off(0, callback);
//etc...
```

### fire(events, ...rest)

Triggers events.
`events` - string of event names separated by spaces
`...rest` - if is set arguments will be given to callback defined in `on` method

```javaScript
e.on('event1', (a, b, c)=>console.log(a, b, c));

e.fire('event1 event2', 1, 2, 3);//logged: 1 2 3
```

### one(events, callback, context)

Shortcut for `on(events, callback, context, true)`

### hasListener(event)

Checks if `EventDisplatcher` object has `event` listener.
Unlike methods above accepts only one event name.

```javaScript
e.on('event1 event2', callback);

e.hasListener('event1'); //true
e.hasListener('event2'); //true

e.hasListener('event1 event2'); //false

```
