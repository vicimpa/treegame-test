import { Component } from "./Component"

class Base { }

export function bind(obj?: any) {
  return <T extends typeof Base>(
    p: T['prototype'],
    key: string,
    prop: any
  ) => {
    const { value } = prop

    if (typeof value != 'function')
      return prop

    return {
      get() {
        const object = obj || this
        const binded = value.bind(object)
        Object.defineProperty(object, key, { value: binded })
        return binded
      }
    }
  }
}

export function child() {
  return function<T extends typeof Component>(
    proto: T['prototype'],
    key: string
  ) {
    (<string[]>proto['_childs'] || (proto['_childs'] = [])).push(key)
  }
}

export function event<K extends keyof HTMLElementEventMap>(event: K) {
  return <T extends typeof Component>(
    proto: T['prototype'],
    key: string,
    desc: TypedPropertyDescriptor<(event: HTMLElementEventMap[K]) => any>
  ) => {
    const { value } = desc

    if (typeof value != 'function')
      return desc

    const events: { [key: string]: string[] } =
      proto['_events'] || (proto['_events'] = {})

    const nowEvents: string[] =
      events[event] || (events[event] = [])

    nowEvents.push(key)

    return {
      get() {
        const object = this
        const binded = value.bind(object)
        Object.defineProperty(object, key, { value: binded })
        return binded
      }
    }
  }
}