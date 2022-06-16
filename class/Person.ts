import { BoxGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, TorusGeometry, Vector3 } from "three";
import { Component } from "lib/Component";
import { child, event } from "lib/Decorators";
import { KeyCode, KeyController } from "lib/Keyboard";
import { DPI, max, min, PI, PI2, sin } from "lib/Math";
import { debug } from "lib/Debugger";

export class Person extends Component {
  @child()
  camera = new PerspectiveCamera(50)

  gun = new Mesh(
    new BoxGeometry(0.05, 0.1, 1),
    new MeshStandardMaterial()
  )

  cross = new Mesh(
    new TorusGeometry(0.0013, 0.0001, 100, 100),
    new MeshBasicMaterial({ color: 0xffffff })
  )

  keyboard = new KeyController()

  horizontal = 0.5

  params = {
    mouse: 2.14
  }

  keys = KeyController.makeController({
    w: KeyCode.KeyW,
    s: KeyCode.KeyS,
    a: KeyCode.KeyA,
    d: KeyCode.KeyD,
    shift: KeyCode.Shift,
    space: KeyCode.Space,
    sid: KeyCode.KeyC
  })

  spaceTimeLeft = 600
  spaceTime = -this.spaceTimeLeft
  spaceTimes = 0

  @event('mousedown')
  mouseDown(e: MouseEvent) {
    if (this.isLockMouse)
      return

    this.lockMouse()
  }

  @event('mousemove')
  mouseMove({ movementX, movementY }: MouseEvent) {
    if (!this.isLockMouse)
      return

    const { params } = this
    const axis = -0.001 * params.mouse

    let { y } = this.rotation
    let { x } = this.camera.rotation

    y += movementX * axis
    x += movementY * axis

    x = max(-PI2, min(x, PI2))

    if (y < 0) y += DPI
    if (y > DPI) y -= DPI

    this.rotation.y = y
    this.camera.rotation.x = x
  }

  start() {
    this.scene.setCamera(this.camera)
    this.position.z = 3
    this.position.y = .5

    this.camera.add(this.gun)
    this.camera.add(this.cross)

    this.cross.position.z = -.2

    this.gun.renderOrder = 1
    this.gun.material.depthTest = false
    this.gun.position.z = -.5
    this.gun.position.x = .3
    this.gun.position.y = -.2

    this.camera.castShadow = true

    this.keyboard.onChange((e) => {
      if (e.code != this.keys.space.code)
        return

      if (this.spaceTimes == this.spaceTimeLeft)
        this.spaceTime = e.time
    })
  }

  update(deltaTime: number) {
    const { w, a, s, d, shift, space, sid } = this.keys
    const { horizontal } = this

    const move = new Vector3(
      a.state * -1 * horizontal + d.state * 1 * horizontal, 0,
      w.state * -1 + s.state * 1
    ).normalize()

    const axis = Math.abs(move.x) && !Math.abs(move.z) ? horizontal : 1
    const shiftAxis = shift.state ? 0.5 : 1

    this.spaceTimes = Date.now() - space.timeStart - this.spaceTime

    if (this.spaceTimes > this.spaceTimeLeft)
      this.spaceTimes = this.spaceTimeLeft

    this.position.y = (sid.state ? -0 : 0.5) + 2 * sin((this.spaceTimes / this.spaceTimeLeft) * PI)

    if (this.isLockMouse)
      this.translateOnAxis(move, deltaTime * 0.01 * axis * shiftAxis)
  }
}