/* eslint-env mocha */
import {config, AssertionError, expect, use} from 'chai'
import Kefir from 'kefir'
import createTestUtils from '../src'

describe('kefir-test-utils', () => {
  describe('factory', () => {
    it('should return the api', () => {
      expect(createTestUtils(Kefir)).to.be.an('object')
    })
  })
})
