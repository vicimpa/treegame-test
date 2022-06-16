import "index.sass";

import { AmbientLight } from "three";
import { RenderScene } from "lib/RenderScene";

import { Box } from "class/Box";
import { Person } from "class/Person";
import { Platform } from "class/Platform";
import { Lamp } from "class/Lamp";

const scene = new RenderScene(document.body)
const ambient = new AmbientLight(0xffffff, 0.2)

scene.add(ambient)

scene.addComponent(Person)
scene.addComponent(Platform, { y: -.5 })

scene.addComponent(Lamp, { x: 5, y: 4, z: 3 }, null, { intensity: 0.4, radius: 20 })
scene.addComponent(Lamp, { x: -3, y: 5, z: 1 }, null, { intensity: 0.4 })

scene.addComponent(Box, { x: 0, z: 0 }, null, { color: 0xff0000 })
scene.addComponent(Box, { x: 1, z: 0 }, null, { color: 0x00ff00 })
scene.addComponent(Box, { x: 2, z: 0 }, null, { color: 0x0000ff })
scene.addComponent(Box, { x: 3, z: 0 }, null, { color: 0x0000ff })

scene.start()