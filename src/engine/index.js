import { Directive } from "../models/directive";
import { getFlatCodebase } from "../utils/get-codebase";
import { filterAsync } from "../utils/filter-async";
import { queryController } from "../caches/controller";

import { errorLogger, memo as errorLogs } from "../utils/error-logger";

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
      .filter((consumer) => consumer.isTriggeredBy(event))
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
  Directive.refreshMemo()
  console.log('Errors')
  console.log(errorLogs)
};

function debounce(func, timeout = 1000) {
  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const processChange = debounce(() => run());

export const onChange = (path) => {
  console.log("change", path);

  if (locked) return;

  batch.push(path);

  processChange();
};

export const onReady = () => {
  locked = false;
};

export const onAdd = (path) => {
  console.log("add", path);

  batch.push(path);

  if (locked) return;

  processChange();
};
