import { utils } from '../src';

describe('utils', () => {
  describe('formatMsg()', () => {
    it('formats a message', () => {
      expect(utils.formatMsg('a formatted message')).toMatchSnapshot();
    });
  });

  describe('validateObjHasOnlyFunctions()', () => {
    it('validates that an object contains only functions', () => {
      const valid = {
        foo: () => {},
        bar: () => {}
      };

      const invalid = {
        foo: () => {},
        bar: 'baz'
      };

      expect(utils.validateObjHasOnlyFunctions(valid)).toBeTruthy();
      expect(utils.validateObjHasOnlyFunctions(invalid)).toBeFalsy();
    });
  });
});
