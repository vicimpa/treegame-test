import { Component } from "lib/Component";
import { BoxGeometry, MeshStandardMaterial } from "three";

export class Platform extends Component {
  geometry = new BoxGeometry(100, 0.1, 100)
  material = new MeshStandardMaterial()
}