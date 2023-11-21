import { uuidv7 } from 'uuidv7'
import * as cdp from './cdp.js'
import * as playwright from './playwright.js'
import * as webSocket from './webSocket.js'
import { PACKAGE_NAME, MAX_TASK_CHARS, TOKEN } from './config.js'
import { type APIPage, type APITestType, type Page, type TestType } from './types.js'
import {
  type CommandRequestZeroStepMessage,
  type CommandResponseZeroStepMessage,
  type TaskCompleteZeroStepMessage,
  type TaskStartZeroStepMessage,
  type StepOptions
} from './webSocket.js'

/**
 * Executes the provided plain-english task. If an array of tasks is provided
 * as the first argument, tasks will be bundled according to the options.parallelism
 * value (default=10) and executed in parallel. The promise will resolve once all
 * provided tasks have completed
 */
export const ai = async (task: string | string[], config: { page: APIPage, test: APITestType }, options?: ExecutionOptions & StepOptions): Promise<any> => {
  if (!config || !config.page || !config.test) {
    throw Error('The ai() function is missing the required `{ page, test }` argument.')
  } else if (Array.isArray(task)) {
    return runInParallel(task, config, options)
  }

  // Generate a unique ID that all messages in this exchange will use
  const taskId = uuidv7()

  return new Promise((resolve, reject) => {
    const { test, page } = config as { page: Page, test: TestType<any, any> }

    test.step(`${PACKAGE_NAME}.ai '${task}'`, async () => {
      if (!TOKEN) {
        reject('The $ZEROSTEP_TOKEN environment variable must be defined to execute ai steps. You can '
          + 'find your token or sign up for an account at https://app.zerostep.com'
        )
        return
      } else if (task.length > MAX_TASK_CHARS) {
        reject(`Provided task string is too long, max length is ${MAX_TASK_CHARS} chars.`)
        return
      }

      await sendTaskStartMessage(page, task, taskId, options)
      const taskCompleteResponse = await runCommandsToCompletion(page, test, taskId)
      const taskResult = taskCompleteResponse.result

      if (options?.debug) {
        resolve(taskCompleteResponse)
      } else if (taskCompleteResponse.errorMessage) {
        reject(taskCompleteResponse.errorMessage)
      } else if (!taskResult && taskCompleteResponse.wasSuccessful === false) {
        reject('An unknown error occurred when trying to run the ai step')
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
 * A helper function to generate a playwright fixture for ai(). Can be used in
 * a playwright setup
 */
export const aiFixture = (test: APITestType) => {
  return {
    ai: async ({ page }: any, use: any) => {
      const wrapped = async (task: string, options: any) => {
        return await ai(task, { test, page: page }, options)
      }
      use(wrapped)
    }
  }
}

/**
 * Sends a message over the websocket to begin an AI task.
 */
const sendTaskStartMessage = async (page: Page, task: string, taskId: string, options?: StepOptions) => {
  const snapshot = await playwright.getSnapshot(page)
  const message: TaskStartZeroStepMessage = {
    type: 'task-start',
    taskId,
    task,
    snapshot,
    options: options ? {
      debug: options.debug ?? false,
      disableScroll: options.disableScroll ?? false,
      type: options.type,
    } : undefined,
  }

  await webSocket.sendWebSocketMessage(message)
}

/**
 * Sends a message over the websocket in response to an AI command completing.
 */
const sendCommandResolveMessage = async (index: number, taskId: string, result: any) => {
  const message: CommandResponseZeroStepMessage = {
    type: 'command-response',
    taskId,
    index,
    result: result === undefined || result === null ? "null" : JSON.stringify(result),
  }

  await webSocket.sendWebSocketMessage(message)
}

/**
 * Listens for websocket commands, executes them, then responds in a promise that
 * is resolved once we see the task-complete message.
 */
const runCommandsToCompletion = async (page: Page, test: TestType<any, any>, taskId: string) => {
  return new Promise<TaskCompleteZeroStepMessage>((resolve) => {
    webSocket.addWebSocketMessageHandler(taskId, (data, removeListener) => {
      // Only respond to messages corresponding to the task for which this
      // listener was bound.
      if (!data.taskId || data.taskId === taskId) {
        switch (data.type) {
          case 'command-request':
            test.step(`${PACKAGE_NAME}.action ${data.name}`, async () => {
              const result = await executeCommand(page, data)
              await sendCommandResolveMessage(data.index, taskId, result)
            })
            break
          case 'task-complete':
            removeListener()
            resolve(data)
            break
        }
      }
    })
  })
}

/**
 * Executes a webdriver command passed over the websocket using CDP.
 */
const executeCommand = async (page: Page, command: CommandRequestZeroStepMessage): Promise<any> => {
  switch (command.name) {
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
    case 'getElementAttribute':
      return await cdp.getElementAttribute(page, command.arguments as { id: string, name: string })
    case 'clearElement':
      return await cdp.clearElement(page, command.arguments as { id: string })
    case 'get':
      return await cdp.get(page, command.arguments as { url: string })
    case 'getTitle':
      return await cdp.getTitle(page)
    case 'scrollIntoView':
      return await cdp.scrollIntoView(page, command.arguments as { id: string })
    case 'currentUrl':
      return await cdp.getCurrentUrl(page)
    case 'clickElement':
      return await playwright.clickElement(page, command.arguments as { id: string })
    case 'sendKeysToElement':
      return await playwright.sendKeysToElement(page, command.arguments as { id: string, value: string })
    case 'hoverElement':
      return await playwright.hoverElement(page, command.arguments as { id: string })
    case 'clickLocation':
      return await playwright.clickLocation(page, command.arguments as { x: number, y: number })
    case 'sendKeys':
      return await playwright.sendKeys(page, command.arguments as { value: string })
    case 'hoverLocation':
      return await playwright.hoverLocation(page, command.arguments as { x: number, y: number })
    case 'keypressEnter':
      return await playwright.keypressEnter(page)
    case 'navigate':
      return await playwright.navigate(page, command.arguments as { url: string })
    case 'scrollPage':
      return await playwright.scrollPage(page, command.arguments as { target: playwright.ScrollType })
    case 'snapshot':
      return await playwright.getSnapshot(page)
    case 'getElementAtLocation':
      return await playwright.getElementAtLocation(page, command.arguments as { x: number, y: number })

    default:
      throw Error(`Unsupported command ${command.name}`)
  }
}

/**
 * Runs the provided tasks in parallel by chunking them up according to the
 * `parallelism` option and waiting for all chunks to complete.
 */
const runInParallel: typeof ai = async (tasks, config, options) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    Promise.reject('Empty task list, nothing to do')
  }

  const parallelism = options?.parallelism || 10
  const failImmediately = options?.failImmediately || false
  const tasksArray = tasks as string[]
  const allValues: any[] = []

  for (let i = 0; i < tasksArray.length; i += parallelism) {
    const taskPromises = tasksArray.slice(i, i + parallelism).map(_ => ai(_, config, options))

    if (failImmediately) {
      const values = await Promise.all(taskPromises)
      for (let i = 0; i < values.length; i++) {
        const value = values[i]
        allValues.push(value)
      }
    } else {
      const results = await Promise.allSettled(taskPromises)
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        allValues.push(result.status === 'fulfilled' ? result.value : result)
      }
    }
  }

  return allValues
}

type ExecutionOptions = {
  // Specific to the package, sets the max number of steps we'll execute
  // in parallel when ai() is called with an array of tasks
  parallelism?: number,
  // If true, the ai() step will fail immediately once any step fails
  // rather than waiting for other tasks to resolve.
  failImmediately?: boolean,
}

export type AiFixture = {
  ai: (task: string | string[], options?: StepOptions & ExecutionOptions) => ReturnType<typeof ai>,
};