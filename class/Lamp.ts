import { Component } from "lib/Component";
import { child } from "lib/Decorators";
import { cos, PI, sin } from "lib/Math";
import { Color, MeshBasicMaterial, PointLight, SphereGeometry } from "three";

export class Lamp extends Component {
  @child()
  light = new PointLight()

  geometry = new SphereGeometry(0.4, 200, 200)
  material = new MeshBasicMaterial()

  params = {
    color: 0xffffff,
    intensity: 1,
    radius: 0
  }

  count = 0
  startPosition = this.position.clone()

  start() {
    const { color, intensity } = this.params
    this.light.color = new Color(color)
    this.light.intensity = intensity

    this.material.setValues({
      color
    })
  }

  update(deltaTime: number) {
    this.count += deltaTime

    const { radius } = this.params
    const { x, z } = this.startPosition

    if (!radius) return

    const angle = this.count * 0.001
    
    this.position.x = x + sin(angle) * radius
    this.position.z = z + cos(angle) * radius
  }
}