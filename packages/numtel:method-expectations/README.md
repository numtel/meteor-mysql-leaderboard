# numtel:method-expectations

Provide expected results for Meteor methods on the client for instant feedback on any server operations.

## Implements

### `methodExp({ ... })`

Initialize methods expectations using syntax similar to `Meteor.methods()`. Use method names as the keys with either a single function for value or an object containing multiple functions.

When one function is passed, it is called synchronously with the call:
```javascript
methodExp({
  'testMethod': function(val){
    counter += val;
  }
});

```

Alternatively, multiple functions can be specified. The default function is `onCall`. An `onData` method can be specified that is called immediately before the original callback.
```javascript
methodExp({
  'advMethod': {
    onCall: function(val){
      buffer = counter;
      counter = val;
    },
    onData: function(error, result){
      counter = buffer;
    }
  }
});

```

### `callExp(name, args, ... , [callback])`

Call a method with an expectation. Same syntax as `Meteor.call()`.
