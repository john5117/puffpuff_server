'use strict'
/* global describe, it */

const assert = require('assert')

describe('Flour Model', () => {
  it('should exist', () => {
    assert(global.app.api.models['Flour'])
  })
})
