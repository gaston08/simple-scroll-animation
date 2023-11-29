import * as THREE from 'three';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const draco = new DRACOLoader();
draco.setDecoderPath('draco/gltf/');
draco.setDecoderConfig({ type: 'js' });

let current = -6;
let total = current;
let tween;

window.addEventListener("wheel", (event) => {
  if (tween) {
    tween.stop();
  }
  total += event.deltaY / 1000;

  let time = total > current ? total - current : current - total;
  time = time * 10000;

  if (time > 700) time = 1000;

  tween = new TWEEN.Tween({ val: current })
    .to({ val: total }, time)
    .onUpdate(val => {
      current = val.val;
    });
  tween.start();
});

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, -1.5, 3).setLength(3);
camera.lookAt(scene.position)
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.domElement.id = 'app';
document.body.appendChild(renderer.domElement);

let light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

let instStart = [];
let instFinish = [];
let instancedMesh;

let instBox = [];
let instSphere = [];
let instTorusKnot = [];
let instMan = [];
let instChainsaw = [];

let samplerSphere = new MeshSurfaceSampler(new THREE.Mesh(new THREE.SphereGeometry(0.1))).build();
let samplerBox = new MeshSurfaceSampler(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))).build();
let samplerTorusKnot = new MeshSurfaceSampler(new THREE.Mesh(new THREE.TorusKnotGeometry(0.5, 0.2))).build();

let MAX_COUNT = 10000;
instancedMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.01, 0.01, 0.01),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
  }), MAX_COUNT);

let v = new THREE.Vector3();
let d = new THREE.Object3D();
const instObj = new Array(MAX_COUNT).fill(new THREE.Object3D());

for (let idx = 0; idx < MAX_COUNT; idx++) {
  samplerBox.sample(v);
  instBox.push(v.clone());

  samplerSphere.sample(v);
  instSphere.push(v.clone());

  samplerTorusKnot.sample(v);
  instTorusKnot.push(v.clone());

  // default
  d.position.copy(v.clone());
  d.updateMatrix();
  instancedMesh.setMatrixAt(idx, d.matrix);
};

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('man.glb', function (gltf) {
  const model = gltf.scene.children[0];
  model.matrix.makeScale(10, 10, 10);
  model.geometry.applyMatrix4(model.matrix);

  model.matrix.makeTranslation(0, -0.5, 0);
  model.geometry.applyMatrix4(model.matrix);

  const sampler = new MeshSurfaceSampler(model).build();
  const tempPosition = new THREE.Vector3();

  for (let i = 0; i < MAX_COUNT; i++) {
    sampler.sample(tempPosition);
    instMan.push({
      x: tempPosition.x,
      y: tempPosition.y,
      z: tempPosition.z
    });
  }
});

function getMeshWithGeometryFromModel(model) {
  if (model.geometry) {
    return model.children[0];
  } else {
    const geometries = [];
    model.traverse(function (child) {
      if (child.isMesh) {
        geometries.push(child.geometry);
      }
    });
    const geometry = BufferGeometryUtils.mergeGeometries(geometries);

    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }
}

loader.load('combination-wrench.glb', function (gltf) {
  const model = getMeshWithGeometryFromModel(gltf.scene);

  model.matrix.makeScale(0.3, 0.3, 0.3);
  model.geometry.applyMatrix4(model.matrix);

  model.matrix.makeTranslation(0, -0.5, 0);
  model.geometry.applyMatrix4(model.matrix);

  const sampler = new MeshSurfaceSampler(model).build();
  const tempPosition = new THREE.Vector3();

  for (let i = 0; i < MAX_COUNT; i++) {
    sampler.sample(tempPosition);
    instChainsaw.push({
      x: tempPosition.x,
      y: tempPosition.y,
      z: tempPosition.z
    });
  }
},
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened');
    console.log(error)
  });

instStart = instSphere;
instFinish = instTorusKnot;
scene.add(instancedMesh);

renderer.setAnimationLoop(() => {
  instObj.forEach((o, idx) => {
    o.position.lerpVectors(instStart[idx], instFinish[idx], current);
    o.updateMatrix();
    instancedMesh.setMatrixAt(idx, o.matrix);
  })
  instancedMesh.instanceMatrix.needsUpdate = true;
  TWEEN.update();
  if (instancedMesh) instancedMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
})

