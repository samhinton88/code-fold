import path from "path";

export const relativePathToSource = (consumerPath, producerPath) =>
  producerPath &&
  path.basename(
    path.relative(path.dirname(consumerPath), producerPath),
    path.extname(path.relative(path.dirname(consumerPath), producerPath))
  );
