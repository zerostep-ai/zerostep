import { test as base } from '@playwright/test'
import { aiFixture, type AiFixture } from '@zerostep/playwright'

export const test = base.extend<AiFixture>({
  ...aiFixture(base),
})

export { expect } from '@playwright/test'