# Model 

Extends from EventDispatcher

Basic usage:
```javaScript
let User = Model.extend({
    fields: {
        username: 'Ninja',
        email: 'ninja@example.com'
    }
});

let developer = new User({
   username: 'John',
   email: 'john@example.com'
});

console.log(developer.username); //John
console.log(developer.email); //john@example.com

developer.on('change:username', (newName)=>{
    console.log(newName);
});

developer.username = 'Artem'; //'Artem' logged
```

## Public methods

### constructor(data={})

`data` - `plain object` if is set default fields will be overwriten with given values.

### prop(key, value)

Set or get model's field.

`key` - `string` key of model's feild
`value` - value of model's field. If not set method will return current value of field.

```javaScript
model.prop('name', 'John'); //triggers change and change:name events
model.prop('name'); //'John'
```
if `useDefineProperty` is set to `true` (default behavior), 
in the `constructor` will be created properties for defined `fields`. 
They getters and setters will use `prop` method.

Same behavior as above
```javaScript
model.name = 'John'; //triggers change and change:name events
model.name; //'John'
```
It doesn't work in browsers that not support `Object.defineProperty` method. 
You can disable 

If given `key` is plain object, you can set multiple fields at once. 
```javaScript
model.prop({
    name: 'John',
    email: 'john@example.com'
});

//or
$.ajax({
    url: '/getModel',
    success(data) {
        model.prop(data); //update all fields
    }
})
```

