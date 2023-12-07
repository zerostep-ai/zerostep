import type { Page, ElementHandle, Frame, ScrollType } from './types.js'
import * as cdp from './cdp.js'

// Actions using CDP Element
export const hoverCDPElement = async (page: Page, args: { id: string }) => {
  const { centerX, centerY } = await cdp.getContentQuads(page, { backendNodeId: parseInt(args.id) })
  await hoverLocation(page, { x: centerX, y: centerY })
}

export const clickCDPElement = async (page: Page, args: { id: string }) => {
  const { centerX, centerY } = await cdp.getContentQuads(page, { backendNodeId: parseInt(args.id) })
  await clickLocation(page, { x: centerX, y: centerY })
}

export const clickAndInputCDPElement = async (page: Page, args: { id: string, value: string }) => {
  const { centerX, centerY } = await cdp.getContentQuads(page, { backendNodeId: parseInt(args.id) })
  await clickAndInputLocation(page, { x: centerX, y: centerY, value: args.value })
}

export const scrollCDPElement = async (page: Page, args: { id: string, target: ScrollType }) => {
  const element = await cdpElementToPlaywrightHandle(page, { backendNodeId: parseInt(args.id) })
  await scrollElementScript(page, { element, target: args.target })
}

// Actions using Location
export const hoverLocation = async (page: Page, args: { x: number, y: number }) => {
  const { element, tagName, isCustomElement } = await getElementAtLocation(page, args)
  if (!element || tagName === 'CANVAS' || isCustomElement) {
    await hover(page, args)
  } else {
    await hoverElement(page, { element })
  }
}

export const clickLocation = async (page: Page, args: { x: number, y: number }) => {
  const { element, tagName, isCustomElement } = await getElementAtLocation(page, args)
  if (!element || tagName === 'CANVAS' || isCustomElement) {
    await click(page, args)
  } else {
    await clickElement(page, { element })
  }
}

export const clickAndInputLocation = async (page: Page, args: { x: number, y: number, value: string }) => {
  const { element, isCustomElement, tagName } = await getElementAtLocation(page, args)
  if (!element || isCustomElement) {
    await hover(page, args)
    await click(page, args)
    await keypressSelectAll(page)
    await keypressBackspace(page)
    await input(page, args)
  } else if (tagName === 'SELECT') {
    await clickAndSelectOptionElement(page, { element, value: args.value })
  } else {
    await clickAndInputElement(page, { element, value: args.value })
  }
}

// Actions using Element
export const hoverElement = async (page: Page, args: { element: ElementHandle<Element> }) => {
  await args.element.hover()
}

export const clickElement = async (page: Page, args: { element: ElementHandle<Element> }) => {
  await args.element.hover()
  await args.element.click()
}

export const clickAndInputElement = async (page: Page, args: { element: ElementHandle<Element>, value: string }) => {
  await args.element.hover()
  await args.element.click()
  await args.element.fill(args.value)
}

export const clickAndSelectOptionElement = async (page: Page, args: { element: ElementHandle<Element>, value: string }) => {
  await args.element.hover()
  await args.element.click()
  await args.element.selectOption(args.value)
}

// Actions using Device
export const hover = async (page: Page, args: { x: number, y: number }) => {
  await page.mouse.move(args.x, args.y)
}

export const click = async (page: Page, args: { x: number, y: number }) => {
  await page.mouse.move(args.x, args.y)
  await page.mouse.click(args.x, args.y)
}

export const input = async (page: Page, args: { value: string }) => {
  await page.keyboard.type(args.value)
}

export const keypressEnter = async (page: Page) => {
  await page.keyboard.press('Enter')
}

export const keypressSelectAll = async (page: Page) => {
  await page.keyboard.press('Meta+A')
}

export const keypressBackspace = async (page: Page) => {
  await page.keyboard.press('Backspace')
}

export const navigate = async (page: Page, args: { url: string }) => {
  await page.goto(args.url)
}

// Actions using Script
export const scrollPageScript = async (page: Page, args: { target: ScrollType }) => {
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

export const scrollElementScript = async (page: Page, args: { element: ElementHandle<Element>, target: ScrollType }) => {
  await args.element.evaluate((element, evalArgs) => {
    // The element height should be defined, but if it somehow isn't pick a reasonable default
    const elementHeight = element.clientHeight ?? 720
    // For relative scrolls, attempt to scroll by 75% of the element height
    const relativeScrollDistance = 0.75 * elementHeight

    switch (evalArgs.target) {
      case 'top':
        return element.scrollTo({ top: 0 })
      case 'bottom':
        return element.scrollTo({ top: element.scrollHeight })
      case 'up':
        return element.scrollBy({ top: -relativeScrollDistance })
      case 'down':
        return element.scrollBy({ top: relativeScrollDistance })
      default:
        throw Error(`Unsupported scroll target ${evalArgs.target}`)
    }
  }, args)
}

// Meta
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

export const getSnapshot = async (page: Page) => {
  const domSnapshotPromise = cdp.getDOMSnapshot(page).then((r) => JSON.stringify(r))
  const screenshotPromise = page.screenshot({ scale: 'css' }).then((b) => b.toString('base64'))
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

export const cdpElementToPlaywrightHandle = async (page: Page, args: { backendNodeId: number }) => {
  await storeCDPElement(page, args)
  const element = await getStoredCDPElementRef(page)
  await clearStoredCDPElementRef(page)
  return element
}

export const storeCDPElement = async (page: Page, args: { backendNodeId: number }) => {
  await cdp.runFunctionOn(page, {
    functionDeclaration: `function() { window.$$ZEROSTEP_TEMP_NODE = this }`,
    backendNodeId: args.backendNodeId
  })
}

export const getStoredCDPElementRef = async (page: Page) => {
  const handle = await page.evaluateHandle(() => window['$$ZEROSTEP_TEMP_NODE' as any] as unknown as Element)
  return handle.asElement()
}

export const clearStoredCDPElementRef = async (page: Page) => {
  return await page.evaluateHandle(() => delete window['$$ZEROSTEP_TEMP_NODE' as any])
}

export const getElementAtLocation = async (
  context: Page | Frame | ElementHandle<ShadowRoot>,
  args: { x: number, y: number, isShadowRoot?: boolean }
): Promise<{
  element: ElementHandle<Element> | null,
  tagName: string | null,
  isCustomElement: boolean | null,
}> => {
  const handle = args.isShadowRoot
    ? await (context as ElementHandle<ShadowRoot>).evaluateHandle((e, { x, y }) => Reflect.has(e, 'elementFromPoint') ? e.elementFromPoint(x, y) : null, args)
    : await (context as (Page | Frame)).evaluateHandle(({ x, y }) => document.elementFromPoint(x, y), args)

  const element = handle.asElement()
  if (!element) {
    return { element: null, tagName: null, isCustomElement: false }
  }

  const tagName = (await element.getProperty('tagName'))?.toString()
  const isCustomElement = tagName.includes('-')

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

  if (isCustomElement) {
    const shadowRootHandle = await element.evaluateHandle((e) => e.shadowRoot)
    const shadowRoot = shadowRootHandle.asElement()
    if (shadowRoot) {
      return await getElementAtLocation(shadowRoot, {
        x: args.x,
        y: args.y,
        isShadowRoot: true,
      })
    }
  }

  return {
    element,
    tagName,
    isCustomElement,
  }
}
