export const aliasFunctions = {
  exported_function: {
    predicate: (path) => {
      // console.log('is in predicate', path.node.declaration.declarations[0].type)
      return path.node.declaration.declarations[0].init.type === 'ArrowFunctionExpression'
    },
    astPart: 'ExportNamedDeclarations'.toLowerCase()
  }
}

export const astDTOs = {
  exportnameddeclarations: (node) => ({
    name: node.declaration.declarations[0].id.name
  }),
  exported_function: (node) => ({
    name: node.declaration.declarations[0].id.name
  })
}