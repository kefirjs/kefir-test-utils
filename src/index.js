import {install} from '@sinonjs/fake-timers'

const throwEventTypeError = event => {
  throw new TypeError(`Expected event object, received:
${JSON.stringify(event, null, '  ')}`)
}

export default function createTestHelpers(Kefir) {
  const END = 'end'
  const VALUE = 'value'
  const ERROR = 'error'

  const send = (obs, events) => {
    for (const event of events) {
      switch (event.type) {
        case VALUE:
          obs._emitValue(event.value)
          break
        case ERROR:
          obs._emitError(event.value)
          break
        case END:
          obs._emitEnd()
          break
        default:
          throwEventTypeError(event)
      }
    }
    return obs
  }

  const parseDiagram = (diagram, events) => {
    const frames = []

    advancing: for (const frame of diagram) {
      switch (frame) {
        case '-':
          frames.push([])
          break
        case '#':
          frames.push([error(new Error())])
          break
        case '|':
          frames.push([end()])
          break advancing
        default:
          const event = events[frame] ?? value(frame.match(/\d/) ? Number(frame) : frame)
          frames.push(Array.isArray(event) ? event : [event])
          break
      }
    }

    return frames
  }

  const sendFrames = (obs, {frames, advance}) => {
    for (const frame of frames) {
      send(obs, frame)
      advance()
    }
  }

  const value = (val, {current = false} = {}) => ({
    type: VALUE,
    value: val,
    current,
  })

  const error = (err, {current = false} = {}) => ({
    type: ERROR,
    value: err,
    current,
  })

  const end = ({current = false} = {}) => ({
    type: END,
    current,
  })

  const _activateHelper = () => {}

  const activate = obs => {
    obs.onEnd(_activateHelper)
    return obs
  }

  const deactivate = obs => {
    obs.offEnd(_activateHelper)
    return obs
  }

  const prop = () => new Kefir.Property()

  const stream = () => new Kefir.Stream()

  const pool = () => new Kefir.Pool()

  // This function changes timers' IDs so "simultaneous" timers are reversed
  // Also sets createdAt to 0 so closk.tick will sort by ID
  // FIXME:
  //   1) Not sure how well it works with interval timers (setInterval), probably bad
  //   2) We need to restore (unshake) them back somehow (after calling tick)
  //   Hopefully we'll get a native implementation, and wont have to fix those
  //   https://github.com/sinonjs/lolex/issues/24
  const shakeTimers = clock => {
    const ids = Object.keys(clock.timers)
    const timers = ids.map(id => clock.timers[id])

    // see https://github.com/sinonjs/lolex/blob/a93c8a9af05fb064ae5c2ad1bfc72874973167ee/src/lolex.js#L175-L209
    timers.sort((a, b) => {
      if (a.callAt < b.callAt) {
        return -1
      }
      if (a.callAt > b.callAt) {
        return 1
      }
      if (a.immediate && !b.immediate) {
        return -1
      }
      if (!a.immediate && b.immediate) {
        return 1
      }

      // Following two cheks are reversed
      if (a.createdAt < b.createdAt) {
        return 1
      }
      if (a.createdAt > b.createdAt) {
        return -1
      }
      if (a.id < b.id) {
        return 1
      }
      if (a.id > b.id) {
        return -1
      }
    })

    ids.sort((a, b) => a - b)
    timers.forEach((timer, i) => {
      const id = ids[i]
      timer.createdAt = 0
      timer.id = id
      clock.timers[id] = timer
    })
  }

  const withFakeTime = (cb, reverseSimultaneous = false) => {
    const clock = install({now: 1000})
    const tick = t => {
      if (reverseSimultaneous && clock.timers) {
        shakeTimers(clock)
      }
      clock.tick(t)
    }
    let error = null
    try {
      cb(tick, clock)
    } catch (e) {
      error = e
    } finally {
      clock.uninstall()

      if (error) {
        throw error
      }
    }
  }

  const logItem = (event, current) => {
    switch (event.type) {
      case VALUE:
        return value(event.value, {current})
      case ERROR:
        return error(event.value, {current})
      case END:
        return end({current})
      default:
        throwEventTypeError(event)
    }
  }

  const watch = obs => {
    const log = []
    let isCurrent = true
    const fn = event => log.push(logItem(event, isCurrent))
    const unwatch = () => obs.offAny(fn)
    obs.onAny(fn)
    isCurrent = false
    return {log, unwatch}
  }

  const watchWithTime = obs => {
    const startTime = +new Date()
    const log = []
    let isCurrent = true
    const fn = event => log.push([+new Date() - startTime, logItem(event, isCurrent)])
    // const unwatch = () => obs.offAny(fn)
    obs.onAny(fn)
    isCurrent = false

    // Using the array directly is deprecated.
    // Use the log & unwatch properties instead.
    // The return will match `watch` in v2.0.0.
    // log.log = log
    // log.unwatch = unwatch
    return log
  }

  return {
    END,
    VALUE,
    ERROR,
    send,
    parseDiagram,
    sendFrames,
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
  }
}
