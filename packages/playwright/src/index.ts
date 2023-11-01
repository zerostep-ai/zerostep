import * as cdp from './cdp.js'
import * as playwright from './playwright.js'
import * as webSocket from './webSocket.js'
import { PACKAGE_NAME, MAX_TASK_CHARS } from './config.js'
import { type APIPage, type APITestType, type Page, type TestType } from './types.js'
import {
  type CommandRequestZeroStepMessage,
  type CommandResponseZeroStepMessage,
  type TaskCompleteZeroStepMessage,
  type TaskStartZeroStepMessage,
  type StepOptions
} from './webSocket.js'

/**
 * Executes the provided plain-english task. If the test argument is provided
 * we can pretty-print the AI step in UI mode.
 */
export const ai = async (task: string, config: { page: APIPage, test: APITestType }, options?: StepOptions) => {
  return new Promise((resolve, reject) => {
    const { test, page } = config as { page: Page, test: TestType<any, any> }

    test.step(`${PACKAGE_NAME}.ai '${task}'`, async () => {
      if (task.length > MAX_TASK_CHARS) {
        reject(`Provided task string is too long, max length is ${MAX_TASK_CHARS} chars.`)
        return
      }

      // Set to true to see websocket logs
      webSocket.enableLogging(false)

      await sendTaskStartMessage(page, task, options)
      const taskCompleteResponse = await runCommandsToCompletion(page, test)
      const taskResult = taskCompleteResponse.result

      if (options?.debug) {
        resolve(taskCompleteResponse)
      } else if (!taskResult) {
        resolve(undefined)
      } else if (taskResult.assertion !== undefined) {
        resolve(taskResult.assertion)
      } else if (taskResult.query !== undefined) {
        resolve(taskResult.query)
      } else if (taskResult.actions !== undefined && taskCompleteResponse.wasSuccessful === false) {
        reject('Could not execute ai step as action')
      } else {
        resolve(undefined)
      }
    })
  })
}

/**
 * Sends a message over the websocket to begin an AI task.
 */
const sendTaskStartMessage = async (page: Page, task: string, options?: StepOptions) => {
  const snapshot = await playwright.getSnapshot(page)
  const message: TaskStartZeroStepMessage = {
    type: 'task-start',
    task,
    snapshot,
    options: options ? {
      model: options.model ?? 'GPT_3.5',
      debug: options.debug ?? false,
      type: options.type
    } : undefined,
  }

  await webSocket.sendWebSocketMessage(message)
}

/**
 * Sends a message over the websocket in response to an AI command completing.
 */
const sendCommandResolveMessage = async (index: number, result: any) => {
  const message: CommandResponseZeroStepMessage = {
    type: 'command-response',
    index,
    result: result === undefined || result === null ? "null" : JSON.stringify(result),
  }

  await webSocket.sendWebSocketMessage(message)
}

/**
 * Listens for websocket commands, executes them, then responds in a promise that
 * is resolved once we see the task-complete message.
 */
const runCommandsToCompletion = async (page: Page, test: TestType<any, any>) => {
  return new Promise<TaskCompleteZeroStepMessage>((resolve, reject) => {
    webSocket.addWebSocketMessageHandler((data, removeListener) => {
      switch (data.type) {
        case 'command-request':
          const commandName = getReadableCommandName(data.name)
          test.step(`${PACKAGE_NAME}.action ${commandName}`, async () => {
            const result = await executeCommand(page, data)
            await sendCommandResolveMessage(data.index, result)
          })
          break
        case 'task-complete':
          removeListener()
          resolve(data)
          break
      }
    })
  })
}

/**
 * Executes a webdriver command passed over the websocket using CDP.
 */
const executeCommand = async (page: Page, command: CommandRequestZeroStepMessage): Promise<any> => {
  switch (command.name) {

    // Ignored Commands
    case 'isElementDisplayed':
      return true
    case 'isElementEnabled':
      return true
    case 'getTimeouts':
      return { script: 30_000, pageLoad: 300_000, implicit: 0 }
    case 'setTimeout':
      return true

    // CDP Commands
    case 'getDOMSnapshot':
      return await cdp.getDOMSnapshot(page)
    case 'executeScript':
      return await cdp.executeScript(page, command.arguments as { script: string, args: any[] })
    case 'getCurrentUrl':
      return await cdp.getCurrentUrl(page)
    case 'findElements':
      return await cdp.findElements(page, command.arguments as { using: string, value: string })
    case 'getElementTagName':
      return await cdp.getElementTagName(page, command.arguments as { id: string })
    case 'getElementRect':
      return await cdp.getElementRect(page, command.arguments as { id: string })
    case 'clickElement':
      return await cdp.clickElement(page, command.arguments as { id: string })
    case 'getElementAttribute':
      return await cdp.getElementAttribute(page, command.arguments as { id: string, name: string })
    case 'sendKeysToElement':
      return await cdp.sendKeysToElement(page, command.arguments as { id: string, value: string[] })
    case 'clearElement':
      return await cdp.clearElement(page, command.arguments as { id: string })
    case 'get':
      return await cdp.get(page, command.arguments as { url: string })
    case 'getTitle':
      return await cdp.getTitle(page)

    // Reflect Commands
    case '$reflectClickElement':
      return await playwright.clickElement(page, command.arguments as { id: string })
    case '$reflectSendKeysToElement':
      return await playwright.sendKeysToElement(page, command.arguments as { id: string, value: string })
    case '$reflectHoverElement':
      return await playwright.hoverElement(page, command.arguments as { id: string })
    case '$reflectClickLocation':
      return await playwright.clickLocation(page, command.arguments as { x: number, y: number })
    case '$reflectSendKeys':
      return await playwright.sendKeys(page, command.arguments as { value: string })
    case '$reflectHoverLocation':
      return await playwright.hoverLocation(page, command.arguments as { x: number, y: number })
    case '$reflectKeypressEnter':
      return await playwright.keypressEnter(page)
    case '$reflectNavigate':
      return await playwright.navigate(page, command.arguments as { url: string })
    case '$reflectScrollPage':
      return await playwright.scrollPage(page, command.arguments as { target: playwright.ScrollType })
    case '$reflectSnapshot':
      return await playwright.getSnapshot(page)
    case '$reflectScrollIntoView':
      return await cdp.scrollIntoView(page, command.arguments as { id: string })

    default:
      throw Error(`Unsupported command ${command.name}`)
  }
}

const getReadableCommandName = (name: string) => {
  switch (name) {
    case '$reflectClickElement':
      return 'click'
    case '$reflectSendKeysToElement':
      return 'input'
    case '$reflectHoverElement':
      return 'hover'
    case '$reflectClickLocation':
      return 'click'
    case '$reflectSendKeys':
      return 'input'
    case '$reflectHoverLocation':
      return 'hover'
    case '$reflectKeypressEnter':
      return 'press enter'
    case '$reflectNavigate':
      return 'goto'
    case '$reflectScrollPage':
      return 'scroll'
    case '$reflectSnapshot':
      return 'snapshot'
    case '$reflectScrollIntoView':
      return 'scroll into view'
    default:
      return name
  }
}
