import { readFile as rf, readdir as rdr, stat as st } from "fs";
import { promisify } from "util";

const readFile = promisify(rf);
const readDir = promisify(rdr);
const stat = promisify(st);

const blocked = ['node_modules'];

export const getCodebase = async (dPath) => {
  const memo = {};

  const traverseDir = async (dirPath, subMemo) => {
    const dir = await readDir(dirPath);

    for (const item of dir) {
      if (blocked.includes(item)) {
        continue
      }

      const stats = await stat(dirPath + "/" + item);
      if (stats.isDirectory()) {
        subMemo[item] = {};
        await traverseDir(dirPath + "/" + item, subMemo[item]);
      } else {
        subMemo[item] = String(await readFile(dirPath + "/" + item));
      }
    }
  };

  await traverseDir(dPath, memo);
  return memo;
};

export const getFlatCodebase = async (dPath) => {
  const memo = [];

  const traverseDir = async (dirPath, subMemo) => {
    const dir = await readDir(dirPath);

    for (const item of dir) {
      if (blocked.includes(item)) {
        continue
      }

      const stats = await stat(dirPath + "/" + item);
      if (stats.isDirectory()) {
        await traverseDir(dirPath + "/" + item, memo);
      } else {
        memo.push({ source: String(await readFile(dirPath + "/" + item)), sourcePath: dirPath + "/" + item});
      }
    }
  };

  await traverseDir(dPath, memo);
  return memo;
}

