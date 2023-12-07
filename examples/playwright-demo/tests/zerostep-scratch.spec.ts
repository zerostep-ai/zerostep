import { test, expect } from './test-with-fixture.ts'

test('foo', async ({ page, ai }) => {
  await page.goto('https://reflect.run/docs/recording-tests/visual-testing/')
  await ai('Scroll the sidebar element down')
})