import {
  BufferGeometry,
  FileLoader,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Loader,
  Material,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Vector3
} from "three"

// o object_name | g group_name
const _object_pattern = /^[og]\s*(.+)?/
// mtllib file_reference
const _material_library_pattern = /^mtllib /
// usemtl material_name
const _material_use_pattern = /^usemtl /
// usemap map_name
const _map_use_pattern = /^usemap /

const _vA = new Vector3()
const _vB = new Vector3()
const _vC = new Vector3()

const _ab = new Vector3()
const _cb = new Vector3()

export class LoadedMaterial {
  index = 0
  name = ''
  mtllib: any // todo
  smooth = false
  groupStart = 0
  groupEnd = -1
  groupCount = - 1
  inherited = false

  clone(index = this.index) {
    const cloned = new LoadedMaterial()

    cloned.index = index
    cloned.name = this.name
    cloned.mtllib = this.mtllib
    cloned.smooth = this.smooth
    cloned.groupStart = this.groupStart
    cloned.groupEnd = this.groupEnd
    cloned.groupCount = this.groupCount
    cloned.inherited = this.inherited

    return cloned
  }
}

export class LoadedGeometry {
  type = ''
  vertices: number[] = []
  normals: number[] = []
  colors: number[] = []
  uvs: number[] = []
  hasUVIndices: boolean = false
}

export class LoadedObject {
  name: string
  fromDeclaration: boolean
  geometry: LoadedGeometry = new LoadedGeometry()
  materials: LoadedMaterial[] = []
  smooth = false

  constructor(name: string, fromDeclaration?: boolean) {
    this.name = name || ''
    this.fromDeclaration = fromDeclaration !== false
  }

  startMaterial(name: string, libraries: string[]): LoadedMaterial {
    const material = new LoadedMaterial()
    const previous = this._finalize(false)

    if (previous && (previous.inherited || previous.groupCount <= 0))
      this.materials.splice(previous.index, 1)

    material.index = this.materials.length
    material.name = name
    material.mtllib = Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : ''
    material.smooth = previous ? previous.smooth : this.smooth
    material.groupStart = previous ? previous.groupEnd : 0

    this.materials.push(material)
    return material
  }

  currentMaterial() {
    if (this.materials.length > 0)
      return this.materials[this.materials.length - 1]

    return null
  }

  _finalize(end?: boolean) {
    const lastMultiMaterial = this.currentMaterial()

    if (lastMultiMaterial && lastMultiMaterial.groupEnd === - 1) {
      lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3
      lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart
      lastMultiMaterial.inherited = false
    }

    // Ignore objects tail materials if no face declarations followed them before a new o/g started.
    if (end && this.materials.length > 1) {
      for (let mi = this.materials.length - 1; mi >= 0; mi--) {
        if (this.materials[mi].groupCount <= 0) {
          this.materials.splice(mi, 1)
        }
      }
    }

    // Guarantee at least one empty material, this makes the creation later more straight forward.
    if (end && this.materials.length === 0) {
      const material = new LoadedMaterial()
      material.smooth = this.smooth
      this.materials.push(material)
    }

    return lastMultiMaterial
  }
}

export class LoadedState {
  objects = []
  object: LoadedObject = null

  vertices: number[] = []
  normals: number[] = []
  colors: number[] = []
  uvs: number[] = []

  materials = {}
  materialLibraries = []

  startObject(name: string, fromDeclaration?: boolean) {
    if (this.object && this.object.fromDeclaration === false) {
      this.object.name = name
      this.object.fromDeclaration = (fromDeclaration !== false)
      return
    }

    const previousMaterial = (this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined)

    if (this.object && typeof this.object._finalize === 'function') {
      this.object._finalize(true)
    }

    this.object = new LoadedObject(name, fromDeclaration)

    if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {

      const declared = previousMaterial.clone(0)
      declared.inherited = true
      this.object.materials.push(declared)

    }

    this.objects.push(this.object)
  }

  parseVertexIndex(value: string, len: number) {
    const index = parseInt(value, 10)
    return (index >= 0 ? index - 1 : index + len / 3) * 3
  }

  parseNormalIndex(value: string, len: number) {
    const index = parseInt(value, 10)
    return (index >= 0 ? index - 1 : index + len / 3) * 3
  }

  parseUVIndex(value: string, len: number) {
    const index = parseInt(value, 10)
    return (index >= 0 ? index - 1 : index + len / 2) * 2
  }

  addVertex(a: number, b: number, c: number) {
    const src = this.vertices
    const dst = this.object.geometry.vertices

    dst.push(src[a + 0], src[a + 1], src[a + 2])
    dst.push(src[b + 0], src[b + 1], src[b + 2])
    dst.push(src[c + 0], src[c + 1], src[c + 2])
  }

  addVertexPoint(a: number) {
    const src = this.vertices
    const dst = this.object.geometry.vertices

    dst.push(src[a + 0], src[a + 1], src[a + 2])
  }

  addVertexLine(a: number) {
    const src = this.vertices
    const dst = this.object.geometry.vertices

    dst.push(src[a + 0], src[a + 1], src[a + 2])
  }

  addNormal(a: number, b: number, c: number) {
    const src = this.normals
    const dst = this.object.geometry.normals

    dst.push(src[a + 0], src[a + 1], src[a + 2])
    dst.push(src[b + 0], src[b + 1], src[b + 2])
    dst.push(src[c + 0], src[c + 1], src[c + 2])
  }

  addFaceNormal(a: number, b: number, c: number) {
    const src = this.vertices
    const dst = this.object.geometry.normals

    _vA.fromArray(src, a)
    _vB.fromArray(src, b)
    _vC.fromArray(src, c)

    _cb.subVectors(_vC, _vB)
    _ab.subVectors(_vA, _vB)
    _cb.cross(_ab)

    _cb.normalize()

    dst.push(_cb.x, _cb.y, _cb.z)
    dst.push(_cb.x, _cb.y, _cb.z)
    dst.push(_cb.x, _cb.y, _cb.z)
  }

  addColor(a?: number, b?: number, c?: number) {
    const src = this.colors
    const dst = this.object.geometry.colors

    if (src[a] !== undefined) dst.push(src[a + 0], src[a + 1], src[a + 2])
    if (src[b] !== undefined) dst.push(src[b + 0], src[b + 1], src[b + 2])
    if (src[c] !== undefined) dst.push(src[c + 0], src[c + 1], src[c + 2])
  }

  addUV(a: number, b: number, c: number) {
    const src = this.uvs
    const dst = this.object.geometry.uvs

    dst.push(src[a + 0], src[a + 1])
    dst.push(src[b + 0], src[b + 1])
    dst.push(src[c + 0], src[c + 1])
  }

  addDefaultUV() {
    const dst = this.object.geometry.uvs

    dst.push(0, 0)
    dst.push(0, 0)
    dst.push(0, 0)
  }

  addUVLine(a: number) {
    const src = this.uvs
    const dst = this.object.geometry.uvs

    dst.push(src[a + 0], src[a + 1])
  }

  addFace<V extends string>(a: V, b: V, c: V, ua: V, ub: V, uc: V, na: V, nb: V, nc: V) {
    const vLen = this.vertices.length

    let ia = this.parseVertexIndex(a, vLen)
    let ib = this.parseVertexIndex(b, vLen)
    let ic = this.parseVertexIndex(c, vLen)

    this.addVertex(ia, ib, ic)
    this.addColor(ia, ib, ic)

    // normals
    if (na !== undefined && na !== '') {
      const nLen = this.normals.length

      ia = this.parseNormalIndex(na, nLen)
      ib = this.parseNormalIndex(nb, nLen)
      ic = this.parseNormalIndex(nc, nLen)

      this.addNormal(ia, ib, ic)
    } else {
      this.addFaceNormal(ia, ib, ic)
    }

    // uvs
    if (ua !== undefined && ua !== '') {
      const uvLen = this.uvs.length

      ia = this.parseUVIndex(ua, uvLen)
      ib = this.parseUVIndex(ub, uvLen)
      ic = this.parseUVIndex(uc, uvLen)

      this.addUV(ia, ib, ic)

      this.object.geometry.hasUVIndices = true
    } else {
      // add placeholder values (for inconsistent face definitions)
      this.addDefaultUV()
    }
  }

  addPointGeometry(vertices: string[]) {
    this.object.geometry.type = 'Points'

    const vLen = this.vertices.length

    for (let vi = 0, l = vertices.length; vi < l; vi++) {
      const index = this.parseVertexIndex(vertices[vi], vLen)

      this.addVertexPoint(index)
      this.addColor(index)
    }
  }

  addLineGeometry(vertices: string[], uvs: string[]) {
    this.object.geometry.type = 'Line'

    const vLen = this.vertices.length
    const uvLen = this.uvs.length

    for (let vi = 0, l = vertices.length; vi < l; vi++) {
      this.addVertexLine(this.parseVertexIndex(vertices[vi], vLen))
    }

    for (let uvi = 0, l = uvs.length; uvi < l; uvi++) {
      this.addUVLine(this.parseUVIndex(uvs[uvi], uvLen))
    }
  }

  finalize() {
    if (this.object && typeof this.object._finalize === 'function')
      this.object._finalize(true)
  }
}


export class OBJLoader extends Loader {
  materials = null

  setMaterials(materials) {
    this.materials = materials
    return this
  }

  async fromUrl(url: string, onProgress?: () => void) {
    const loader = new FileLoader(this.manager)

    return new Promise((resolve, reject) => {
      loader.setPath(this.path)
      loader.setRequestHeader(this.requestHeader)
      loader.setWithCredentials(this.withCredentials)

      loader.load(url, (text) => {
        try {
          resolve(this.fromText(text.toString()))
        } catch (e) {
          reject(e)
          this.manager.itemError(url)
        }
      }, onProgress, reject)
    })
  }

  fromText(text = '') {
    const state = new LoadedState()

    state.startObject('', false)

    if (text.indexOf('\r\n') !== - 1)
      text = text.replace(/\r\n/g, '\n')

    if (text.indexOf('\\\n') !== - 1)
      text = text.replace(/\\\n/g, '')

    const lines = text.split('\n')
    let line = '', lineFirstChar = ''
    let lineLength = 0
    let result = []

    const trimLeft = (typeof ''.trimLeft === 'function')

    for (let i = 0, l = lines.length; i < l; i++) {
      line = lines[i]
      line = trimLeft ? line.trimLeft() : line.trim()
      lineLength = line.length

      if (lineLength === 0)
        continue

      lineFirstChar = line.charAt(0)

      if (lineFirstChar === '#')
        continue

      if (lineFirstChar === 'v') {
        const data = line.split(/\s+/)

        switch (data[0]) {
          case 'v':
            state.vertices.push(
              parseFloat(data[1]),
              parseFloat(data[2]),
              parseFloat(data[3])
            )
            if (data.length >= 7) {
              state.colors.push(
                parseFloat(data[4]),
                parseFloat(data[5]),
                parseFloat(data[6])
              )
            } else {
              state.colors.push(undefined, undefined, undefined)
            }

            break
          case 'vn':
            state.normals.push(
              parseFloat(data[1]),
              parseFloat(data[2]),
              parseFloat(data[3])
            )
            break
          case 'vt':
            state.uvs.push(
              parseFloat(data[1]),
              parseFloat(data[2])
            )
            break

        }

      } else if (lineFirstChar === 'f') {

        const lineData = line.substr(1).trim()
        const vertexData = lineData.split(/\s+/)
        const faceVertices: string[][] = []

        // Parse the face vertex data into an easy to work with format
        for (let j = 0, jl = vertexData.length; j < jl; j++) {
          const vertex = vertexData[j]

          if (vertex.length > 0) {
            const vertexParts = vertex.split('/')
            faceVertices.push(vertexParts)
          }
        }

        // Draw an edge between the first vertex and all subsequent vertices to form an n-gon
        const v1 = faceVertices[0]

        for (let j = 1, jl = faceVertices.length - 1; j < jl; j++) {
          const v2 = faceVertices[j]
          const v3 = faceVertices[j + 1]

          state.addFace(
            v1[0], v2[0], v3[0],
            v1[1], v2[1], v3[1],
            v1[2], v2[2], v3[2]
          )
        }

      } else if (lineFirstChar === 'l') {
        const lineParts = line.substring(1).trim().split(' ')
        let lineVertices = []
        const lineUVs = []

        if (line.indexOf('/') === - 1) {
          lineVertices = lineParts
        } else {
          for (let li = 0, llen = lineParts.length; li < llen; li++) {
            const parts = lineParts[li].split('/')

            if (parts[0] !== '') lineVertices.push(parts[0])
            if (parts[1] !== '') lineUVs.push(parts[1])
          }
        }

        state.addLineGeometry(lineVertices, lineUVs)
      } else if (lineFirstChar === 'p') {
        const lineData = line.substr(1).trim()
        const pointData = lineData.split(' ')

        state.addPointGeometry(pointData)
      } else if ((result = _object_pattern.exec(line)) !== null) {
        const name = (' ' + result[0].substr(1).trim()).substr(1)
        state.startObject(name)
      } else if (_material_use_pattern.test(line)) {
        // material
        state.object.startMaterial(line.substring(7).trim(), state.materialLibraries)
      } else if (_material_library_pattern.test(line)) {
        // mtl file
        state.materialLibraries.push(line.substring(7).trim())
      } else if (_map_use_pattern.test(line)) {
        console.warn('THREE.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.')
      } else if (lineFirstChar === 's') {
        result = line.split(' ')

        if (result.length > 1) {
          const value = result[1].trim().toLowerCase()
          state.object.smooth = (value !== '0' && value !== 'off')
        } else {
          state.object.smooth = true
        }

        const material = state.object.currentMaterial()
        if (material) material.smooth = state.object.smooth

      } else {
        if (line === '\0') continue

        console.warn('THREE.OBJLoader: Unexpected line: "' + line + '"')
      }
    }

    state.finalize()

    const container = new Group()
    container['materialLibraries'] = [].concat(state.materialLibraries)

    const hasPrimitives = !(state.objects.length === 1 && state.objects[0].geometry.vertices.length === 0)

    if (hasPrimitives === true) {
      for (let i = 0, l = state.objects.length; i < l; i++) {
        const object = state.objects[i]
        const geometry = object.geometry
        const materials = object.materials
        const isLine = (geometry.type === 'Line')
        const isPoints = (geometry.type === 'Points')
        let hasVertexColors = false

        if (geometry.vertices.length === 0) continue

        const buffergeometry = new BufferGeometry()

        buffergeometry.setAttribute('position', new Float32BufferAttribute(geometry.vertices, 3))

        if (geometry.normals.length > 0) {
          buffergeometry.setAttribute('normal', new Float32BufferAttribute(geometry.normals, 3))
        }

        if (geometry.colors.length > 0) {
          hasVertexColors = true
          buffergeometry.setAttribute('color', new Float32BufferAttribute(geometry.colors, 3))
        }

        if (geometry.hasUVIndices === true) {
          buffergeometry.setAttribute('uv', new Float32BufferAttribute(geometry.uvs, 2))
        }

        const createdMaterials = []

        for (let mi = 0, miLen = materials.length; mi < miLen; mi++) {
          const sourceMaterial = materials[mi]
          const materialHash = sourceMaterial.name + '_' + sourceMaterial.smooth + '_' + hasVertexColors
          let material = state.materials[materialHash]

          if (this.materials !== null) {
            material = this.materials.create(sourceMaterial.name)

            if (isLine && material && !(material instanceof LineBasicMaterial)) {
              const materialLine = new LineBasicMaterial()
              Material.prototype.copy.call(materialLine, material)
              materialLine.color.copy(material.color)
              material = materialLine
            } else if (isPoints && material && !(material instanceof PointsMaterial)) {
              const materialPoints = new PointsMaterial({ size: 10, sizeAttenuation: false })
              Material.prototype.copy.call(materialPoints, material)
              materialPoints.color.copy(material.color)
              materialPoints.map = material.map
              material = materialPoints
            }
          }

          if (material === undefined) {
            if (isLine) {
              material = new LineBasicMaterial()
            } else if (isPoints) {
              material = new PointsMaterial({ size: 1, sizeAttenuation: false })
            } else {
              material = new MeshPhongMaterial()
            }

            material.name = sourceMaterial.name
            material.flatShading = sourceMaterial.smooth ? false : true
            material.vertexColors = hasVertexColors

            state.materials[materialHash] = material
          }

          createdMaterials.push(material)
        }

        let mesh: Object3D

        if (createdMaterials.length > 1) {
          for (let mi = 0, miLen = materials.length; mi < miLen; mi++) {
            const sourceMaterial = materials[mi]
            buffergeometry.addGroup(sourceMaterial.groupStart, sourceMaterial.groupCount, mi)
          }

          if (isLine) {
            mesh = new LineSegments(buffergeometry, createdMaterials)
          } else if (isPoints) {
            mesh = new Points(buffergeometry, createdMaterials)
          } else {
            mesh = new Mesh(buffergeometry, createdMaterials)
          }
        } else {
          if (isLine) {
            mesh = new LineSegments(buffergeometry, createdMaterials[0])
          } else if (isPoints) {
            mesh = new Points(buffergeometry, createdMaterials[0])
          } else {
            mesh = new Mesh(buffergeometry, createdMaterials[0])
          }
        }

        mesh.name = object.name
        container.add(mesh)
      }
    } else {
      if (state.vertices.length > 0) {
        const material = new PointsMaterial({ size: 1, sizeAttenuation: false })
        const buffergeometry = new BufferGeometry()

        buffergeometry.setAttribute('position', new Float32BufferAttribute(state.vertices, 3))

        if (state.colors.length > 0 && state.colors[0] !== undefined) {
          buffergeometry.setAttribute('color', new Float32BufferAttribute(state.colors, 3))
          material.vertexColors = true
        }

        const points = new Points(buffergeometry, material)
        container.add(points)
      }
    }

    return container
  }
}

// import * as fs from 'fs'


// const getFile = file => new Promise((resolve, reject) => fs.readFile(file, 
//   (err, data) => err ? reject(err) : resolve(data.toString())))
// const existsFile = file => new Promise(resolve => resolve(fs.existsSync(file)))

// async function getMaterial(path: string): Promise<string> {
//   const mtlFile = await getFile(path)

//   return `
//     const materialSource = ${JSON.stringify(mtlFile)}
//     const materialLibrary = new MaterialLibrary(materialSource)
//     mesh.addMaterialLibrary(materialLibrary)
//   `
// }

export default function(source: string): void {
  this.cacheable()
  this.async()

  const run = async () => {
    let additional = ''

    // const mtlPath = this.resourcePath.replace(/\.obj$/, '.mtl')
    // console.log(mtlPath)

    // if (await existsFile(mtlPath)) additional += await getMaterial(mtlPath)

    this.callback(null, `
  import { OBJLoader } from 'lib/OBJLoader.ts'
  const loader = new OBJLoader()
  const source = ${JSON.stringify(source)}
  const mesh = loader.fromText(source)
  ${additional}
  export default mesh;`)
  }

  run().catch((err) => {
    throw err
  })
}