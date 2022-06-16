import { Mesh } from "three";
import { Object3D } from "three/src/core/Object3D";
import { RenderScene } from "./RenderScene";

export class Component extends Mesh {
  first = true
  params = {}

  get renderer() { return this.scene.renderer }
  get domElement() { return this.renderer.domElement }

  lockMouse() {
    this.domElement.requestPointerLock()
  }

  get isLockMouse() {
    return document.pointerLockElement == this.domElement
  }

  constructor(public scene: RenderScene) {
    super()
    scene.add(this)
  }

  getComponent<T extends typeof Component>(
    constructor: T, 
    childs: Object3D[] = this.scene.children
  ): InstanceType<T> | null {
    for(let i = 0; i < childs.length; i++) {
      if(childs[i] instanceof constructor)
        return childs[i] as any

      if(childs.length) {
        const find = this.getComponent(
          constructor, 
          childs[i].children
        )
  
        if(find)
          return find 
      }
    }

    return null
  }

  getComponents<T extends typeof Component>(
    constructor: T, 
    childs: Object3D[] = this.scene.children
  ): InstanceType<T>[] {
    const findArray: InstanceType<T>[] = []

    for(let i = 0; i < childs.length; i++) {
      if(childs[i] instanceof constructor)
        findArray.push(childs[i] as any)

      if(childs.length) 
        findArray.push(...this.getComponents(
          constructor, 
          childs[i].children
        ))
    }

    return findArray
  }

  getComponentWithChild<T extends typeof Component>(
    constructor: T, 
    childs: Object3D[] = this.scene.children
  ): InstanceType<T> | null {
    return this.getComponent(constructor, this.children)
  }

  getComponentsWithChild<T extends typeof Component>(
    constructor: T, 
    childs: Object3D[] = this.scene.children
  ): InstanceType<T>[] {
    return this.getComponents(constructor, this.children)
  }

  private runStart(deltaTime: number) {
    if(!this.first)
      return

    this.first = false
    this.start(deltaTime)
  }

  private runUpdate(deltaTime: number) {
    this.update(deltaTime)
  }

  start(deltaTime: number) {}
  update(deltaTime: number) {}
}