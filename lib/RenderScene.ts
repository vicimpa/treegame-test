import { Camera,  Object3D, PerspectiveCamera, Renderer, Scene, WebGLRenderer } from "three";
import { Component } from "./Component";
import { bind } from "./Decorators";

interface IVector3Like {
  x: number
  y: number
  z: number
}
interface IEulerLike {
  x: number
  y: number
  z: number
  order: string
}

export class RenderScene extends Scene {В 
  camera?: Camera
  renderer: Renderer = new WebGLRenderer({
    antialias: true,
    stencil: true
  })

  get domElement() { return this.renderer.domElement }

  get width() { return this.domElement.offsetWidth }
  get height() { return this.domElement.offsetHeight }

  running = false
  lastTime = performance.now()
  deltaTime = 0

  constructor(el: HTMLElement = document.body as any) {
    super()
    el.appendChild(this.renderer.domElement)
    addEventListener('resize', () => this.resize())
    addEventListener('load', () => this.resize())
  }

  setRenderer(renderer: Renderer) {
    this.renderer = renderer
  }

  setCamera(cam: Camera) {
    this.camera = cam
  }

  addComponent<T extends typeof Component>(
    component: T,
    position: Partial<IVector3Like> = {},
    rotation: Partial<IEulerLike> = {},
    params: Partial<InstanceType<T>['params']> = {}
  ) {
    const com: InstanceType<T> = new component(this) as any

    for (let key in position)
      com.position[key as any] = position[key]

    for (let key in rotation)
      com.rotation[key as any] = rotation[key]

    for (let key in params)
      com.params[key as any] = params[key]

    for (let key of com['_childs'] || [])
      if (com[key] instanceof Object3D)
        com.add(com[key])

    for (let key in com['_events'] || {})
      if (Array.isArray(com['_events'][key]))
        for (let k of com['_events'][key])
          com.domElement.addEventListener(key, com[k])

    return com
  }

  update(children: Object3D[] = this.children) {
    if (this.deltaTime) {
      for (let obj of children) {
        if (obj instanceof Component) {

          obj['runStart'](this.deltaTime)
          obj['runUpdate'](this.deltaTime)
        }

        this.update(obj.children)
      }
    }
  }

  checkSize() {
    const { width, height } = this
    const { domElement, camera } = this

    if(
      domElement.width != width || 
      domElement.height != height ||
      (
        camera instanceof PerspectiveCamera && 
        camera.aspect != width / height
      )
    )
      this.resize()
  }
 
  render() {
    this.checkSize()

    if (this.camera && this.renderer)
      this.renderer.render(this, this.camera)
  }

  @bind()
  resize() {
    const { domElement } = this.renderer
    const { parentElement } = domElement

    if (!parentElement) return

    const { offsetWidth, offsetHeight } = parentElement

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = offsetWidth / offsetHeight
      this.camera.updateProjectionMatrix()
    }

    this.renderer.setSize(offsetWidth, offsetHeight)
  }

  start() {
    if (this.running)
      return

    this.running = true
    this.loop()
    this.resize()
  }

  @bind()
  loop() {
    if (this.running)
      requestAnimationFrame(this.loop)

    const now = performance.now()
    this.deltaTime = now - this.lastTime
    this.lastTime = now

    if (this.deltaTime > 50)
      this.deltaTime = 0

    this.update()
    this.render()
  }

  stop() {
    if (!this.running)
      return

    this.running = false
  }
}