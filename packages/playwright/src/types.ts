import { type TestType } from '@playwright/test'
import { type Page } from '@playwright/test'

export { type TestType } from '@playwright/test'
export { type Page, type ElementHandle, type Frame } from '@playwright/test'

// These are subtypes of our internal types that attempt to make
// interacting with our API easier. They are less restrictive and
// are only used for typesafety.
export type APIPage = Pick<Page, 'mouse' | 'keyboard'>
export type APITestType = Pick<TestType<any, any>, 'step'>

// Step-specific types
export type ScrollType =
  | 'up'
  | 'down'
  | 'bottom'
  | 'top'