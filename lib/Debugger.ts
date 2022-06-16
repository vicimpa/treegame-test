type DebuggerElement = HTMLParagraphElement & {b: HTMLElement | null}

class Debugger {
  element = document.createElement('div')
  data: {[key: string]: DebuggerElement} = {}

  constructor() {
    this.element.className = 'debugger'
    document.body.appendChild(this.element)
  }

  set(name: string, value: any) {
    value = JSON.stringify(value)
    const p = (this.data[name] || document.createElement('p')) as DebuggerElement
    
    if(this.data[name] != p) {
      this.data[name] = p as any
      const span = document.createElement('span')
      const b = document.createElement('pre')

      span.innerText = `${name} = `

      p.appendChild(span)
      p.appendChild(b)
      p['b'] = b

      this.element.appendChild(p)
    }

    if(p.b && p.b.innerHTML != value)
      p.b.innerHTML = value
  }
}

export const debug = new Debugger()