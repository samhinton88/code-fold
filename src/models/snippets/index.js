import axios from "axios";
import prettier from 'prettier'
import { readFile } from "../../utils/io"
import { engine, resolvers } from 'fetch-snippet-templater'

const baseParserConfig = { singleQuote: true, trailingComma: 'es5' };

const compileMap = {
  js: code => prettier.format(code, { ...baseParserConfig, parser: 'flow' }),
  typescript: code =>
    prettier.format(code, { ...baseParserConfig, parser: 'typescript' }),
  none: s => s
};

const onRead = async (path) => {
  return String(await readFile(path))
}

export const writeSnippet = async (snippet, fullDependencyList, commands) => {
	const result = await engine(compileMap)(() => [
		snippet,
		...fullDependencyList
	])(resolvers.mapResolver, onRead)(commands);

	return result;
}

export const fetchSnippet = async (snippetName) => {
  console.log(process.env.FETCH_SNIPPET_TOKEN)
  const res = await axios.post("http://localhost:3050/api/compile",
    {
      requestedSnippets: [snippetName],
      userId: process.env.FETCH_SNIPPET_USER_ID,
    },
    { headers: {
      "Content-Type": "application/json",
      Authority: process.env.FETCH_SNIPPET_TOKEN,
    }},
  ).catch(() => console.log(process.env));

  return res;
};
