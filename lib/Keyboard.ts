const timeStart = Date.now()
const now = () => Date.now() - timeStart

export interface IController {
  [key: string]: KeyEvent
}

export interface IControllerParam {
  [key: string]: KeyCode
}

export enum KeyCode {
  Backspace = 8,
  Tab = 9,
  Enter = 13,
  Shift = 16,
  ShiftLeft = Shift,
  ShiftRight = Shift,
  Ctrl = 17,
  ControlLeft = Ctrl,
  ControlRight = Ctrl,
  Alt = 18,
  AltLeft = Alt,
  AltRight = Alt,
  PauseBreak = 19,
  CapsLock = 20,
  Escape = 27,
  Space = 32,
  PageUp = 33,
  PageDown = 34,
  End = 35,
  Home = 36,

  LeftArrow = 37,
  UpArrow = 38,
  RightArrow = 39,
  DownArrow = 40,

  Insert = 45,
  Delete = 46,

  Zero = 48,
  Digit0 = Zero,
  ClosedParen = Zero,
  One = 49,
  Digit1 = One,
  ExclamationMark = One,
  Two = 50,
  Digit2 = Two,
  AtSign = Two,
  Three = 51,
  Digit3 = Three,
  PoundSign = Three,
  Hash = PoundSign,
  Four = 52,
  Digit4 = Four,
  DollarSign = Four,
  Five = 53,
  Digit5 = Five,
  PercentSign = Five,
  Six = 54,
  Digit6 = Six,
  Caret = Six,
  Hat = Caret,
  Seven = 55,
  Digit7 = Seven,
  Ampersand = Seven,
  Eight = 56,
  Digit8 = Eight,
  Star = Eight,
  Asterik = Star,
  Nine = 57,
  Digit9 = Nine,
  OpenParen = Nine,

  KeyA = 65,
  KeyB = 66,
  KeyC = 67,
  KeyD = 68,
  KeyE = 69,
  KeyF = 70,
  KeyG = 71,
  KeyH = 72,
  KeyI = 73,
  KeyJ = 74,
  KeyK = 75,
  KeyL = 76,
  KeyM = 77,
  KeyN = 78,
  KeyO = 79,
  KeyP = 80,
  KeyQ = 81,
  KeyR = 82,
  KeyS = 83,
  KeyT = 84,
  KeyU = 85,
  KeyV = 86,
  KeyW = 87,
  KeyX = 88,
  KeyY = 89,
  KeyZ = 90,

  LeftWindowKey = 91,
  MetaLeft = LeftWindowKey,
  RightWindowKey = 92,
  SelectKey = 93,
  ContextMenu = SelectKey,
  MetaRight = SelectKey,

  // macOS Start
  // NumLock = 12,

  // Numpad0 = 48,
  // Numpad1 = 49,
  // Numpad2 = 50,
  // Numpad3 = 51,
  // Numpad4 = 52,
  // Numpad5 = 53,
  // Numpad6 = 54,
  // Numpad7 = 55,
  // Numpad8 = 56,
  // Numpad9 = 57,
  // macOS End

  // Windows Start
  NumLock = 144,

  Numpad0 = 96,
  Numpad1 = 97,
  Numpad2 = 98,
  Numpad3 = 99,
  Numpad4 = 100,
  Numpad5 = 101,
  Numpad6 = 102,
  Numpad7 = 103,
  Numpad8 = 104,
  Numpad9 = 105,
  // Windows End

  NumpadMultiply = 106,
  NumpadAdd = 107,
  NumpadEnter = Enter,
  NumpadSubtract = 109,
  NumpadDecimal = 110,
  NumpadDivide = 111,

  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,

  ScrollLock = 145,

  Semicolon = 186,
  Equals = 187,
  Equal = Equals,
  Comma = 188,
  Dash = 189,
  Minus = Dash,
  Period = 190,
  UnderScore = Dash,
  PlusSign = Equals,
  Slash = 191,
  Backslash = 220,
  Tilde = 192,
  Backquote = Tilde,
  GraveAccent = Tilde,

  BracketLeft = 219,
  BracketRight = 221,
  Quote = 222
}

export enum KeyState {
  UP,
  DOWN,
  DOUBLE
}

export class KeyEvent {
  keyCode: KeyCode
  time: number = 0
  timeStart = timeStart
  state: KeyState = KeyState.UP

  get timeLeft() { return this.state ? now() - this.time : 0 }

  constructor(public code: string, private _ctrl: KeyController) {
    this.keyCode = KeyCode[code]
    Object.defineProperty(this, '_ctrl', {
      enumerable: false
    })
  }

  up() {
    const { state } = this
    this.state = KeyState.UP

    if(this.state != state)
      this._ctrl.emitChange(this)
      
    return this
  }

  down() {
    const { time, state } = this
    this.time = now()

    if (this.time - time < 200) {
      this.state = KeyState.DOUBLE
    }
    else {
      this.state = KeyState.DOWN
    }

    if(this.state != state)
      this._ctrl.emitChange(this)

    return this
  }
}

export type KeyListener = (e: KeyEvent) => any

export class KeyController {
  keys: { [key: number]: KeyEvent } = {}
  timeStart = timeStart
  listeners: KeyListener[] = []

  getKey(key: KeyCode) {
    const code = KeyCode[key]

    if (typeof code != 'string')
      return new KeyEvent(code, this)

    const keyEvent = this.keys[code] ||
      (this.keys[code] = new KeyEvent(code, this))

    return keyEvent as KeyEvent
  }

  getKeys(keys: KeyCode[]) {
    return keys.map(e => this.getKey(e))
  }

  upAll() {
    for (let key in this.keys)
      this.keys[key].up()
  }

  onChange(listener: KeyListener) {
    this.listeners.push(listener)
  }

  offChange(): KeyListener[]
  offChange(listener: KeyListener): KeyListener
  offChange(listener?: KeyListener) {
    if (listener) {
      let index = -1

      while ((index = this.listeners.indexOf(listener)) != -1)
        this.listeners.splice(index, 1)

      return listener
    }

    return this.listeners.splice(0)
  }

  emitChange(e: KeyEvent) {
    for (let i = 0; i < this.listeners.length; i++)
      if (typeof this.listeners[i] == 'function')
        this.listeners[i](e)
  }

  constructor() {
    addEventListener('keydown', ({ code, repeat }) =>
      !repeat && this.getKey(KeyCode[code]).down())

    addEventListener('keyup', ({ code }) =>
      this.getKey(KeyCode[code]).up())

    addEventListener('blur', () =>
      this.upAll())
  }

  static makeController<I extends IControllerParam, O = {[p in keyof I]: KeyEvent}>(v: I): O {
    const output: O = {} as any
    const ctrl = new this()

    for(let [key, value] of Object.entries(v))
      output[key] = ctrl.getKey(value)
    
    return output
  }
}