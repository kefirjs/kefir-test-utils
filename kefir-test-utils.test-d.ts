import {expectType} from 'tsd'
import Kefir from 'kefir'
import {Clock} from 'lolex'
import createHelpers, {Event, Watcher} from '.'

const {VALUE, ERROR, END, value, error, end, withFakeTime, logItem, watch, watchWithTime} = createHelpers(Kefir)

expectType<string>(VALUE)
expectType<string>(ERROR)
expectType<string>(END)

expectType<Event<string, any>>(value('hello'))
expectType<Event<any, string>>(error('hello'))
expectType<Event<any, any>>(end())

expectType<void>(
  withFakeTime((tick: (s: number) => void, clock: Clock) => {
    tick(10)
    clock.runToLast()
  })
)
expectType<Event<string, number>>(logItem({type: 'value', value: 'hello'}, false))
expectType<Watcher<string, number>>(watch(new Kefir.Stream<string, number>()))
expectType<Event<string, number>[]>(watchWithTime(new Kefir.Stream<string, number>()))
