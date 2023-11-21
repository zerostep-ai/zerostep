import { type Page, type ElementHandle, type Frame } from './types.js'
import * as cdp from './cdp.js'

export const clickElement = async (page: Page, args: { id: string }) => {
  const { centerX, centerY } = await cdp.getContentQuads(page, { backendNodeId: parseInt(args.id) })
  await clickLocation(page, { x: centerX, y: centerY })
}

export const sendKeysToElement = async (page: Page, args: { id: string, value: string }) => {
  await cdp.focusElement(page, { backendNodeId: parseInt(args.id) })
  await cdp.clearElement(page, args)
  await sendKeys(page, args)
}

export const hoverElement = async (page: Page, args: { id: string }) => {
  const { centerX, centerY } = await cdp.getContentQuads(page, { backendNodeId: parseInt(args.id) })
  await hoverLocation(page, { x: centerX, y: centerY })
}

export const sendKeys = async (page: Page, args: { value: string }) => {
  await page.keyboard.type(args.value)
}

export const clickLocation = async (page: Page, args: { x: number, y: number }) => {
  const element = await getElementAtLocation(page, args)
  if (!element) {
    throw Error(`Unable to find element at ${args.x}, ${args.y}`)
  }

  await element.hover()
  await element.click()
}

export const hoverLocation = async (page: Page, args: { x: number, y: number }) => {
  const element = await getElementAtLocation(page, args)
  if (!element) {
    throw Error(`Unable to find element at ${args.x}, ${args.y}`)
  }

  await element.hover()
}

export const clickAndInputLocation = async (page: Page, args: { x: number, y: number, value: string }) => {
  const element = await getElementAtLocation(page, args)
  if (!element) {
    throw Error(`Unable to find element at ${args.x}, ${args.y}`)
  }

  await element.hover()
  await element.click()
  await element.fill(args.value)
}

export const getViewportMetadata = async (page: Page) => {
  const metadata = await page.evaluate(() => {
    return {
      viewportWidth: window.visualViewport?.width || 0,
      viewportHeight: window.visualViewport?.height || 0,
      pixelRatio: window.devicePixelRatio,
    }
  })

  return metadata
}

export const getScreenshot = async (page: Page) => {
  const buffer = await page.screenshot({ scale: 'css' })
  return buffer.toString('base64')
}

export const getSnapshot = async (page: Page) => {
  const domSnapshotPromise = cdp.getDOMSnapshot(page).then((r) => JSON.stringify(r))
  const screenshotPromise = getScreenshot(page)
  const layoutMetricsPromise = cdp.getLayoutMetrics(page)
  const viewportPromise = getViewportMetadata(page)

  const [
    dom,
    screenshot,
    { viewportWidth, viewportHeight, pixelRatio },
    layoutMetrics,
  ] = await Promise.all([domSnapshotPromise, screenshotPromise, viewportPromise, layoutMetricsPromise])

  return { dom, screenshot, viewportWidth, viewportHeight, pixelRatio, layoutMetrics }
}

export const keypressEnter = async (page: Page) => {
  await page.keyboard.press('Enter')
}

export const navigate = async (page: Page, args: { url: string }) => {
  await page.goto(args.url)
}

export const scrollPage = async (page: Page, args: { target: ScrollType }) => {
  await page.evaluate((evalArgs) => {
    // The viewport should be defined, but if it somehow isn't pick a reasonable default
    const viewportHeight = window.visualViewport?.height ?? 720
    // For relative scrolls, attempt to scroll by 75% of the viewport height
    const relativeScrollDistance = 0.75 * viewportHeight
    const elementToScroll = document.scrollingElement || document.body

    switch (evalArgs.target) {
      case 'top':
        return elementToScroll.scrollTo({ top: 0 })
      case 'bottom':
        return elementToScroll.scrollTo({ top: elementToScroll.scrollHeight })
      case 'up':
        return elementToScroll.scrollBy({ top: -relativeScrollDistance })
      case 'down':
        return elementToScroll.scrollBy({ top: relativeScrollDistance })
      default:
        throw Error(`Unsupported scroll target ${evalArgs.target}`)
    }
  }, args)
}

export const getElementAtLocation = async (page: Page | Frame, args: { x: number, y: number }): Promise<null | ElementHandle<Element>> => {
  const handle = await page.evaluateHandle(({ x, y }) => document.elementFromPoint(x, y), args)
  const element = handle.asElement()
  if (!element) {
    return null
  }

  const tagName = (await element.getProperty('tagName'))?.toString()

  if (tagName === 'IFRAME') {
    const frame = await element.contentFrame()
    if (frame) {
      const boundingClientRect = await element.evaluate((node) => node.getBoundingClientRect())
      return await getElementAtLocation(frame, {
        x: args.x - boundingClientRect.x,
        y: args.y - boundingClientRect.y,
      })
    }
  }

  return element
}

export type ScrollType =
  | 'up'
  | 'down'
  | 'bottom'
  | 'top'