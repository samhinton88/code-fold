import db from './query.json';
import { writeFile } from '../utils/io'

let inMemory = db;

export const queryController = ({ rootKey } = { rootKey: process.cwd() }) => ({
  get(key) {
    return inMemory[rootKey + key];
  },
  set(key, value) {
    inMemory[rootKey + key] = value;
  },
  async write(){
    await writeFile(__dirname + '/query.json', JSON.stringify(inMemory));
  }
})