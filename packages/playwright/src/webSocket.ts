import WebSocket from 'ws'
import { WEB_SOCKET_LOCAL_URL, WEB_SOCKET_PROD_URL } from './config.js'

let loggingEnabled = false
let webSocket: null | WebSocket = null

/**
 * If true, will log messages sent and received over the websocket
 */
export const enableLogging = (b: boolean) => loggingEnabled = b

/**
 * Closes the websocket connection and clears the global shared reference
 */
export const closeWebSocket = async () => {
  if (webSocket) {
    webSocket.close()
    webSocket = null
  }
}

/**
 * Returns a stable reference to a WebSocket connected to the zerostep server.
 */
export const getWebSocket = async () => {
  const promise = new Promise<WebSocket>((resolve, reject) => {

    if (!webSocket) {
      webSocket = new WebSocket(WEB_SOCKET_PROD_URL) // WEB_SOCKET_LOCAL_URL, WEB_SOCKET_PROD_URL
    }

    const ws = webSocket as WebSocket

    if (ws.readyState === ws.OPEN) {
      resolve(ws)
    } else {
      ws.addEventListener('open', (event) => {
        resolve(ws)
      })
    }
  })

  return promise
}

/**
 * Sends a message over the zerostep WebSocket
 */
export const sendWebSocketMessage = async (message: TaskStartZeroStepMessage | CommandResponseZeroStepMessage) => {
  const webSocket = await getWebSocket()
  const data = JSON.stringify(message)
  if (loggingEnabled) {
    console.log('< ws send:', data.slice(0, 250))
  }
  webSocket.send(data)
}

/**
 * Adds an event listener for message events emitted by the WebSocket. The
 * callback receives a parsed object from the message's `data` field. Returns
 * a functions that will remove the listener.
 */
export const addWebSocketMessageHandler = async (handler: (data: TaskCompleteZeroStepMessage | CommandRequestZeroStepMessage, removeListener: () => void) => void) => {
  const webSocket = await getWebSocket()

  const removeListener = () => webSocket.removeEventListener('message', listener)

  const listener = (message: WebSocket.MessageEvent) => {
    const data = message.data as any
    const parsedData = JSON.parse(data) as TaskCompleteZeroStepMessage | CommandRequestZeroStepMessage
    if (loggingEnabled) {
      console.log('> ws recv:', JSON.stringify(parsedData).slice(0, 250))
    }
    handler(parsedData, removeListener)
  }

  webSocket.addEventListener('message', listener)
}

type SupportedModel = 'GPT_3.5' | 'GPT_4'

export type StepOptions = {
  debug?: boolean,
  model?: SupportedModel,
  type?: 'action' | 'assert' | 'query'
}

export type TaskStartZeroStepMessage = {
  type: 'task-start',
  task: string,
  snapshot: {
    dom: string,
    screenshot: string,
    pixelRatio: number,
    viewportWidth: number,
    viewportHeight: number,
  },
  options?: StepOptions,
}

// This message is sent to the client, signaling execution is complete.
export type TaskCompleteZeroStepMessage = {
  type: 'task-complete',
  wasSuccessful: Boolean,
  result?: {
    actions?: ('click' | 'input' | 'hover' | 'keypress' | 'navigate')[],
    assertion?: boolean,
    query?: string,
  }
  model: SupportedModel
}

// This message is sent to the client asking them to perform some command in the browser.
export type CommandRequestZeroStepMessage = {
  type: 'command-request',
  index: number,
  name: string,
  arguments: Record<string, any>
}

// This message is sent from the client in response to the CommandRequestZeroStepMessage and contains the result of the command.
export type CommandResponseZeroStepMessage = {
  type: 'command-response',
  index: number,
  result: any
}