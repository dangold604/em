import path from 'path'
import sleep from '../../../util/sleep'
import configureSnapshots from '../configureSnapshots'
import helpers from '../helpers'

// configure toMatchImageSnapshot to write the snapshots to __image_snapshots__/{platform}/{filename}
expect.extend({
  toMatchImageSnapshot: configureSnapshots({ fileName: path.basename(__filename).replace('.ts', '') }),
})

vi.setConfig({ testTimeout: 60000, hookTimeout: 20000 })

/* From jest-image-snapshot README:
    
  Jest supports automatic retries on test failures. This can be useful for browser screenshot tests which tend to have more frequent false positives. Note that when using jest.retryTimes you'll have to use a unique customSnapshotIdentifier as that's the only way to reliably identify snapshots.

*/

const { paste, press, screenshot, removeHUD } = helpers()

// Tests the following cases:
// - Single line url
// - Single line url with cursor
it('single line', async () => {
  await removeHUD()

  await paste(`
    - https://test.com/single-line
    - https://test.com/single-line-with-cursor
    - This thought tests the line height of the above thought
  `)

  await press('ArrowUp')

  // wait for render animation to complete
  await sleep(1000)

  const image = await screenshot()
  expect(image).toMatchImageSnapshot()
})

// Tests the following cases:
// - Placeholder with url child
// - Multiline url (ellipsized)
// - Multiline url (with cursor)
it('multiline', async () => {
  await removeHUD()

  await paste(`
    - https://test.com/single-line
    - https://test.com/some/very/very/very/very/very/very/very/very/very/very/very/very/very/very/long/url
    - https://test.com/some/very/very/very/very/very/very/very/very/very/very/very/very/very/very/long/url/with-cursor
    - This thought tests the line height of the above thought
  `)

  await press('ArrowUp')

  // wait for render animation to complete
  await sleep(1000)

  const image = await screenshot()
  expect(image).toMatchImageSnapshot()
})

it('collapsed thought with url child', async () => {
  await removeHUD()

  await paste(`
    - test
      - https://github.com/cybersemics/em
    - 
      - https://github.com/cybersemics/em
  `)

  await press('Escape')

  // wait for render animation to complete
  await sleep(1000)

  const image = await screenshot()
  expect(image).toMatchImageSnapshot()
})
