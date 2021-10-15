import * as Acorn from "acorn";
import AcornJSX from "acorn-jsx";

import {VM} from 'vm2';

import { errorLogger } from '../../utils/error-logger'

export const BARE_WORD_ATTRIBUTE = Symbol("BARE_WORD_ATTRIBUTE");

export const openingTag = (line) => line.trim().split(" ").slice(0, 3).join("");

export const isLineWithDirective = (line) => openingTag(line).startsWith("//<");

export const isClosingLine = (line) => openingTag(line).startsWith("//</");

export const parseAsJSX = (str) =>
  Acorn.Parser.extend(AcornJSX()).parse(str, { ecmaVersion: "latest" });

export const leadingTag = (line) =>
  line.trim().split(" ").slice(1, 2).join("").substring(1);

export const fullTag = (line) => line.trim().split("//").slice(1).join("");

export const toJSXSafeTag = (tag) =>
  tag.trim().startsWith("</*")
    ? tag.replace("</*", "</")
    : tag.trim().startsWith("<*")
    ? tag.replace("<*", "<")
    : tag;

export const tagIdentifier = (line) =>
  leadingTag(line).endsWith(">")
    ? leadingTag(line).substring(0, leadingTag(line).length - 1)
    : leadingTag(line);

export const isConsumer = (tag) => tag.startsWith("*");

export const isSelfClosing = (line) => line.trim().endsWith("/>");

export const directiveType = (tag) =>
  isConsumer(tag) ? "consumer" : "producer";

export const isClosingLineFor =
  (directiveName, type = "producer") =>
  (line) =>
    tagIdentifier(line) ===
    `${type === "producer" ? "" : "*"}/${directiveName}`;

export const isPropertyValueString = (str) =>
  console.log(str) ||
  (str.trim().startsWith('"') && str.trim().endsWith('"')) ||
  (str.trim().startsWith("'") && str.trim().endsWith("'"));

export const splitByWhitespaceButNotInQuotes = (str) => {
  return JSON.stringify(str);
};

export const getProps = (sourceString) =>
  sourceString.trim().length > 0
    ? Object.fromEntries(
        parseAsJSX(
          sourceString
        ).body[0].expression.openingElement.attributes.map(
          ({ name, value, ...rest }) => [
            name.name,
            value
              ? value.expression
                ? value.expression.value
                : value.value
              : BARE_WORD_ATTRIBUTE,
          ]
        )
      )
    : {};

export const parseDirectivesFromLines = (lines) => {
  const memo = [];
  const toIgnore = [];

  for (let i = 0; i < lines.length; i++) {
    // console.log(toIgnore)
    if (toIgnore.includes(i)) continue;

    const line = lines[i];
    
    if (isLineWithDirective(line)) {
      const type = directiveType(tagIdentifier(line));
      const name =
        type === "consumer"
          ? tagIdentifier(line).substring(1)
          : tagIdentifier(line);

      const jsx =
        toJSXSafeTag(fullTag(line)) +
        (!isSelfClosing(line) ? toJSXSafeTag(`</${name}>`) : "");

      let props;
      try {
        props = getProps(jsx);
      } catch (error) {
        if (!isSelfClosing(line)) {
          const closingTagLine = lines
            .slice(i)
            .find(isClosingLineFor(tagIdentifier(line, type)));
          toIgnore.push(i + lines.slice(i).indexOf(closingTagLine));
        }
        errorLogger("JSX parse error", fullTag(line), jsx, error.message, { index: memo.length });
        continue
      }

      if (props.where) {
        const whereToEvaluate = props.where;
        
        props.where = (data) => {
          const vm = new VM({ sandbox: data, timeout: 1000 });
          return vm.run(whereToEvaluate)
        }
      }

      if (isSelfClosing(line)) {
        memo.push({
          range: [i, i],
          name,
          type,
          props,
          isSelfClosing: true,
          index: memo.length
        });
      } else {
        const closingTagLine = lines
          .slice(i)
          .find(isClosingLineFor(tagIdentifier(line, type)));

        memo.push({
          range: [i, lines.indexOf(closingTagLine)],
          name,
          type,
          props,
          isSelfClosing: false,
          index: memo.length
        });

        toIgnore.push(i + lines.slice(i).indexOf(closingTagLine));
      }
    }
  }

  return memo;
};