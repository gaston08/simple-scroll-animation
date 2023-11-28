import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const draco = new DRACOLoader();
draco.setDecoderPath('draco/gltf/');
draco.setDecoderConfig({ type: 'js' });

let buttonsCtn = document.getElementById('buttons');
for (let i = 0; i < buttonsCtn.children.length; i++) {
  buttonsCtn.children[i].addEventListener('click', changeGeometry);
}

function changeGeometry(e) {
  let newGeometry = e.srcElement.getAttribute('data-geometry');

  switch (newGeometry) {
    case 'box':
      instStart = instFinish;
      instFinish = instBox;
      tween.start();
      break;
    case 'sphere':
      instStart = instFinish;
      instFinish = instSphere;
      tween.start();
      break;
    case 'torusknot':
      instStart = instFinish;
      instFinish = instTorusKnot;
      tween.start();
      break;
    case 'man':
      instStart = instFinish;
      instFinish = instMan;
      tween.start();
      break;
    case 'chainsaw':
      instStart = instFinish;
      instFinish = instChainsaw;
      tween.start();
      break;
    default:
      console.log('default');
      break;
  }
}

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, -1.5, 3).setLength(3);
camera.lookAt(scene.position)
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// let controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;

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

let samplerSphere = new MeshSurfaceSampler(new THREE.Mesh(new THREE.SphereGeometry(1))).build();
let samplerBox = new MeshSurfaceSampler(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))).build();
let samplerTorusKnot = new MeshSurfaceSampler(new THREE.Mesh(new THREE.TorusKnotGeometry(0.5, 0.2))).build();

let MAX_COUNT = 30000;
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
  console.log("1")
  console.log(model)
  if (model.geometry) {
    console.log("2")
    return model.children[0];
  } else {
    const geometries = [];
    model.traverse(function(child) {
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

instStart = instTorusKnot;
instFinish = instTorusKnot;
scene.add(instancedMesh);

let tween = new TWEEN.Tween({ val: 0 }).to({ val: 1 }, 1300)
  .onUpdate(val => {
    instObj.forEach((o, idx) => {
      o.position.lerpVectors(instStart[idx], instFinish[idx], val.val);
      o.updateMatrix();
      instancedMesh.setMatrixAt(idx, o.matrix);
    })
    instancedMesh.instanceMatrix.needsUpdate = true;
  });

renderer.setAnimationLoop(() => {
  // controls.update();
  TWEEN.update();
  if (instancedMesh) instancedMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
})

