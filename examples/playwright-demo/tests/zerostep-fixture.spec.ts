import { test } from './test-with-fixture.ts'

test.describe('ZeroStep Fixture', () => {
  test('can use the fixture', async ({ page, ai }) => {
    await page.goto('https://example.org')
    const headerText = await ai('Get the header text')
    await ai('Click the link')
    console.log('Header text was', headerText)
  })
})