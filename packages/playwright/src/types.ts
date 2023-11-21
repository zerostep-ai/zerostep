import { type TestType } from '@playwright/test/types/test'
import { type Page } from '@playwright/test/types/types'

export { type Protocol } from '@playwright/test/types/protocol.js'
export { type TestType } from '@playwright/test/types/test'
export { type Page, type ElementHandle, type Frame } from '@playwright/test/types/types'

// These are subtypes of our internal types that attempt to make
// interacting with our API easier. They are less restrictive and
// are only used for typesafety.
export type APIPage = Pick<Page, 'mouse' | 'keyboard'>
export type APITestType = Pick<TestType<any, any>, 'step'>
