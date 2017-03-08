import { combine } from '../src';

describe('combine', () => {
  it('combines reducers/effects', () => {
    const reducers = [
      {
        namespace: 'ns',
        setFoo: (storeState, foo) => Object.assign({}, storeState, { foo }),
        setBar: (storeState, foo) => Object.assign({}, storeState, { foo })
      },
      {
        setFoo: (storeState, foo) => Object.assign({}, storeState, { foo })
      }
    ];

    expect(combine(...reducers)).toMatchSnapshot();
  });
});
