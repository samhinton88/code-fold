export const followDots = (obj, path) => {
  const res = obj[path.shift()];

  if (path.length) {
    return followDots(res, path);
  }

  return res;
};