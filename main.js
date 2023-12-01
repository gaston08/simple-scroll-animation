import * as THREE from 'three';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Stats from 'stats.js';
import GUI from 'lil-gui'; 

const gui = new GUI();
const params = {
  number: 0,
}

let stats = new Stats();
stats.showPanel(1);
document.body.appendChild(stats.dom);

const draco = new DRACOLoader();
draco.setDecoderPath('draco/gltf/');
draco.setDecoderConfig({ type: 'js' });

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

let total = 0;
let scrollPosition;

let currents = {
  first: 0,
  second: 0,
}

let totals = {
  first: 0,
  second: 0,
}

let tweens = {
  first: null,
  second: null,
}

let heights = {
  first: {
    start: 0,
    end: 10000
  },
  second: {
    start: 10000,
    end: 11000
  }
}

let initP = new THREE.Vector3(0, 0, 0);
let finishP = new THREE.Vector3(1.5, -0.35, 0);

const scrollHeight = window.document.documentElement.scrollHeight;
window.scroll(0, 0);

function getCurrentPhase(scrollPosition) {
  let phase;
  if (scrollPosition < heights.first.end) {
    phase = 'first';
  } else if (scrollPosition < heights.second.end) {
    phase = 'second';
  }
  return phase;
}

window.addEventListener("scroll", (e) => {
  
  scrollPosition = document.documentElement.scrollTop;
  total = scrollPosition / scrollHeight;

  let currentPhase = getCurrentPhase(scrollPosition);

  if (tweens[currentPhase]) {
    tweens[currentPhase].stop();
  }

  if (currentPhase === 'first') {
    totals.first = (scrollPosition - 0) * (1 - 0) / heights.first.end;
    if (tweens.second) {
      tweens.second.stop();
      totals.second = 0;
      playOnPhase('second', 200);
    }
  } else {
    if (currents.first !== 1) {
      tweens.first.stop();
      totals.first = 1;
      playOnPhase("first", 200);
    }
    if (currentPhase === 'second') {
      totals.second = (scrollPosition - heights.first.end) * (1 - 0) / (heights.second.end - heights.first.end);
    } else {
      tweens.second.stop();
      totals.second = 1;
      playOnPhase("second", 200);
    }
  }

  if (currentPhase) {
    playOnPhase(currentPhase);
  }
  
});

function playOnPhase(phase, t) {
  let time = t ? t : (total > currents[phase] ? totals[phase] - currents[phase] : currents[phase] - totals[phase]);
  time = time * 10000;
  // if (time > 700) time = 1000;

  tweens[phase] = new TWEEN.Tween({ val: currents[phase]})
  .to({ val: totals[phase]})
  .onUpdate(val => {
    currents[phase] = val.val;
  })
  tweens[phase].start();
}

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

let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
let material = new THREE.MeshStandardMaterial();
let mesh = new THREE.Mesh(geometry, material);
mesh.position.y = 0.8;
scene.add(mesh);

// gui.add(instancedMesh.position, 'x', 1, 2);
// gui.add(instancedMesh.position, 'y', -1, 0);
// gui.add(instancedMesh.position, 'z', -1, 0);

renderer.setAnimationLoop(() => {

  stats.begin();

  if (totals.first !== currents.first) {
    instObj.forEach((o, idx) => {
      o.position.lerpVectors(instStart[idx], instFinish[idx], currents.first);
      o.updateMatrix();
      instancedMesh.setMatrixAt(idx, o.matrix);
    });
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  if (totals.second !== currents.second) {
    instancedMesh.position.lerpVectors(initP, finishP, currents.second);
    instancedMesh.updateMatrix();
  }

  TWEEN.update();

  stats.end();
  renderer.render(scene, camera);
})

