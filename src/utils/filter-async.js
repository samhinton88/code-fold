export const filterAsync = async (arr, predicate) => {
  const booleanMapping = await Promise.all(arr.map(predicate));

  return arr.filter((_, index) => booleanMapping[index]);
};