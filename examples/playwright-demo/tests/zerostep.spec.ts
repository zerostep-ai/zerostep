import { test, expect } from '@playwright/test'
import { ai } from '@zerostep/playwright'

test.describe('Calendly', () => {
  test('book the next available timeslot', async ({ page }) => {
    await page.goto('https://calendly.com/zerostep-test/test-calendly')

    await ai('Verify that a calendar is displayed', { page, test })
    await ai('Dismiss the privacy modal', { page, test })
    await ai('Click on the first day in the month with times available', { page, test })
    await ai('Click on the first available time in the sidebar', { page, test })
    await ai('Click the Next button', { page, test })
    await ai('Fill out the form with realistic values', { page, test })
    await ai('Submit the form', { page, test })

    const element = await page.getByText('You are scheduled')
    expect(element).toBeDefined()
  })
})

test.describe('GitHub', () => {
  test('verify the number of labels in a repo', async ({ page }) => {
    await page.goto('https://github.com/zerostep-ai/zerostep')

    await ai(`Click on the Issues tabs`, { page, test })
    await page.waitForURL('https://github.com/zerostep-ai/zerostep/issues')

    await ai('Click on Labels', { page, test })
    await page.waitForURL('https://github.com/zerostep-ai/zerostep/labels')

    const numLabels = await ai('How many labels are listed?', { page, test }) as string

    expect(parseInt(numLabels)).toEqual(9)
  })
})

test.describe('Google', () => {
  const searchTerm = 'software testing'

  test('search and verify the first organic search result', async ({ page }) => {
    await page.goto('https://www.google.com')

    await ai(`Search for '${searchTerm}'`, { page, test })
    await ai('Hit enter', { page, test })

    await page.waitForURL('https://www.google.com/search**')

    const title = await ai(`What is the title of the first organic search result?`, { page, test })

    console.log('First organic search result is: ', title)
  })
})

test.describe('New York Times', () => {
  test('go to section and verify ad is displayed', async ({ page }) => {
    await page.goto('https://www.nytimes.com')

    await ai(`Hover over the World top nav item`, { page, test })
    await ai('Click the "World" section', { page, test })
    const cta = await ai('What is the CTA of the ad at the top of the page?', { page, test })

    console.log('Call to action is: ', cta)
  })
})

test.describe('Wikipedia', () => {
  test('view article history and verify earliest revision', async ({ page }) => {
    await page.goto('https://en.wikipedia.org/wiki/Software_testing')

    await ai(`Click on "View history" link`, { page, test })
    await ai('Sort by "oldest"', { page, test })
    const date = await ai('What is the date of the first revision listed on this page?', { page, test })

    expect(date).toEqual('16 April 2004')
  })
})

test.describe('Yahoo Finance', () => {
  test('get the latest stock price', async ({ page }) => {
    await page.goto('https://finance.yahoo.com')

    const price = await ai('Return the current price for the S&P 500. Strip out all commas.', { page, test }) as string
    const formattedPrice = parseFloat(price)

    expect(formattedPrice > 4000).toEqual(true)
  })
})