// Private properties/methods
const State = Symbol('state');
const Emit = Symbol('emit');
const M = Symbol('m');

class Store {
  constructor({
    state = {},
    reducers = {},
    effects = {},
    onError = () => {},
    onAction = () => {},
    onChange = () => {}
  } = {}) {
    this[M] = msg => `minska: ${msg}`;

    // Validate that reducers are all functions
    Object.keys(reducers).forEach((reducer) => {
      if (typeof reducers[reducer] !== 'function') {
        throw new Error(this[M]('All reducers should be functions.'));
      }
    });

    // Validate that effects are all functions
    Object.keys(effects).forEach((effect) => {
      if (typeof effects[effect] !== 'function') {
        throw new Error(this[M]('All effects should be functions.'));
      }
    });

    // Store model
    this[State] = state;
    this.reducers = reducers;
    this.effects = effects;

    // List of subscriptions
    this.subscriptions = [];

    // Events you can subscribe too
    this.events = ['onError', 'onAction', 'onChange'];

    // (error, state)
    this.onError = onError;
    // (action, data, state)
    this.onAction = onAction;
    // (nextState, state)
    this.onChange = onChange;
  }

  // Return the current store state
  // => obj
  get state() {
    return this[State];
  }

  // Set the new store state
  // any => null
  set state(nextState) {
    this.onChange(this.state, nextState);
    this[State] = nextState;
  }

  // Update the state by using an effect/reducer that matches an action name
  // (str, any|!func) => promise|obj
  send(action, data) {
    if (typeof action !== 'string') {
      const error = new Error(this[M]('Action name must be a string.'));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    if (typeof data === 'function') {
      const error = new Error(this[M]('Data must be a serializable value. A function was passed.'));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    // Emit the `onAction` hook
    this[Emit]('onAction', action, data, this.state);

    const effect = this.effects[action];
    const reducer = this.reducers[action];

    // If no effect or reducer can be found, then throw an error,
    // and also notify the `onError` hook
    if (!effect && !reducer) {
      const error = new Error(this[M](`Can't find reducer or effect with name: ${action}.`));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    // Call the matching effect. It should return a promise so they can do async things.
    if (effect) {
      return Promise.resolve(effect(this.state, data, this.send.bind(this)));
    }

    // Now we must be in a reducer so we set the state to the result of the reducer,
    // notify any listeners of the new state, and return it so you can get the
    // result from `send()`
    const nextState = Object.assign({}, reducer(this.state, data));
    this.state = nextState;
    this[Emit]('onChange', nextState, this.state);
    return this.state;
  }

  // Add subscriptions for events
  // (str, str|num, fn) => null
  subscribe(event, id, fn) {
    if (!this.events.includes(event)) {
      const error = new Error(this[M](`${event} is not a valid event you can subscribe to.`));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    this.subscriptions.push({ event, id, fn });
  }

  // Remove subscriptions
  // str|num => null
  unsubscribe(id) {
    if (!this.subscriptions.find(s => s.id === id)) {
      const error = new Error(this[M](`Can't find subscriber with id "${id}".`));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    this.subscriptions = this.subscriptions.filter(s => s.id !== id);
  }

  // Notify subscriptions of any events they listen to
  // (str, any|!func) => null
  [Emit](event, ...data) {
    const hook = this[event];
    if (hook) hook(...data);

    this.subscriptions.filter(s => s.event === event).forEach((sub) => {
      sub.fn(...data);
    });
  }
}

export default Store;
