import {Observable, Stream, Property, Event as KEvent, Pool} from 'kefir'
import {Clock} from '@sinonjs/fake-timers'

export type Event<V, E> = KEvent<V, E> & {
  current?: boolean
}

export type EventWithTime<V, E> = [number, Event<V, E>]

export type Options = {current: boolean}

export type Watcher<V, E> = {
  log: Event<V, E>[]
  unwatch(): void
}

export interface Helpers {
  END: string
  VALUE: string
  ERROR: string
  send<V, E>(stream$: Observable<V, E>, values: Event<V, E>[]): Observable<V, E>
  value<V, E>(v: V, opts?: Options): Event<V, E>
  error<V, E>(e: E, opts?: Options): Event<V, E>
  end<V, E>(opts?: Options): Event<V, E>
  activate<V, E>(obs: Observable<V, E>): typeof obs
  deactivate<V, E>(obs: Observable<V, E>): typeof obs
  prop<V, E>(): Property<V, E>
  stream<V, E>(): Stream<V, E>
  pool<V, E>(): Pool<V, E>
  shakeTimers(clock: Clock): void
  withFakeTime(cb: (tick: (x: number) => void, clock: Clock) => void, reverseSimultaneous?: boolean): void
  logItem<V, E>(event: KEvent<V, E>, current: boolean): Event<V, E>
  watch<V, E>(obs: Observable<V, E>): Watcher<V, E>
  watchWithTime<V, E>(stream$: Observable<V, E>): EventWithTime<V, E>[]
}

export interface HelpersFactory {
  (Kefir: typeof import('kefir').default): Helpers
}

declare const createHelpers: HelpersFactory

export default createHelpers
