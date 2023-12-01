import * as fs from 'fs'
import * as path from 'path'

let meta: null | Meta = null

const getMeta = () => {
  if (!meta) {
    let m: null | Meta = null

    const packageJsonPath = path.join(__dirname, '../package.json')
    if (fs.existsSync(packageJsonPath)) {
      m = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    }

    meta = m
  }

  return meta
}

export const getVersion = () => {
  const meta = getMeta()
  return meta ? `v${meta.version}` : undefined
}

type Meta = {
  version: string
}