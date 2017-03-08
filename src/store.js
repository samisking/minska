import u from './utils';

// Private properties/methods
const State = Symbol('state');
const Emit = Symbol('emit');

class Store {
  constructor({
    state = {},
    reducers = {},
    effects = {},
    onError = () => {},
    onAction = () => {},
    onChange = () => {}
  } = {}) {
    // Test all the namespaced reducers are functions
    if (!u.validateObjHasOnlyFunctions(reducers)) {
      throw new Error(u.formatMsg('All reducers should be functions.'));
    }

    // Test all the namespaced effects are functions
    if (!u.validateObjHasOnlyFunctions(effects)) {
      throw new Error(u.formatMsg('All effects should be functions.'));
    }

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
      const error = new Error(u.formatMsg('Action name must be a string.'));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    if (typeof data === 'function') {
      const error = new Error(u.formatMsg(
        'Data must be a serializable value. A function was passed.'
      ));

      this[Emit]('onError', error, this.state);
      throw error;
    }

    // Emit the `onAction` hook
    this[Emit]('onAction', action, data, this.state);

    // Get the namespace from the action if there is one
    const ns = action.includes(':') ? action.split(':')[0] : null;

    // Get the slice of state that matches the namespace
    let stateSlice = this.state;

    if (ns && stateSlice[ns]) {
      stateSlice = stateSlice[ns];
    } else if (ns) {
      stateSlice = {};
    }

    const effect = this.effects[action];
    const reducer = this.reducers[action];

    // If no effect or reducer can be found, then throw an error,
    // and also notify the `onError` hook
    if (!effect && !reducer) {
      const error = new Error(u.formatMsg(`Can't find reducer or effect with name: ${action}.`));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    // Call the matching effect. It should return a promise so they can do async things.
    if (effect) {
      return Promise.resolve(effect(this.state, data, this.send.bind(this)));
    }

    // Get the result of calling the reducer with the state slice
    const reduced = Object.assign({}, reducer(stateSlice, data));

    // If a namespace is present, then we should add the slice back to the global state
    const nextState = ns ? Object.assign({}, this.state, { [ns]: reduced }) : reduced;

    // Emit the `onChange` hook
    this[Emit]('onChange', nextState, this.state);

    // Actually change the state
    this.state = nextState;

    // Return the next state so send can use it for something
    return nextState;
  }

  // Add subscriptions for events
  // (str, str|num, fn) => null
  subscribe(event, id, fn) {
    if (!this.events.includes(event)) {
      const error = new Error(u.formatMsg(`${event} is not a valid event you can subscribe to.`));
      this[Emit]('onError', error, this.state);
      throw error;
    }

    this.subscriptions.push({ event, id, fn });
  }

  // Remove subscriptions
  // str|num => null
  unsubscribe(id) {
    if (!this.subscriptions.find(s => s.id === id)) {
      const error = new Error(u.formatMsg(`Can't find subscriber with id "${id}".`));
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
