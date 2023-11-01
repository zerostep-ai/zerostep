// Configurable via environment variables
export const TOKEN                 = process.env['ZEROSTEP_TOKEN']
export const WEBSOCKET_PROTOCOL    = process.env['ZEROSTEP_WEBSOCKET_PROTOCOL'] || 'https'
export const WEBSOCKET_HOST        = process.env['ZEROSTEP_WEBSOCKET_HOST'] || 'devai.us-east-1.reflect.run'
export const PACKAGE_NAME          = process.env['ZEROSTEP_PACKAGE_NAME'] || 'zerostep'
export const LOGS_ENABLED_STRING   = process.env['ZEROSTEP_LOGS_ENABLED'] || 'false'
export const MAX_TASK_CHARS_STRING = process.env['ZEROSTEP_MAX_TASK_CHARS'] || '2000'

// Computed configuration values
export const MAX_TASK_CHARS        = parseInt(MAX_TASK_CHARS_STRING)
export const WEBDRIVER_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
export const WEBSOCKET_URL         = `${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST}/api?key=${TOKEN}`
export const LOGS_ENABLED          = LOGS_ENABLED_STRING === 'true'
