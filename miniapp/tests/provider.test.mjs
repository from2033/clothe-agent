import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  normalizeStatus,
} = require('../cloudfunctions/getTryOnTask/lib/provider.js')

test('normalizes common provider task states', () => {
  assert.equal(normalizeStatus('completed'), 'succeeded')
  assert.equal(normalizeStatus('SUCCESS'), 'succeeded')
  assert.equal(normalizeStatus('SUCCEEDED'), 'succeeded')
  assert.equal(normalizeStatus('FAILED'), 'failed')
  assert.equal(normalizeStatus('cancelled'), 'failed')
  assert.equal(normalizeStatus('RUNNING'), 'processing')
  assert.equal(normalizeStatus('queued'), 'processing')
})
