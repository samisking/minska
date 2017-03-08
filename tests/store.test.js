import Store from '../src';

const state = {
  foo: 'foo',
  error: null
};

const reducers = {
  setFoo: (storeState, foo) => Object.assign({}, storeState, { foo }),
  setError: (storeState, error) => Object.assign({}, storeState, { error })
};

const asyncEffect = data => new Promise((resolve, reject) => {
  if (data === 'throw error') {
    return reject('error text');
  }

  return resolve(data);
});

const effects = {
  asyncEffect: (currState, data, send) =>
    asyncEffect(data)
      .then((newData) => {
        send('setFoo', `${currState.foo}:${newData}`);
      })
      .catch((err) => {
        send('setError', err);
      })
};

describe('store', () => {
  // The actual tests
  describe('init', () => {
    it('sets up correctly', () => {
      const store = new Store();
      expect(store.state).toEqual({});
    });

    it('throws when an effect is not a function', () => {
      expect(() => new Store({ state, reducers, effects: { r: {} } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: [] } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: false } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: true } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: 'string' } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: NaN } })).toThrow();
      expect(() => new Store({ state, reducers, effects: { r: 42 } })).toThrow();
    });

    it('throws when an reducer is not a function', () => {
      expect(() => new Store({ state, reducers: { r: {} } })).toThrow();
      expect(() => new Store({ state, reducers: { r: [] } })).toThrow();
      expect(() => new Store({ state, reducers: { r: false } })).toThrow();
      expect(() => new Store({ state, reducers: { r: true } })).toThrow();
      expect(() => new Store({ state, reducers: { r: 'string' } })).toThrow();
      expect(() => new Store({ state, reducers: { r: NaN } })).toThrow();
      expect(() => new Store({ state, reducers: { r: 42 } })).toThrow();
    });
  });

  describe('state', () => {
    it('gets the correct state', () => {
      const store = new Store({ state, reducers });
      expect(store.state).toEqual(state);
    });

    it('sets the correct state', () => {
      const store = new Store({ state, reducers });
      const newState = { bar: 'baz' };
      expect(store.state).toEqual(state);
      store.state = newState;
      expect(store.state).toMatchSnapshot();
    });
  });

  describe('send()', () => {
    it('correctly updates state using a reducer', () => {
      const store = new Store({ state, reducers });

      expect(store.state).toEqual(state);
      store.send('setFoo', 'bar');
      expect(store.state).toMatchSnapshot();
    });

    it('correctly updates state using an effect', () => {
      const store = new Store({ state, reducers, effects });

      expect(store.state).toEqual(state);
      store.send('asyncEffect', 'bar').then(() => {
        expect(store.state).toMatchSnapshot();
      });
    });

    it('catches errors from effects', () => {
      const store = new Store({ state, reducers, effects });

      expect(store.state).toEqual(state);
      store.send('asyncEffect', 'throw error').then(() => {
        expect(store.state).toMatchSnapshot();
      });
    });

    it('throws when an action is not found', () => {
      const store = new Store({ state, reducers });

      expect(() => store.send('notFound', 'bar')).toThrow();
    });

    it('throws when action name is not a string', () => {
      const store = new Store({ state, reducers });

      expect(() => store.send({})).toThrow();
      expect(() => store.send([])).toThrow();
      expect(() => store.send(jest.fn())).toThrow();
      expect(() => store.send(false)).toThrow();
      expect(() => store.send(undefined)).toThrow();
      expect(() => store.send(true)).toThrow();
      expect(() => store.send(NaN)).toThrow();
      expect(() => store.send('42')).toThrow();
    });

    it('throws when data is a function', () => {
      const store = new Store({ state, reducers });

      expect(() => store.send('setFoo', jest.fn())).toThrow();
    });
  });

  describe('hooks', () => {
    it('correctly handles `onError()` hook', () => {
      const onError = (...args) => expect(args).toMatchSnapshot();
      const store = new Store({ state, reducers, onError });

      expect(() => {
        store.send('causesError', 'bar');
      }).toThrow();
    });

    it('correctly handles `onAction()` hook', () => {
      const onAction = (...args) => expect(args).toMatchSnapshot();
      const store = new Store({ state, reducers, onAction });

      store.send('setFoo', 'bar');
    });

    it('correctly handles `onChange()` hook', () => {
      const onChange = (...args) => expect(args).toMatchSnapshot();
      const store = new Store({ state, reducers, onChange });

      store.send('setFoo', 'bar');
    });
  });

  describe('subscriptions', () => {
    it('allows subscriptions', () => {
      const store = new Store({ state, reducers });
      const sub = () => {};

      store.events.forEach((event, index) => {
        store.subscribe(event, index, sub);
      });

      expect(store.subscriptions).toMatchSnapshot();
    });

    it('throws if subscription event name is invalid', () => {
      const store = new Store({ state, reducers });
      const sub = () => {};

      expect(() => {
        store.subscribe('invalidEventName', 'id', sub);
      }).toThrowErrorMatchingSnapshot();
    });

    it('allows unsubscriptions', () => {
      const store = new Store({ state, reducers });
      const sub = () => {};

      store.subscribe(store.events[0], 'id', sub);
      expect(store.subscriptions).toMatchSnapshot();
      store.unsubscribe('id');
      expect(store.subscriptions).toMatchSnapshot();
    });

    it('throws if unsubscribing with a non-existent sub id', () => {
      const store = new Store({ state, reducers });

      expect(() => {
        store.unsubscribe('not-found');
      }).toThrowErrorMatchingSnapshot();
    });

    it('notifies subscriptions', () => {
      const store = new Store({ state, reducers });
      const sub = jest.fn();

      store.subscribe('onChange', 'id', sub);
      store.send('setFoo', 'dude');
      expect(sub.mock.calls).toMatchSnapshot();
    });
  });
});
