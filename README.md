# minska

> A simple _flux like_ store with reducers and effects.

## Install

```
yarn add minska
```

The packages includes ES modules for Webpack 2 and Rollup, CommonJS modules for Node > 6, and Browser modules.

You can also [access the files on unpkg](https://unpkg.com/minska/) where you can link them directly in a `<script>` tag and have `window.Minska` available in global scope. The browser builds are compiled  [`minska.js`](https://unpkg.com/minska/minska.js) and [`minska.min.js`](https://unpkg.com/minska/minska.min.js).

There are also bindings for React over at [minska-react](https://github.com/samisking/minska-react).


## Basic Usage

The store is a simple javascript object. The store is changed with reducers and effects. You update the store by `send`ing an action with the name of the reducer/effect, and some data.

Your reducers _must_ return a new copy of the state. No merging happens in the store itself. If your reducer just returns some value, the state of the store will now be this value.

Effects are asynchronous and when you `send` an effect, `send` will always return a promise. You can also `send` multiple times within an effect.

```js
import { Store } from 'minska';

// The initial state of the store
const state = {
  count: 0
};

// Reducers called by `send` or other effects
const reducers = {
  increment: (state, data) => Object.assign({}, state, {
    count: state.count + 1
  }),
  incrementBy: (state, data) => Object.assign({}, state, {
    count: state.count + data
  }),
  onError: (state, error) => Object.assign({}, state, {
    error
  })
};

// Asynchronous effects called by `send`
const effects = {
  updateCountAsync: (state, data, send) => {
    send('incrementBy', 5);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(20);
      }, 100);
    }).then((count) => {
      send('incrementBy', count);
    }).catch((error) => {
      send('onError', error.message)
    });
  }
};

// Initialise a new store with options
const store = new Store({ state, reducers, effects });

// Then start sending data to your reducers/effects
store.send('increment');
console.log(store.state); // { count: 1 }

store.send('updateCountAsync', 20).then(() => {
  console.log(store.state); // { count: 26 }
});
```

## Combine

You can combine reducers by adding a `namespace` key to each reducer (although not required), and then pass the reducers to `combine()`. This creates a single object where reducer keys are name spaced if one was given. When a name spaced `reducer` is resolved, the `state` argument will be the slice of state that matches the namespace, instead of the global state.

_Important note:_ if two reducer keys are the same and a `namespace` key is not provided, then the last reducer will take precedent.

```js
import { Store, combine } from 'minska';

// Some basic state
const state = {
  title: 'minska is awesome',
  foo: {
    title: 'minska in foo'
  }
};

// A reducer without a `namespace`
const simpleReducer = {
  setTitle: (globalState, title) => Object.assign({}, globalState, { title })
};

// A reducer with a `namespace`
const fooReducer = {
  namespace: 'foo',
  setTitle: (fooState, title) => Object.assign({}, fooState, { title })
};

// Combine the reducers.
const reducers = combine(simpleReducer, fooReducer);

// reducers = {
//   setTitle: [Function: setTitle],
//   'foo:setTitle': [Function: setTitle]
// }

const store = new Store({ state, reducers });

// You can now call `store.send` and change name spaced parts of the state
store.send('setTitle', 'new global title');
store.send('foo:setTitle', 'new title scoped to foo');

// store.state = {
//   title: 'new global title',
//   foo: {
//     title: 'new title scoped to foo'
//   }
// }
```

You can also combine effects, however they will always be passed the global state as an argument. A common use for effects is updating multiple parts of the state tree at a time so name spacing effects is only really useful for more clarity when calling `send`. You can still separate your effects and choose not to name space them though, just bare in mind duplicate effect names will be overridden by the last conflicting effect.

## Hooks

There are a couple of hooks you can use when you initialise a store for logging etc. Hooks are functions that are called with some info about the event, and the current store state is always passed as the last parameter.

```js
const store = new Store({
  state: {},
  reducers: {},
  effects: {},
  onError: (error, state) => {
    console.error(`error: ${error.message}`);
  },
  onAction: (name, data, state) => {
    console.log(`${name}: ${data}`);
  },
  onChange: (nextState, state) => {
    console.log(`state: ${state} » ${nextState}`);
  }
});
```

## Subscriptions

You can also subscribe to the above hooks so many functions can listen to events. For example, the `connect()` component in the [minska-react](https://github.com/samisking/minska-react) library subscribes to the `onChange` event to trigger a re-render of the connected component.

```js
const store = new Store({
  //...
});

// Called every time the state changes in the store
const subscriber = (nextState, state) => {
  console.log(`state: ${state} » ${nextState}`);
};

// Start listening to changes
store.subscribe('onChange', 'uniqueID', subscriber);

// Stop listening to changes
store.unsubscribe('uniqueID');
```
