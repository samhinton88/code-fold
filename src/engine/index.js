import path from 'path';
import { Directive } from "../models/directive";
import { getFlatCodebase } from "../utils/get-codebase";
import { filterAsync } from "../utils/filter-async";
import { queryController } from "../caches/controller";

import { errorLogger, memo as errorLogs } from "../utils/error-logger";
import { debounce } from "../utils/debounce";

let locked = true;

let directives, codebase;
const parseDirectives = async () => {
  console.log(process.env.CWD)
  codebase = await getFlatCodebase(process.env.CWD);
  directives = Directive.createBatch(codebase);
};

let batch = [];

const emitAll = async (eventsToEmit) => {
  const consumersDeclaredInSource = directives.filter(
    ({ type }) => type === "consumer"
  );

  for (const event of eventsToEmit) {
    console.log(`${event.toString()} emitting event.`);

    const consumersWhichWillDoWork = consumersDeclaredInSource
      .filter((consumer) => consumer.isTriggeredBy(event));
      
    for (const consumer of consumersWhichWillDoWork) {
      await consumer.doWork(event)
    }
  }
};

const runTestsForBatch = async (paths) => {
  const producersDeclaredInSource = directives.filter(
    ({ type }) => type === "producer"
  );

  const producersToTest = producersDeclaredInSource.filter((event) =>
    paths.some((path) => event.pathPattern.exec(path))
  );

  console.log(`
Will run test for ${producersToTest.length} event${
    producersToTest.length > 1 || producersToTest.length === 0 ? "s" : ""
  }`);

  return filterAsync(producersToTest, (e) => e.test({ codebase, cache: queryController }));
};

const run = async () => {
  errorLogger.reset()
  await parseDirectives();

  const eventsToEmit = await runTestsForBatch(batch);

  batch = [];

  console.log("\nEMIT:\n");

  await emitAll(eventsToEmit);

  console.log('Write query cache.')
  await queryController().write()

  console.log('Clean directive source cache.')
  Directive.refreshMemo();


  if (errorLogs.length) {
    console.log('Errors')
    console.log(errorLogs)
  }
};

const processChange = debounce(() => run());

export const onChange = (filePath) => {
  console.log("CHANGE detected: ", path.relative(process.env.CWD, filePath));

  if (locked) return;

  batch.push(filePath);

  processChange();
};

export const onReady = () => {
  locked = false;
};

export const onAdd = (filePath) => {
  console.log("ADD filePath: ", path.relative(process.env.CWD, filePath));

  batch.push(path);

  if (locked) return;

  processChange();
};
