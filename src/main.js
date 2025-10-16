import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { cm1, cm2 } from "./common";
import { Pillar } from "./Pillar";
import { Floor } from "./Floor";
import { Bar } from "./Bar";
import { SideLight } from "./SideLight";
import { Glass } from "./Glass";
import { Player } from "./Player";
import * as CANNON from "cannon-es";
import gsap from "gsap";

// ----- 주제: The Bridge 게임 만들기

// Renderer
const canvas = document.querySelector('#three-canvas');
const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = cm1.scene;
scene.background = new THREE.Color(cm2.backgroundColor);

// Camera
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.x = -4;
camera.position.y = 19;
camera.position.z = 14;
scene.add(camera);

// Light
const ambientLight = new THREE.AmbientLight(cm2.lightColor, 0.9);
scene.add(ambientLight);

const spotLightDistance = 50;
const spotLight1 = new THREE.SpotLight(cm2.lightColor, 40000);
spotLight1.castShadow = true;
spotLight1.shadow.mapSize.width = 2048;
spotLight1.shadow.mapSize.height = 2048;
const spotLight2 = spotLight1.clone();
const spotLight3 = spotLight1.clone();
const spotLight4 = spotLight1.clone();

spotLight1.position.set(-spotLightDistance, spotLightDistance, spotLightDistance);
spotLight2.position.set(spotLightDistance, spotLightDistance, spotLightDistance);
spotLight3.position.set(-spotLightDistance, spotLightDistance, -spotLightDistance);
spotLight4.position.set(spotLightDistance, spotLightDistance, -spotLightDistance);
scene.add(spotLight1, spotLight2, spotLight3, spotLight4);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;


// Mesh

// 물리 엔진
cm1.world.gravity.set(0, -10, 0);

const defaultContactMaterial = new CANNON.ContactMaterial(
  cm1.glassMaterial,
  cm1.defaultMaterial,
  {
    friction: 0.3,
    restitution: 0.2
  }
);

const glassDefaultContactMaterial = new CANNON.ContactMaterial(
  cm1.glassMaterial,
  cm1.playerMaterial,
  {
    friction: 1,
    restitution: 0
  }
);
const PlayerGlassContactMaterial = new CANNON.ContactMaterial(
  cm1.defaultMaterial,
  cm1.defaultMaterial,
  {
    friction: 1,
    restitution: 0
  }
);

cm1.world.defaultContactMaterial = defaultContactMaterial;
cm1.world.addContactMaterial(glassDefaultContactMaterial);
cm1.world.addContactMaterial(PlayerGlassContactMaterial);


// 물체 만들기
const glassUnitSize = 1.2;
const numberOfGlass = 10;
const objects = [];

// 바닥
const floor = new Floor({
  name: 'floor',
})

// 기둥
const pillar1 = new Pillar({
  name: 'pillar',
  x: 0,
  y: 5.5,
  z: -glassUnitSize * 12 - glassUnitSize / 2,
});

const pillar2 = new Pillar({
  name: 'pillar',
  x: 0,
  y: 5.5,
  z: glassUnitSize * 12 + glassUnitSize / 2,
});

objects.push(pillar1, pillar2);

// 바
const bar1 = new Bar({ name: 'bar1', x: -1.6, y: 10.3, z: 0 });
const bar2 = new Bar({ name: 'bar2', x: -0.4, y: 10.3, z: 0 });
const bar3 = new Bar({ name: 'bar3', x: 0.4, y: 10.3, z: 0 });
const bar4 = new Bar({ name: 'bar4', x: 1.6, y: 10.3, z: 0 });

// 사이드 라이트
for (let i = 0; i < 49; i++) {
  new SideLight({
    name: 'sideLight',
    container: bar1.mesh,
    z: i * 0.5 - glassUnitSize * 10,})
}
for (let i = 0; i < 49; i++) {
  new SideLight({
    name: 'sideLight',
    container: bar4.mesh,
    z: i * 0.5 - glassUnitSize * 10
  });
}

// 유리판
let glassTypeNumber = 0;
let glassTypes = [];
const glassZ = [];

for (let i = 0; i < numberOfGlass; i++){
  glassZ.push(-(i * glassUnitSize * 2 - glassUnitSize * 9));
}

for (let i = 0; i < numberOfGlass; i++) {
  glassTypeNumber = Math.round(Math.random());
  switch (glassTypeNumber) {
    case 0:
      glassTypes = ['normal', 'strong'];
      break;
    case 1:
      glassTypes = ['strong', 'normal'];
      break;
  }

  const glass1 = new Glass({
    step: i + 1,
    name: `glass-${glassTypes[0]}`,
    x: -1,
    y: 10.5,
    z: glassZ[i],
    type: glassTypes[0],
    cannonMaterial: cm1.glassMaterial,
  });
  const glass2 = new Glass({
    step: i + 1,
    name: `glass-${glassTypes[1]}`,
    x: 1,
    y: 10.5,
    z: glassZ[i],
    type: glassTypes[1],
    cannonMaterial: cm1.glassMaterial,
  });

  objects.push(glass1, glass2);
}

// 플레이어
const player = new Player({
  name: 'player',
  x: 0,
  y: 10.9,
  z: 13,
  rotationY: Math.PI,
  cannonMaterial: cm1.playerMaterial,
  mass: 30
});
objects.push(player);

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function checkIntersects(){
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children)
  for (const item of intersects) {
    checkClickedObject(item.object);
    break;
  }
};

let fail = false;
let jumping = false;
function checkClickedObject(mesh){
  console.log(mesh)
  if (mesh.name.indexOf('glass') >= 0) {
    // 유리판을 클릭했을 때
    if(jumping || fail) return;

    if (mesh.step - 1 === cm2.step) {
      player.actions[2].stop();
      player.actions[2].play();
      jumping = true;
      cm2.step++;

      switch (mesh.type) {
        case 'normal':
          console.log('normal');
          setTimeout(() => {
            player.actions[0].stop();
            player.actions[1].play();
            fail = true;
          }, 700);
          break;
        case 'strong':
          console.log('strong');
          break;
      }

      setTimeout(() => {
        jumping = false;
      }, 1000);
      gsap.to(
        player.cannonBody.position,
        {
          duration: 1,
          x: mesh.position.x,
          z: glassZ[cm2.step - 1]
        }
      )
      gsap.to(
        player.cannonBody.position,
        {
          duration: 0.4,
          y: 12
        }
      )
    }
  }
}

// 그리기
const clock = new THREE.Clock();

function draw() {
	const delta = clock.getDelta();

  if (cm1.mixer) cm1.mixer.update(delta);

  cm1.world.step(1/60, delta, 3);
  objects.forEach(object => {
    if (object.cannonBody) {
      if (object.name === 'player') {
        object.mesh.position.copy(object.cannonBody.position);
        if (fail) object.mesh.quaternion.copy(object.cannonBody.quaternion);

        if (object.modelMesh) {
          object.modelMesh.position.copy(object.cannonBody.position);
          if (fail) object.modelMesh.quaternion.copy(object.cannonBody.quaternion);
        }
        object.modelMesh.position.y += 0.15;
      } else {
        object.mesh.position.copy(object.cannonBody.position);
        object.mesh.quaternion.copy(object.cannonBody.quaternion);

        if (object.modelMesh) {
          object.modelMesh.position.copy(object.cannonBody.position);
          object.modelMesh.quaternion.copy(object.cannonBody.quaternion);
        }
      }

    }
  })

	controls.update();

	renderer.render(scene, camera);
	window.requestAnimationFrame(draw);
}

function setSize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);
}

// 이벤트
window.addEventListener('resize', setSize);
canvas.addEventListener('click', e => {
  mouse.x = e.clientX / canvas.clientWidth * 2 - 1;
  mouse.y = -(e.clientY / canvas.clientHeight * 2 - 1);
  checkIntersects();
});

draw();

