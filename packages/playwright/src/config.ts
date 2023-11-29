import * as fs from 'fs'
import * as path from 'path'

let configFile: null | Record<string, string> = null

export const getConfigFile = () => {
  if (!configFile) {
    let cf: Record<string, string> = {}

    const configPath = path.join(process.cwd(), 'zerostep.config.json')
    if (fs.existsSync(configPath)) {
      cf = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }

    configFile = cf
  }

  return configFile
}

export const getConfigValueString = (key: string, fallback?: string) => {
  if (process.env[`ZEROSTEP_${key}`] !== undefined) {
    return process.env[`ZEROSTEP_${key}`]!
  }

  const configFile = getConfigFile()

  if (configFile[key] !== undefined) {
    return configFile[key].toString()
  } else if (fallback) {
    return fallback
  } else {
    return ''
  }
}

// Configurable via environment variables or the config file
export const TOKEN                 = getConfigValueString('TOKEN')
export const WEBSOCKET_PROTOCOL    = getConfigValueString('WEBSOCKET_PROTOCOL', 'https')
export const WEBSOCKET_HOST        = getConfigValueString('WEBSOCKET_HOST', 'devai.us-east-1.reflect.run')
export const PACKAGE_NAME          = getConfigValueString('PACKAGE_NAME', 'zerostep')
export const LOGS_ENABLED_STRING   = getConfigValueString('LOGS_ENABLED', 'false')
export const MAX_TASK_CHARS_STRING = getConfigValueString('MAX_TASK_CHARS', '2000')

// Computed configuration values
export const MAX_TASK_CHARS        = parseInt(MAX_TASK_CHARS_STRING)
export const WEBDRIVER_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
export const WEBSOCKET_URL         = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}/api?key=${TOKEN}`
export const LOGS_ENABLED          = LOGS_ENABLED_STRING === 'true'
