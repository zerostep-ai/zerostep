import { expect, test } from './test-with-fixture.ts'

test.describe('SauceDemo', () => {
  test('can login and logout', async ({ page, ai }) => {
    await page.goto('https://www.saucedemo.com/')
    const [username, password] = await ai([
      'Get the first accepted username',
      'Get the accepted password',
    ])
    await ai([
      `Enter ${username} as the username`,
      `Enter ${password} as the password`
    ])
    await ai('Click Login')
    await ai('Click the menu button')
    await ai('Click the logout link')
  })

  test('can login and checkout', async ({ page, ai }) => {
    await page.goto('https://www.saucedemo.com/')
    const [username, password] = await ai([
      'Get the first accepted username',
      'Get the accepted password',
    ])
    await ai([
      `Enter ${username} as the username`,
      `Enter ${password} as the password`
    ])
    await ai('Click Login')
    await ai('Sort by price high to low')
    const [priceOne, priceTwo] = await ai([
      'Get the plain number price of the first item',
      'Get the plain number price of the second item',
    ])
    await ai('Add the first 2 items you can to the cart')
    await ai('Go to the cart')
    await ai('Go to the checkout page')
    await ai('Fill out the form with realistic values')
    const [tax, total] = await ai([
      'Get the plain number cost of tax',
      'Get the plain number total cost',
    ])

    const parsedPrice = parseFloat((parseFloat(priceOne) + parseFloat(priceTwo) + parseFloat(tax)).toFixed(2))
    const parsedTotal = parseFloat((parseFloat(total)).toFixed(2))

    console.log(`total=${parsedTotal}, computed=${parsedPrice}`)
    expect(parsedPrice).not.toBeNaN()
    expect(parsedPrice).toEqual(parsedTotal)
  })
})

test.describe('OrangeHRM', () => {
  test('can login and checkout', async ({ page, ai }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', { waitUntil: 'networkidle' })
    const [username, password] = await ai([
      'Get the username listed on the page',
      'Get the password listed on the page',
    ])
    await ai([
      `Enter ${username} as the username`,
      `Enter ${password} as the password`
    ])
    await ai('Click Login')
    await page.waitForTimeout(5_000)
    await ai('Search for "performance"')
    await ai('Click the Performance link')
    await page.waitForTimeout(2_000)
    await ai('Enter "Fiona" in the employee name input')
    await page.waitForTimeout(2_000)
    await ai('Click "Fiona Grace"')
    await ai('Click the "Search" button in the employee reviews section')
    const noRecordsFound = await ai('Confirm there are no records found')
    expect(noRecordsFound).toEqual(true)
  })
})

test.describe('JSPaint', () => {
  test('can fill the canvas', async ({ page, ai }) => {
    await page.goto('https://jspaint.app/')

    await ai('Click the paint bucket')
    await ai('Click the canvas')
    await ai('Click the eye dropper')
    await ai('Click the canvas')

    const foregroundColorHandle = await page.locator('.swatch.color-selection.foreground-color').evaluateHandle((e) => e.getAttribute('data-color'))
    const foregroundColor = await foregroundColorHandle.jsonValue()
    expect(foregroundColor).toEqual('rgba(0,0,0,1)')
  })
})

test.describe('Reflect', () => {
  test('can scroll elements to the bottom', async ({ page, ai }) => {
    await page.goto('https://reflect.run/docs/')
    await ai('Scroll the sidebar navigation to the bottom')

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('#docs-left-nav > div')?.scrollTop
    })

    console.log('scrollTop', scrollTop)

    expect(scrollTop).toBeTruthy()
  })

  test('can scroll elements to the top', async ({ page, ai }) => {
    await page.goto('https://reflect.run/docs/')
    await ai('Scroll the sidebar navigation to the bottom')
    await ai('Scroll the sidebar navigation to the top')

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('#docs-left-nav > div')?.scrollTop
    })

    console.log('scrollTop', scrollTop)

    expect(scrollTop).toBe(0)
  })

  test('can scroll elements down', async ({ page, ai }) => {
    await page.goto('https://reflect.run/docs/')
    await ai('Scroll the sidebar navigation down')

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('#docs-left-nav > div')?.scrollTop
    })

    console.log('scrollTop', scrollTop)

    expect(scrollTop).toBeTruthy()
  })

  test('can scroll elements up', async ({ page, ai }) => {
    await page.goto('https://reflect.run/docs/')
    await ai('Scroll the sidebar navigation down')
    await ai('Scroll the sidebar navigation up')

    const scrollTop = await page.evaluate(() => {
      return document.querySelector('#docs-left-nav > div')?.scrollTop
    })

    console.log('scrollTop', scrollTop)

    expect(scrollTop).toBe(0)
  })
})
