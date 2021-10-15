import { createWatcher } from "../watcher";
import * as handler from "../engine";
import { fetchSnippetLogin } from '../auth';

import yargs from 'yargs';

const { plugins, email, password } = yargs.array('plugins').argv;

(async () => {
  if (plugins && plugins.includes('fetch-snippet')) {
    console.log('Log in to Fetch Snippet.')
    await fetchSnippetLogin({ email, password })
  }

  const deriveCWDFromEnv = (value) =>
    value === "sandbox" ? `${__dirname.split('/src/')[0]}/src/__test__` : process.cwd();
  
  const CWD = deriveCWDFromEnv(process.env.CWD);
  
  process.env.CWD = CWD;

  console.log("Initialising fold watcher from:\n\n", CWD);
  
  createWatcher(CWD, handler);
})()

