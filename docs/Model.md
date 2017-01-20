# Model 

Extends from [EventDispatcher](./EventDispatcher.md)

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

## Public properties 

### fields `plain object`

Used to define fields of models. Used by almost all bindings. 
If some field is not declared, bindings will not work. 
Define propety syntax, for not declared fields will not work as well. 

If provided field is function, it counts as computed getter. 

```javaScript

let User = Model.extend({
    fields: {
        firstName: 'Artem',
        lastName: 'Poletsky',
        fullName(firstName, lastName){ //arguments names here is matter!
            return firstName + ' ' + lastName;
        }
    }
});

let me = new User();
console.log(me.fullName);// 'Artem Poletsky'
```

### computeds `plain object`

Used to define computed fields of the model.

```javaScript

let Example = Model.extend({
    fields: {
        x: 0
    },
    computeds: {
        x5: {
            get(x){//arguments names here is matter!
                return x * 5;
            },
            set(value) {
                this.x = value/5;
            }
        }
    }
});

let test = new Example();

test.x = 2;
console.log(test.x5);//10
test.x5 = 5;
console.log(test.x);//1
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

### serialize()

Returns plain object representation of the model including computeds. 

```javaScript
let User = Model.extend({
    fields: {
        firstName: '',
        lastName: '',
        fullName(firstName, lastName){
            return firstName + ' ' + lastName;
        }
    }
});

let me = new User({
    firstName: 'Artem',
    lastName: 'Poletsky'
});

console.log(me.serialize()); // { firstName: 'Artem', lastName: 'Poletsky', fullName: 'Artem Poletsky' }

```

### toJSON()

By default returns same as `serialize()`. 

You can override this method to return only not computed fields.

```javaScript
let User = Model.extend({
    fields: {
        firstName: '',
        lastName: '',
        fullName(firstName, lastName){
            return firstName + ' ' + lastName;
        }
    },
    toJSON(){
        return _.clone(this.attributes); //if lodash is available
    }
});

let me = new User({
    firstName: 'Artem',
    lastName: 'Poletsky'
});

console.log(me.toJSON()); // { firstName: 'Artem', lastName: 'Poletsky' }
console.log(JSON.stringify(me)); // '{ "firstName": "Artem", "lastName": "Poletsky" }'
```

### parse(json)

Calls in `constructor` and `update` methods. By default returns same `json` object as given. 
Used to prepare raw data from server. And must return model's fields. 


```javaScript
let User = Model.extend({
    fields: {
        firstName: '',
        lastName: ''    
    },
    parse(data){
        return data.body;
    }
});

let me = new User({
    status: 200,
    body: {
        firstName: 'Artem',
        lastName: 'Poletsky'
    }
});

me.update({status: 200, body:{...}}); //works same

```

### update(raw_data)

Used to update model's fields same as `prop(key_values_obj)`, but raw data usead as argument. And it goes through `parse` method.
