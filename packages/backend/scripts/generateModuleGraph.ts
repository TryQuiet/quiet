import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Project, SyntaxKind } from 'ts-morph'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const project = new Project({
  tsConfigFilePath: path.resolve(__dirname, '../tsconfig.json'),
})

const moduleFiles = project.getSourceFiles('src/nest/**/*.module.ts')

type Edge = [string, string]
const edges: Edge[] = []

function stripModuleSuffix(name: string) {
  return name.replace(/Module$/, '')
}

for (const file of moduleFiles) {
  const moduleClass = file.getClasses()[0]
  if (!moduleClass) continue

  const decorator = moduleClass.getDecorator('Module')
  if (!decorator) continue

  const moduleName = stripModuleSuffix(moduleClass.getName() ?? path.basename(file.getFilePath(), '.ts'))

  const [arg] = decorator.getArguments()
  if (!arg || !arg.asKind(SyntaxKind.ObjectLiteralExpression)) continue

  const obj = arg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const importsProp = obj.getProperty('imports')
  if (!importsProp) continue

  const arrayExpr = importsProp.getFirstDescendantByKind(SyntaxKind.ArrayLiteralExpression)
  if (!arrayExpr) continue

  const elements = arrayExpr.getElements()
  for (const el of elements) {
    const imported = el.getText()
    if (!imported || imported.includes('...')) continue
    edges.push([moduleName, stripModuleSuffix(imported)])
  }
}

// Build Mermaid output
const lines: string[] = ['```mermaid', 'graph TD']
for (const [from, to] of edges) {
  lines.push(`  ${from} --> ${to}`)
}
lines.push('```')

const outputPath = path.resolve(__dirname, '../module-graph.mmd')
fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8')
console.log(`✅ Mermaid module graph written to: ${outputPath}`)
