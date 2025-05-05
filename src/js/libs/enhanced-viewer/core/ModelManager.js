import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * manages 3D model loading and optimization
 */
export class ModelManager {
  /**
   * creates a new model manager
   * @param {THREE.Scene} scene - scene to add the model to
   * @param {Object} [options] - configuration options
   * @param {Array<number>} [options.initialRotation] - initial rotation [x,y,z] in radians
   * @param {boolean} [options.enableLOD=true] - enable level of detail(LOD) optimization
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      initialRotation: [0, 0, 0],
      enableLOD: true,
      ...options,
    };

    this.model = null;
    this.modelScaleFactor = 1;
    this.textureCache = new Map();
    this.materialCache = new Map();

    this.gltfLoader = new GLTFLoader();

    // setup draco decoder for compressed models
    if (this.options.enableLOD) {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.5.5/",
      );
      this.gltfLoader.setDRACOLoader(dracoLoader);

      this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
  }

  /**
   * load 3D model
   * @param {string} modelPath - path to the model file
   * @param {Object} [callbacks] - callback functions
   * @param {Function} [callbacks.onProgress] - progress callback
   * @param {Function} [callbacks.onLoad] - load complete callback
   * @param {Function} [callbacks.onError] - error callback
   * @returns {Promise<THREE.Object3D>} promise resolving to the loaded model
   */
  loadModel(modelPath, callbacks = {}) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        modelPath,
        // onLoad
        (gltf) => {
          this.model = gltf.scene;

          this._optimizeModel();

          this._applyInitialRotation();

          this._centerAndScaleModel();

          this.scene.add(this.model);

          if (callbacks.onLoad) callbacks.onLoad(this.model);
          resolve(this.model);
        },
        // onProgress
        (progress) => {
          const progressPercent = Math.round(
            (progress.loaded / progress.total) * 100,
          );
          if (callbacks.onProgress) callbacks.onProgress(progressPercent);
        },
        // onError
        (error) => {
          if (callbacks.onError) callbacks.onError(error);
          reject(error);
        },
      );
    });
  }

  /**
   * applies optimizations to the model
   * @private
   */
  _optimizeModel() {
    if (!this.model) return;

    this.model.traverse((node) => {
      // skip no-mesh objects
      if (!node.isMesh) return;

      // optimize geometry
      if (node.geometry) {
        if (!node.geometry.index && node.geometry.attributes.position) {
          node.geometry = BufferGeometryUtils.mergeVertices(node.geometry);
        }

        if (!node.geometry.attributes.normal) {
          node.geometry.computeVertexNormals();
        }
      }

      // optimize materials
      if (node.material) {
        this._optimizeMaterial(node);
      }

      node.frustumCulled = true;
    });
  }

  /**
   * optimize material
   * @private
   * @param {THREE.Mesh} mesh - mesh to optimize;
   */
  _optimizeMaterial(mesh) {
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mat) =>
        this._getOptimizedMaterial(mat),
      );
    } else {
      mesh.material = this._getOptimizedMaterial(mesh.material);
    }
  }

  /**
   * gets an optimized version of a material
   * @private
   * @param {THREE.Material} material - material to optimize
   * @returns {THREE.Material} optimized material
   */
  _getOptimizedMaterial(material) {
    const materialKey = material.uuid;

    if (this.materialCache.has(materialKey)) {
      return this.materialCache.get(materialKey);
    }

    // optimize textures
    if (material.map) {
      material.map = this._getOptimizedTexture(material.map);
    }

    if (material.normalMap) {
      material.normalMap = this._getOptimizedTexture(material.normalMap);
    }

    if (material.roughnessMap) {
      material.roughnessMap = this._getOptimizedTexture(material.roughnessMap);
    }

    if (material.metalnessMap) {
      material.metalnessMap = this._getOptimizedTexture(material.metalnessMap);
    }

    if (material.aoMap) {
      material.aoMap = this._getOptimizedTexture(material.aoMap);
    }

    if (material.emissiveMap) {
      material.emissiveMap = this._getOptimizedTexture(material.emissiveMap);
    }

    // cache optimized material
    this.materialCache.set(materialKey, material);

    return material;
  }

  /**
   * gets an optimized version of texture, reusing caching instances
   * @private
   * @param {THREE.Texture} texture - texture to optimize
   * @returns {THREE.Texture} optimized texture
   */
  _getOptimizedTexture(texture) {
    const textureKey = texture.uuid;

    if (this.textureCache.has(textureKey)) {
      return this.textureCache.get(textureKey);
    }

    // texture optimization
    texture.generateMipmaps = true;
    texture.anisotropy = 4;

    this.textureCache.set(textureKey, texture);

    return texture;
  }

  /**
   * Applies initial rotation to the model
   * @private
   */
  _applyInitialRotation() {
    if (!this.model) return;

    const [x, y, z] = this.options.initialRotation;
    const euler = new THREE.Euler(x, y, z, "XYZ");
    this.model.quaternion.setFromEuler(euler);
    this.model.updateMatrixWorld(true);
  }

  /**
   * Centers and scales the model to fit the view
   * @private
   */
  _centerAndScaleModel() {
    if (!this.model) return;

    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxSize = Math.max(size.x, size.y, size.z);
    const scale = maxSize > 0 ? 2 / maxSize : 1;
    this.modelScaleFactor = scale;

    this.model.scale.set(scale, scale, scale);

    box.setFromObject(this.model);
    box.getCenter(center);

    this.model.position.sub(center);
  }

  /**
   * set the rotation of the model
   * @param {Array<number>} rotation - rotation as [x,y,z] in radians
   */
  setRotation(rotation) {
    if (!this.model || !Array.isArray(rotation) || rotation.length !== 3)
      return;

    const [x, y, z] = rotation;
    this.model.rotation.set(x, y, z);
    this.model.updateMatrixWorld(true);
  }

  /**
   * Sets the color of all materials in the model.
   * @param {string | number | THREE.Color} colorValue - The color to set ('#ff0000', 0xff0000, or new THREE.Color(1, 0, 0))
   * @param {string | string[]} [excludeNames=[]] - mesh name or array of mesh manes to exclude from color change. Case-sensitive
   */
  setModelColor(colorValue, excludeNames) {
    if (!this.model) {
      console.warn("Model not loaded yet.");
      return;
    }

    const newColor = new THREE.Color(colorValue);

    const exclusionList = Array.isArray(excludeNames)
      ? excludeNames
      : [excludeNames];

    this.model.traverse((node) => {
      if (node.isMesh && exclusionList.includes(node.name)) {
        // console.log('skipping color changing for:', node.name)
        return;
      }

      if (node.isMesh && node.material) {
        const processMaterial = (material) => {
          if (material.color && material.color instanceof THREE.Color) {
            material.color.set(newColor);
          } else {
            // console.log(`Material type ${material.type} on mesh ${node.name || node.uuid} does not have a standard .color property.`);
          }
        };

        if (Array.isArray(node.material)) {
          node.material.forEach(processMaterial);
        } else {
          processMaterial(node.material);
        }
      }
    });
  }

  /**
   * disposes model resources
   */
  dispose() {
    if (this.model) {
      this.scene.remove(this.model);

      this.model.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              this._disposeMaterialTextures(object.material);
              material.dispose();
            });
          } else {
            this._disposeMaterialTextures(object.material);
            object.material.dispose();
          }
        }
      });
    }

    // clear cache
    this.textureCache.clear();
    this.materialCache.clear();

    this.model = null;
  }

  /**
   * disposes textures used by a material
   * @private
   * @param {THREE.Material} material - material that contains textures
   */
  _disposeMaterialTextures(material) {
    const textures = [
      "map",
      "normalMap",
      "roughnessMap",
      "metalnessMap",
      "aoMap",
      "emissiveMap",
      "bumpMap",
      "displacementMap",
      "envMap",
      "lightMap",
      "alphaMap",
    ];

    textures.forEach((textureName) => {
      if (material[textureName]) {
        material[textureName].dispose();
      }
    });
  }
}
