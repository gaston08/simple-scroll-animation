import * as THREE from 'three';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const draco = new DRACOLoader();
draco.setDecoderPath('draco/gltf/');
draco.setDecoderConfig({ type: 'js' });

let current = 0;
let total = current;
let tween, tweenP;

let showTitle = 10000;
let moveSphere = 9000;

let currentP = 0;

window.addEventListener("scroll", (e) => {
  
  let scrollPosition = document.documentElement.scrollTop;
  
  if (tween) {
    tween.stop();
  }
  let total = (((scrollPosition - 0) * (1 - 0)) / (10000 - 0)) + 0;

  
  let rationP = (((scrollPosition - moveSphere) * (1 - 0)) / (showTitle - moveSphere)) + 0;
  if (rationP >= 0 && rationP <= 1) {
    if (tweenP) {
      tweenP.stop();
    }

    let timeP = rationP > currentP ? rationP - currentP : currentP - rationP;

    tweenP = new TWEEN.Tween({ val: currentP })
    .to ({ val: rationP }, timeP)
    .onUpdate(val => {
      currentP = val.val
    })
    .onComplete((val) => {
      console.log(val.val)
      if (current >= 1) {

      }
    })
    tweenP.start();
  } else {
    if (tweenP) {
      tweenP.stop();
    }
  }

  if (total >= 0 && total <= 1) {
    if (total >= 0.9) {
      console.log("HERE")
      console.log(total)
      total = 1;
    }
    let time = total > current ? total - current : current - total;
    time = time * 10000;
  
    if (time > 700) time = 1000;
  
    tween = new TWEEN.Tween({ val: current })
      .to({ val: total }, time)
      .onUpdate(val => {
        current = val.val;
      });
    tween.start();
  } else {
    if (tween) tween.stop();
  }

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

let instSphereBig = [];
let instSphereSmall = [];
let instMan = [];
let instChainsaw = [];

let samplerSphereBig = new MeshSurfaceSampler(new THREE.Mesh(new THREE.SphereGeometry(4))).build();
let samplerSphereSmall = new MeshSurfaceSampler(new THREE.Mesh(new THREE.SphereGeometry(0.1))).build();

let MAX_COUNT = 5000;
instancedMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.01, 0.01, 0.01),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
  }), MAX_COUNT);

let v = new THREE.Vector3();
let d = new THREE.Object3D();
const instObj = new Array(MAX_COUNT).fill(new THREE.Object3D());

for (let idx = 0; idx < MAX_COUNT; idx++) {
  samplerSphereSmall.sample(v);
  instSphereSmall.push(v.clone());
  
  samplerSphereBig.sample(v);
  instSphereBig.push(v.clone());

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

instStart = instSphereBig;
instFinish = instSphereSmall;
scene.add(instancedMesh);

let initialPosition = new THREE.Vector3(0.8, -0.5, 0.8);
let finalPosition = new THREE.Vector3(2, 0, 0);

renderer.setAnimationLoop(() => {
  instObj.forEach((o, idx) => {
    o.position.lerpVectors(instStart[idx], instFinish[idx], current);
    o.updateMatrix();
    instancedMesh.setMatrixAt(idx, o.matrix);
  })
  instancedMesh.position.lerpVectors(initialPosition, finalPosition, currentP);
  instancedMesh.instanceMatrix.needsUpdate = true;
  TWEEN.update();
  if (instancedMesh) instancedMesh.instanceMatrix.needsUpdate = true;
  renderer.render(scene, camera);
})

