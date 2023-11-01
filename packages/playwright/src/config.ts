export const TOKEN_ENV_VARIABLE    = 'ZEROSTEP_TOKEN'
export const WEB_SOCKET_KEY        = process.env[TOKEN_ENV_VARIABLE]
export const WEB_SOCKET_PROD_URL   = `https://devai.us-east-1.reflect.run/api?key=${WEB_SOCKET_KEY}`
export const WEB_SOCKET_LOCAL_URL  = `http://localhost:8800/api?key=${WEB_SOCKET_KEY}`
export const WEBDRIVER_ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
export const PACKAGE_NAME          = 'tasker'
export const MAX_TASK_CHARS        = 2_000