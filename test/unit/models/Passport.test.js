'use strict'
/* global describe, it */

const assert = require('assert')

describe('Passport Model', () => {
  it('should exist', () => {
    assert(global.app.api.models['Passport'])
  })
})
