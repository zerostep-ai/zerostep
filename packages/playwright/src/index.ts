import { uuidv7 } from 'uuidv7'
import * as cdp from './cdp.js'
import * as playwright from './playwright.js'
import * as webSocket from './webSocket.js'
import * as meta from './meta.js'
import { PACKAGE_NAME, MAX_TASK_CHARS, TOKEN } from './config.js'
import type { APIPage, APITestType, Page, TestType, ScrollType } from './types.js'
import type {
  CommandRequestZeroStepMessage,
  CommandResponseZeroStepMessage,
  TaskCompleteZeroStepMessage,
  TaskStartZeroStepMessage,
  StepOptions
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

  const { test, page } = config as { page: Page, test: TestType<any, any> }

  return new Promise((resolve, reject) => {
    test.step(`${PACKAGE_NAME}.ai '${task}'`, async () => {
      if (!TOKEN) {
        reject(makeErrorMessage('The $ZEROSTEP_TOKEN environment variable or a zerostep.config.json file with a '
          + '"TOKEN" field must be defined to execute ai steps. You can '
          + 'find your token or sign up for an account at https://app.zerostep.com'
        ))
        return
      } else if (task.length > MAX_TASK_CHARS) {
        reject(makeErrorMessage(`Provided task string is too long, max length is ${MAX_TASK_CHARS} chars`))
        return
      }

      await sendTaskStartMessage(page, task, taskId, options)
      const taskCompleteResponse = await runCommandsToCompletion(page, test, taskId)
      const taskResult = taskCompleteResponse.result

      if (options?.debug) {
        resolve(taskCompleteResponse)
      } else if (taskCompleteResponse.errorMessage) {
        reject(makeErrorMessage(taskCompleteResponse.errorMessage, taskId))
      } else if (!taskResult && taskCompleteResponse.wasSuccessful === false) {
        reject(makeErrorMessage('An unknown error occurred when trying to run the ai step', taskId))
      } else if (!taskResult) {
        resolve(undefined)
      } else if (taskResult.assertion !== undefined) {
        resolve(taskResult.assertion)
      } else if (taskResult.query !== undefined) {
        resolve(taskResult.query)
      } else if (taskResult.actions !== undefined && taskCompleteResponse.wasSuccessful === false) {
        reject(makeErrorMessage('Could not execute ai step as action', taskId))
      } else {
        resolve(undefined)
      }
    })
  }).catch((e) => {
    return test.step(e, async () => {
      console.error(e)
      throw e
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

const makeErrorMessage = (message: string, taskId?: string) => {
  const prefix = `${PACKAGE_NAME}.error '${message}'. Version:${meta.getVersion()}`
  if (taskId) {
    return prefix + ` TaskId:${taskId}`
  } else {
    return prefix
  }
}

/**
 * Sends a message over the websocket to begin an AI task.
 */
const sendTaskStartMessage = async (page: Page, task: string, taskId: string, options?: StepOptions) => {
  const snapshot = await playwright.getSnapshot(page)
  const message: TaskStartZeroStepMessage = {
    type: 'task-start',
    packageVersion: meta.getVersion(),
    taskId,
    task,
    snapshot,
    options,
  }

  await webSocket.sendWebSocketMessage(message)
}

/**
 * Sends a message over the websocket in response to an AI command completing.
 */
const sendCommandResolveMessage = async (index: number, taskId: string, result: any) => {
  const message: CommandResponseZeroStepMessage = {
    type: 'command-response',
    packageVersion: meta.getVersion(),
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
            const prettyCommandName = getPrettyCommandName(data.name)
            test.step(`${PACKAGE_NAME}.action ${prettyCommandName}`, async () => {
              const result = await executeCommand(page, data)
              await sendCommandResolveMessage(data.index, taskId, result)
            })
            break
          case 'task-complete':
            removeListener()
            // If there was a response in the completion, print it as
            // a test step in the actions list.
            if (data.result?.assertion !== undefined) {
              test.step(`${PACKAGE_NAME}.assertion ${data.result.assertion}`, async () => {
                resolve(data)
              })
            } else if (data.result?.query !== undefined) {
              test.step(`${PACKAGE_NAME}.response ${data.result.query}`, async () => {
                resolve(data)
              })
            } else {
              resolve(data)
            }
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
    // CDP
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

    // Queries
    case 'snapshot':
      return await playwright.getSnapshot(page)

    // Actions using CDP Element
    case 'clickElement':
      return await playwright.clickCDPElement(page, command.arguments as { id: string })
    case 'sendKeysToElement':
      return await playwright.clickAndInputCDPElement(page, command.arguments as { id: string, value: string })
    case 'hoverElement':
      return await playwright.hoverCDPElement(page, command.arguments as { id: string })
    case 'scrollElement':
      return await cdp.scrollElement(page, command.arguments as { id: string, target: ScrollType })

    // Actions using Location
    case 'clickLocation':
      return await playwright.clickLocation(page, command.arguments as { x: number, y: number })
    case 'hoverLocation':
      return await playwright.hoverLocation(page, command.arguments as { x: number, y: number })
    case 'clickAndInputLocation':
      return await playwright.clickAndInputLocation(page, command.arguments as { x: number, y: number, value: string })
    case 'getElementAtLocation':
      return await playwright.getElementAtLocation(page, command.arguments as { x: number, y: number })

    // Actions using Device
    case 'sendKeys':
      return await playwright.input(page, command.arguments as { value: string })
    case 'keypressEnter':
      return await playwright.keypressEnter(page)
    case 'navigate':
      return await playwright.navigate(page, command.arguments as { url: string })

    // Actions using Script
    case 'scrollPage':
      return await playwright.scrollPageScript(page, command.arguments as { target: ScrollType })

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

const getPrettyCommandName = (rawCommandName: string) => {
  switch (rawCommandName) {
    case 'clickElement':
    case 'clickLocation':
      return 'click'
    case 'sendKeysToElement':
    case 'clickAndInputLocation':
    case 'sendKeys':
      return 'input'
    case 'hoverElement':
    case 'hoverLocation':
      return 'hover'
    case 'getElementAtLocation':
      return 'getElement'
    case 'keypressEnter':
      return 'pressEnter'
    case 'getDOMSnapshot':
    case 'snapshot':
      return 'analyze'
    default:
      return rawCommandName
  }
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