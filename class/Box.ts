import { BoxGeometry, MeshStandardMaterial, Vector3 } from "three";
import { Component } from "lib/Component";
import { abs, random } from "lib/Math";

export class Box extends Component {
  size = 0.5
  geometry = new BoxGeometry(this.size, this.size, this.size)
  material = new MeshStandardMaterial()

  randValue = 0
  jumpValue = 0

  params = {
    color: 0xffffff
  }

  boxses = this.getComponents(Box as any)

  start() {
    this.random()
    this.position.multiply(new Vector3(this.size, this.size, this.size))
    this.material.setValues({
      color: this.params.color
    })
  }

  random() {
    this.randValue = 2000 + random() * 8000
  }

  update(deltaTime: number) {
    // this.randValue -= deltaTime
    // this.jumpValue -= deltaTime*0.002

    // if(this.randValue < 0) {
    //   this.random()
    //   this.jumpValue = 1
    // }

    // if(this.jumpValue < 0)
    //   this.jumpValue = 0

    // this.position.y = 2 - abs(this.jumpValue - 0.5) * 4
  }
}