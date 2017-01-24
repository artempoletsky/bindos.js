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

### mapping `string`

If defined, models will be stored in global hash object. Adding new model to collection, or using Model.createOrUpdate() with same `mapping` and `id` will update existing model instead of creating new one. 


```javaScript

let User = Model.extend({
    fields: {
        id: 0,
        name: ''
    },
    mapping: 'users'
});

let UsersCollection = Collection.extend({
    model: User
});

let collection = new UsersCollection();

let example = new User({ id: 10 });

console.log(example.name);//''

collection.push({ id: 10, name: 'Artem' }); //addind raw data. Not model. 

console.log(example === collection.at(0));//true
console.log(example.name);//'Artem'

let example2 = Model.createOrUpdate(User, { id: 10, name: 'John' });

console.log(example === collection.at(0) === example2);//true
console.log(example.name);//'John'
```


### idAttribute `string` = `'id'`

Used mainly for `mapping` behavior, see above. 

```javaScript

let User = Model.extend({
    fields: {
        user_id: 0,
        name: ''
    },
    idAttribute: 'user_id',
    mapping: 'users'
});

let me = Model.createOrUpdate(User, { user_id: 10, name: 'Artem' });
console.log(me.id);//10
console.log(me.user_id);//10
console.log(me.name);//'Artem'

Model.createOrUpdate(User, { user_id: 10, name: 'John' });
console.log(me.name);//'John'

```

### useDefineProperty `boolean` = `true`

If set to `false` model will not create short propeties.  Used for supporting old browsers. 

```javaScript

let User = Model.extend({
    fields: {
        id: 0,
        name: ''
    },
    useDefineProperty: false
});

let me = new User({ id: 10, name: 'Artem' });

console.log(me.name);//undefined
console.log(me.prop('name'));//'Artem'

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

## Static methods

### createOrUpdate

See `mapping` property. 

## Events

### change, change:[property_name]

When you change model's properties, it fires both this events. 

```javaScript
let User = Model.extend({
    fields: {
        firstName: '',
        lastName: ''    
    }
});

let me = new User({
    firstName: 'Artem',
    lastName: 'Poletsky'
});

me.on('change', (changed) =>{
    console.log(changed); // {firstName: 'Foo', lastName: 'Bar'}
});

me.on('change:firstName', (firstName) =>{
    console.log(firstName); //'Foo'
});

me.on('change:lastName', (lastName) =>{
    console.log(lastName); //'Bar'
});

me.prop({
    firstName: 'Foo',
    lastName: 'Bar'
});

```
