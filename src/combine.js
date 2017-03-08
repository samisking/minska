// Combines reducers/effects with namespaces to a flattened object
// arr => obj
const combine = (...list) => list.reduce((memo, curr) => {
  const { namespace } = curr;
  const nsKey = `${namespace ? `${namespace}:` : ''}`;

  Object.keys(curr).forEach((item) => {
    if (item !== 'namespace') {
      memo[`${nsKey}${item}`] = curr[item]; // eslint-disable-line no-param-reassign
    }
  });

  return memo;
}, {});

export default combine;
