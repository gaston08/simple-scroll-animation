import * as THREE from 'three';
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import * as TWEEN from '@tweenjs/tween.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { stats } from './ui';

let current = 0, total = 0, toFollow = 0;
let tween;
let scrollPosition = 0;

let scrollHeight = document.documentElement.scrollHeight;

const positions = [
  {
    start: 0,
    end: 4000,
    from: new THREE.Vector3(0, 0, 0),
    to: new THREE.Vector3(1, 0, 0)
  },
  {
    start: 4000,
    end: 7000,
    from: new THREE.Vector3(1, 0, 0),
    to: new THREE.Vector3(-1, 0, 0)
  },
  {
    start: 7000,
    end: 12000,
    from: new THREE.Vector3(-1, 0, 0),
    to: new THREE.Vector3(-1, 0, 1),
  }
];

let pStart = new THREE.Vector3(0, 0, 0);
let pEnd = new THREE.Vector3(0, 0, 0);
let lastPosition = 0;

function setParams(p) {
  for (let i = 0; i < positions.length; i++) {
    if (p >= positions[i].start && p < positions[i].end) {
      if (lastPosition < i) {
        console.log(toFollow, current)
        console.log(toFollow-current)
        current = 0;
        lastPosition = i;
      } else if (lastPosition > i) {
        current = 1;
        lastPosition = i;
      }

      pStart = positions[i].from;
      pEnd = positions[i].to;
      // toFollow = 1;
      toFollow = (((scrollPosition - positions[i].start) * (1 - 0)) / (positions[i].end - positions[i].start));
    }
  }
}

window.addEventListener("scrollend", (e) => {

  scrollPosition = document.documentElement.scrollTop;

  if (tween) {
    tween.stop();
  }

  setParams(scrollPosition);

  let time = toFollow > current ? toFollow - current : current - toFollow;
  time = time * 10000;


  if (time > 700) time = 1000;

  tween = new TWEEN.Tween({ val: current })
    .to({ val: toFollow }, time)
    .onUpdate(val => {
      current = val.val;
    });
  tween.start();

});

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2, 0);
camera.lookAt(scene.position)
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.domElement.id = 'app';
document.body.appendChild(renderer.domElement);
window.scrollTo(0, 0);
const size = 5;
const divisions = 10;
const gridHelper = new THREE.GridHelper(size, divisions);
scene.add(gridHelper);

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

instStart = instSphereBig;
instFinish = instSphereSmall;
// scene.add(instancedMesh);

let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
let material = new THREE.MeshStandardMaterial();
let mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, 0);
mesh.rotation.set(0, 0, 0);
mesh.updateMatrix();
scene.add(mesh);

let i = 0;

renderer.setAnimationLoop(() => {

  stats.begin();

  i += 1;
  if (i%3===0) {
    // console.log(current)
  }

  // if (total !== current) {
  //   instObj.forEach((o, idx) => {
  //     o.position.lerpVectors(instStart[idx], instFinish[idx], current);
  //     o.updateMatrix();
  //     instancedMesh.setMatrixAt(idx, o.matrix);
  //   });
  //   instancedMesh.instanceMatrix.needsUpdate = true;
  // }

  mesh.position.lerpVectors(pStart, pEnd, current);

  TWEEN.update();

  stats.end();
  renderer.render(scene, camera);
})

