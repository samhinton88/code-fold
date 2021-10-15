export const skim = (obj, depth = 0) => {
  if (depth === 3) {
    return null;
  }

  const contribution = Object.entries(obj).reduce(
    (acc, [key, val]) => {
      acc[key] =
        typeof val === "object" && val !== null ? skim(val, depth + 1) : val;

      return acc;
    },
    Array.isArray(obj) ? [] : {}
  );

  return contribution;
}; 