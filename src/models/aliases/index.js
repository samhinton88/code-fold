const aliasesPluralVersions = (obj) => {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    acc[key + 's'] = {
      ...val,
      astPart: val.astPart + 's'
    }

    return acc
  }, obj)
}

const astDTOSWithPluralVersions = (obj) => {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    acc[key + 's'] = val;

    return acc
  }, obj)
}

export const aliasFunctions = aliasesPluralVersions({
  exported_function: {
    predicate: (path) => {
      // console.log('is in predicate', path.node.declaration.declarations[0].type)
      return path.node.declaration.declarations[0].init.type === 'ArrowFunctionExpression'
    },
    astPart: 'ExportNamedDeclaration'.toLowerCase()
  },
  arrow_function_assignment: {
    predicate: (path) => {
      // console.log('is in predicate', path.node.declaration.declarations[0].type)
      return path.node.init.type === 'ArrowFunctionExpression'
    },
    astPart: 'VariableDeclarator'.toLowerCase()
  },
  exported_async_function: {
    predicate: (path) => {
      return path.node.declaration.declarations[0].init.type === 'ArrowFunctionExpression'
        && path.node.declaration.declarations[0].init.async === true
    },
    astPart: 'ExportNamedDeclaration'.toLowerCase()
  }
})

export const astDTOs = astDTOSWithPluralVersions({
  exportnameddeclaration: (node) => ({
    name: node.declaration.declarations[0].id.name
  }),
  exported_function: (node) => ({
    name: node.declaration.declarations[0].id.name
  }),
  exported_async_function: (node) => ({
    name: node.declaration.declarations[0].id.name
  }),
  arrow_function_assignment: (node) => ({
    name: node.id.name
  })
})