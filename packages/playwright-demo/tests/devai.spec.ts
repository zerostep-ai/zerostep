import { test, expect, Page, chromium } from '@playwright/test';
import { ai } from '@zerostep/playwright'

test('ai support check, do not change', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  const linkText = await ai('Get the link text', { page, test })
  expect(linkText).toBe('More information...')
});

test('task too long', async ({ page }) => {
  await page.goto('https://example.org/');
  const task = new Array(2_001).fill('x').join('')
  try {
    await ai(task, { page, test })
    // The call above will fail, which means the call below won't run
    expect(1).toEqual(2)
  } catch (e) {
    expect(true).toBeTruthy()
  }
});

test('click link', async ({ page }) => {
  await page.goto('https://example.org/');
  await ai('Click the "More information" link', { page, test })
  expect(await page.textContent('h2')).toBe('Further Reading')
});

test('input text', async ({ page }) => {
  await page.goto('http://sandbox.reflect.run/mdh-debugger.html');
  await ai('Type "Hello World" in the input', { page, test })
  expect(await page.inputValue('input')).toBe('Hello World')
});

test('hover over link', async ({ page }) => {
  await ai('Navigate to http://example.org', { page, test })
  const hasSingleLink = await ai('Is there is a single link on the page?', { page, test })
  if (hasSingleLink) {
    const linkText = await ai('Get the link text', { page, test })
    const hoverResult = await ai(`Hover the "${linkText}" link`, { page, test }, { debug: true })
    expect(hoverResult).toBeDefined()
  } else {
    throw Error('Page has more than one link oof')
  }
});

test('navigate to url', async ({ page }) => {
  await page.goto('http://example.org');
  await ai('Navigate to "google.com"', { page, test })
  expect(await page.url()).toEqual('https://www.google.com/');
});

test('scroll the page', async ({ page }) => {
  await page.goto('http://zerostep.com');
  await ai('Scroll down', { page, test })
  await ai('Scroll up', { page, test })
});

test('press enter', async ({ page }) => {
  await page.goto('http://google.com');
  await ai('Type "hello world" in the search input', { page, test })
  await ai('Press enter', { page, test })
});

test('input text in iframe', async ({ page }) => {
  // Go to a simple page with an iframe
  await page.goto('http://sandbox.reflect.run/mdh-simple-iframe.html')
  await ai('Type "hello world" in the input', { page, test })
})

test('click link in iframe', async ({ page }) => {
  // Go to a simple page with an iframe
  await page.goto('http://sandbox.reflect.run/mdh-simple-iframe.html')
  await ai('Click the "click here" link', { page, test })
})

test('click input in iframe', async ({ page }) => {
  // Go to a simple page with an iframe
  await page.goto('http://sandbox.reflect.run/mdh-simple-iframe.html')
  await ai('Click the input', { page, test })
})
