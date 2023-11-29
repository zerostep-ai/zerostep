<div align="center">
  <picture>
    <source
      srcset="https://github.com/zerostep-ai/zerostep/assets/1895887/4bb7ea13-100d-4fdd-84a6-657751bd2197"
      media="(prefers-color-scheme: dark)"
      height="200" width="200"
    />
    <img
      src="https://github.com/zerostep-ai/zerostep/assets/1895887/7de0b6bd-eed9-4977-b25e-495ecaf197c7"
      alt="ZeroStep Logo"
      height="200" width="200"
    />
  </picture>
</div>

# Zerostep

Supercharge your Playwright tests with AI. Learn more at https://zerostep.com

## Setup

1. Install the @zerostep/playwright dependency
   ```sh
   $ npm i @zerostep/playwright -D
   ```

2. This package relies on an environment variable with your zerostep token being exposed to
   the playwright process, or a config file that holds the token. This token can be found
   in your account on https://app.zerostep.com. You can expose the environment variable
   however you'd like, e.g.
   ```sh
   $ export ZEROSTEP_TOKEN="<your token here>"
   ```
   Alternatively, you can create a `zerostep.config.json` file in the root of your project
   and store the token there, e.g.
   ```json
   {
     "TOKEN": "<your token here>"
   }
   ```

3. Import and use the `ai` function
   ```ts
   import { test } from '@playwright/test'
   import { ai } from '@zerostep/playwright'

   test('zerostep example', async ({ page }) => {
     await page.goto('https://zerostep.com/')

     // An object with page and test must be passed into every call
     const aiArgs = { page, test }
     const headerText = await ai('Get the header text', aiArgs)
     await page.goto('https://google.com/')
     await ai(`Type "${headerText}" in the search box`, aiArgs)
     await ai('Press enter', aiArgs)
   })
   ```

## Usage

At minimum, the `ai()` function requires a plain text prompt and an argument that contains your
`page` and `test` objects.

```ts
ai('<your prompt>', { page, test })
```

You can also pass multiple prompts in an array as the first argument. In that
case prompts will be run concurrently in chunks. The number of prompts being run
in a chunk defaults to `10` and can be controlled by `options`, see below. Note
that each prompt passed into the array counts as a single `ai()` call.

```ts
ai(['<prompt 1>', '<prompt 2>', '<prompt 3>'])
```

### Playwright Fixture

The `zerostep/playwright` library ships with a playwright fixture out of the box. This allows
you to call `ai()` steps without passing the `{ test, page }` argument every time. You can
use the [playwright docs](https://playwright.dev/docs/test-fixtures#creating-a-fixture) as a guide
to get setup, but here's some example code

```ts
// my-test.ts
import { test as base } from '@playwright/test'
import { aiFixture, type AiFixture } from '@zerostep/playwright'

export const test = base.extend<AiFixture>({
  ...aiFixture(base),
})
```

```ts
// my-spec.ts
import { test } from './my-test.ts'

test('I can foo', async ({ ai }) => {
  await ai('click bar')
})
```

There is example code in the `/examples/playwright-demo/tests/zerostep-fixtures.spec.ts` file


### Supported Browsers

This package only supports executing `ai()` steps in Chromium browsers.

### Additional Options

There are additional options you can pass as a third argument

```ts
const options = {
  debug?: boolean,                      // If true, debugging information is returned from the ai() call.
  type?: 'action' | 'assert' | 'query', // Forces the ai step to be interpreted as the specified type.
  model?: 'GPT_3.5',                    // The ai model to use, only GPT_3.5 is supported
  disableScroll?: boolean,              // If true, the ai will not scroll out of view elements into view.
  parallelism?: number,                 // The number of prompts that will be run in a chunk, applies when passing an array of prompts to ai(). Defaults to 10.
  failImmediately?: boolean             // If true and an array of prompts was provided, the function will throw immediately if any prompt throws. Defaults to false.
}

ai('<your prompt>', { page, test }, options)
```

### Supported Actions & Return Values

Depending on the `type` of action (specified above or inferred by the ai function), there
are different behaviors and return types.

**Action**: An action (e.g. "click") is some simulated user interaction with the page, e.g.
a click on a link. It will scroll to perform the given task if required, but favors elements
within the current viewport. Actions will return undefined if they were successful and will
throw an error if they failed, e.g.

```ts
try {
  await ai('Click the link', { page, test })
} catch (e) {
  console.error('Failed to click the link')
}
```

Action prompts will resolve to one or more of the following browser actions:
- Click
- Hover
- Text Input
- 'Enter' keypress
- Scroll
- Navigating to a new URL

Other browser actions such as drag-and-drops and file uploads are not currently supported.

**Query**: A query will return requested data from the visible portion of the page as a string, e.g.

```ts
const linkText = await ai('Get the text of the first link', { page, test })
console.log('The link text is', linkText)
```

**Assert**: An assertion is a question that will return true or false based on the visible portion of the page, e.g.
```ts
const thereAreThreeLinks = await ai('Are there 3 links on the page?', { page, test })
console.log(`"There are 3 links" is a ${thereAreThreeLinks} statement`)
```

## Examples

This repository comes with a demo to quickly experiment with the ai() function. In order to
start using it you need to

1. Build the local version of the zerostep/playwright package
```sh
cd packages/playwright
npm install
npm run build
```
2. Install the zerostep/playwright dependency in the examples directory
```sh
cd ../../examples/playwright-demo
npm install
```
3. Expose the `ZEROSTEP_TOKEN` environment variable or config value (see the "Setup" section above)
4. Run the tests, with or without UI mode
```sh
$ npm run test # or npm run test-ui
```

## Best Practices

ZeroStep AI prompts need not conform to any predefined syntax. However, we recommend following these best practices to
ensure your prompts work as you intend:

- Write your prompts in complete English sentences with no spelling or grammatical mistakes.
- Put quotes around any text that should appear exactly as described. e.g. `Click on the "Login" button`
- Don't include CSS/XPath selectors in your prompt, or any other implementation-level details.
- Don't combine two or more instructions in the same prompt. e.g.
  `Click on the Settings icon and then click on the "User Profile" link`. Instead, each prompt should contain one
  distinct action, query, or assertion.
   - Note: The exception here is Action prompts that perform a single logical task which is accomplished by multiple
     actions. In other words, a prompt like `Fill out the form with realistic values` is a perfectly fine prompt.
- Write prompts to the level of specificity dictated by your requirements. Some level of ambiguity is fine and even
  desirable in a lot of circumstances. A prompt such as `Click on the "Get Started" link` will work even when there are
  multiple "Get Started" links on the page, or if the page is completely redesigned.

## Community

Have questions or suggestions? [Join our Discord](https://discord.gg/BcDmfWqSGe)!

<br>
<br>
<div align="center">
  <picture>
    <source
      srcset="https://github.com/zerostep-ai/zerostep/assets/1895887/74ad3b31-ac30-4376-be58-236cf1f7c033"
      media="(prefers-color-scheme: dark)"
      height="60" width="60"
    />
    <img
      src="https://github.com/zerostep-ai/zerostep/assets/1895887/9a9a848a-302c-4a6e-8f4a-dd7e7633757d"
      alt="ZeroStep Logo"
      height="60" width="60"
    />
  </picture>
</div>
