/* eslint-env mocha */
import {config, AssertionError, expect, use} from 'chai'
import Kefir from 'kefir'
import createTestUtils from '../src'

describe('kefir-test-utils', () => {
  const {
    END,
    VALUE,
    ERROR,
    send,
    value,
    error,
    end,
    activate,
    deactivate,
    prop,
    stream,
    pool,
    shakeTimers,
    withFakeTime,
    logItem,
    watch,
    watchWithTime,
  } = createTestUtils(Kefir)

  describe('observable creators', () => {
    it('should create a prop', () => {
      expect(prop()).to.be.instanceof(Kefir.Property)
    })

    it('should create a stream', () => {
      expect(stream()).to.be.instanceof(Kefir.Stream)
    })

    it('should create a pool', () => {
      expect(pool()).to.be.instanceof(Kefir.Pool)
    })
  })

  describe('send', () => {
    let log, obs

    beforeEach(() => {
      log = []
      obs = stream()
      obs.onAny(val => log.push(val))
    })

    it('should send a value', () => {
      send(obs, [value(1)])

      expect(log).to.deep.equal([{type: VALUE, value: 1}])
    })

    it('should send an error', () => {
      send(obs, [error(1)])

      expect(log).to.deep.equal([{type: ERROR, value: 1}])
    })

    it('should send an end', () => {
      send(obs, [end()])

      expect(log).to.deep.equal([{type: END}])
    })

    it('should throw if invalid type', () => {
      expect(() => send(obs, [{type: 'WRONG'}])).to.throw(TypeError)
    })
  })

  describe('(de)activate', () => {
    it('should activate an observable', () => {
      const obs = activate(stream())

      expect(obs._active).to.equal(true)
    })

    it('should deactivate an activated observable', () => {
      const obs = deactivate(activate(stream()))

      expect(obs._active).to.equal(false)
    })
  })

  describe('withFakeTime', () => {
    it('should call callback with tick & clock', () => {
      let called = false

      withFakeTime((tick, clock) => {
        called = true
        expect(tick).to.be.a('function')
        expect(clock).to.be.an('object')

        tick(10)

        expect(+new Date()).to.equal(1010)
      })

      expect(called).to.equal(true)
    })

    it('should call callback with tick & shook clock', () => {
      let called = false

      withFakeTime((tick, clock) => {
        called = true
        expect(tick).to.be.a('function')
        expect(clock).to.be.an('object')

        let count = 0

        tick(5)

        setTimeout(() => expect(++count).to.equal(2), 5)
        setTimeout(() => expect(++count).to.equal(1), 5)

        tick(10)

        expect(+new Date()).to.equal(1015)
        expect(count).to.equal(2)
      }, true)

      expect(called).to.equal(true)
    })

    it('should uninstall & rethrow throw errors', () => {
      const error = new Error('Thrown!')
      let called = false
      let errored = false
      let clock

      try {
        withFakeTime((_tick, _clock) => {
          called = true
          clock = _clock

          throw error
        })
      } catch (err) {
        errored = true
        expect(error).to.equal(err)
        expect(clock.setTimeout).not.to.equal(setTimeout)
      }

      expect(called).to.equal(true)
      expect(errored).to.equal(true)
    })
  })

  describe('watch', () => {
    it('should log values emitted by stream', () => {
      const obs = stream()
      const {log} = watch(obs)
      send(obs, [value(1), error(2), end()])
      expect(log).to.deep.equal([value(1), error(2), end()])
    })

    it('should not log values emitted by stream after unwatch', () => {
      const obs = stream()
      const {log, unwatch} = watch(obs)
      unwatch()
      send(obs, [value(1), error(2), end()])
      expect(log).to.deep.equal([])
    })
  })

  describe('watchWithTime', () => {
    it('should log values emitted by stream', () => {
      const obs = stream()
      const {log} = watchWithTime(obs)
      send(obs, [value(1), error(2), end()])
      expect(log).to.deep.equal([
        [0, value(1)],
        [0, error(2)],
        [0, end()],
      ])
    })

    it('should not log values emitted by stream after unwatch', () => {
      const obs = stream()
      const {log, unwatch} = watchWithTime(obs)
      unwatch()
      send(obs, [value(1), error(2), end()])
      expect(log).to.deep.equal([])
    })
  })
})
