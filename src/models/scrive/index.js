import { skim } from "../../utils/skim";
import { followDots } from "../../utils/follow-dots";
import { aliasFunctions, astDTOs } from "../aliases"
import codescrive from "codescrive";
import traverse from "@babel/traverse";
import * as _parser from "@babel/parser";
import build from "@babel/generator";

const parser = (code) =>
  _parser.parse(code, {
    allowImportExportEverywhere: true,
    plugins: ["jsx", "classProperties", "typescript"],
  });


const astConfig = { parser, generator: build, traverse };
export const scrive = ({ astPart, source, sourcePath, predicate = () => true, prop }) => {
  try {
    const scrive = codescrive({ ...astConfig, code: source });
    const subMemo = [];

    const aliasObject = aliasFunctions[astPart];

    let AST_KEY = astPart, pathPredicate = predicate;
    if (aliasObject) {
      console.log('is alias')
      pathPredicate = aliasObject.predicate;
      AST_KEY = aliasObject.astPart;
    }
    
    console.log({ AST_KEY })

    scrive[AST_KEY](null, (p) => {
      try {
        if (!pathPredicate(p)) return;

        const { start, end } = p.node;

        const astDataToExtract = prop
          ? followDots(p.node, prop.split("."))
          : p.node;

        let data =
          typeof astDataToExtract === "object"
            ? skim(astDataToExtract)
            : astDataToExtract;

        if (typeof astDataToExtract === "object" && astPart in astDTOs) {
          data = { ...data, ...astDTOs[astPart](astDataToExtract), sourcePath }
        }

        subMemo.push({ data, loc: p.node.loc, start, end, sourcePath });
      } catch (e) {
        console.log(e);
      }
    });

    return subMemo;
  } catch (e) {
    console.log(e);
  }
};
