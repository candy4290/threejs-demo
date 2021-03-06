import { useEffect } from "react"
import * as THREE from "three";
import { Octree } from 'three/examples/jsm/math/Octree';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


export default function FpsGame() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        const clock = new THREE.Clock();
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x88ccff);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.rotation.order = 'YXZ';

        const ambientlight = new THREE.AmbientLight(0x6688cc);
        scene.add(ambientlight);

        const fillLight1 = new THREE.DirectionalLight(0xff9999, 0.5);
        fillLight1.position.set(- 1, 1, 2);
        scene.add(fillLight1);

        const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
        fillLight2.position.set(0, - 1, 0);
        scene.add(fillLight2);

        const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
        directionalLight.position.set(- 5, 25, - 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.left = - 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = - 30;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.radius = 4;
        directionalLight.shadow.bias = - 0.00006;
        scene.add(directionalLight);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;

        const axisHelper = new THREE.AxesHelper(100);
        scene.add(axisHelper);

        const GRAVITY = 30;

        const STEPS_PER_FRAME = 5;


        const worldOctree = new Octree();

        const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

        const playerVelocity = new THREE.Vector3();
        const playerDirection = new THREE.Vector3();

        let playerOnFloor = false;

        const keyStates = {};

        document.addEventListener('keydown', (event) => {

            keyStates[event.code] = true;

        });

        document.addEventListener('keyup', (event) => {

            keyStates[event.code] = false;

        });

        document.addEventListener('mousedown', () => {

            document.body.requestPointerLock();

        });

        document.body.addEventListener('mousemove', (event) => {

            if (document.pointerLockElement === document.body) {

                camera.rotation.y -= event.movementX / 500;
                camera.rotation.x -= event.movementY / 500;

            }

        });

        window.addEventListener('resize', onWindowResize);

        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);

        }

        function playerCollitions() {

            const result = worldOctree.capsuleIntersect(playerCollider);

            playerOnFloor = false;

            if (result) {

                playerOnFloor = result.normal.y > 0;

                if (!playerOnFloor) {

                    playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));

                }

                playerCollider.translate(result.normal.multiplyScalar(result.depth));

            }

        }

        function updatePlayer(deltaTime) {

            if (playerOnFloor) {

                const damping = Math.exp(- 3 * deltaTime) - 1;
                playerVelocity.addScaledVector(playerVelocity, damping);

            } else {

                playerVelocity.y -= GRAVITY * deltaTime;

            }

            const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
            playerCollider.translate(deltaPosition);

            playerCollitions();

            camera.position.copy(playerCollider.end);

        }

        function getForwardVector() {

            camera.getWorldDirection(playerDirection);
            playerDirection.y = 0;
            playerDirection.normalize();

            return playerDirection;

        }

        function getSideVector() {

            camera.getWorldDirection(playerDirection);
            playerDirection.y = 0;
            playerDirection.normalize();
            playerDirection.cross(camera.up);

            return playerDirection;

        }

        function controls(deltaTime) {
            const speed = 25;
            if (playerOnFloor) {
                if (keyStates['KeyW']) {
                    playerVelocity.add(getForwardVector().multiplyScalar(speed * deltaTime));
                }

                if (keyStates['KeyS']) {
                    playerVelocity.add(getForwardVector().multiplyScalar(- speed * deltaTime));
                }

                if (keyStates['KeyA']) {
                    playerVelocity.add(getSideVector().multiplyScalar(- speed * deltaTime));
                }

                if (keyStates['KeyD']) {
                    playerVelocity.add(getSideVector().multiplyScalar(speed * deltaTime));
                }

                if (keyStates['Space']) {
                    playerVelocity.y = 15;
                }
            }
        }

        const loader = new GLTFLoader().setPath('./models/gltf/');

        loader.load('collision-world.glb', (gltf) => {
            scene.add(gltf.scene);
            worldOctree.fromGraphNode(gltf.scene); /* ????????????????????????????????????????????????????????????????????? */
            gltf.scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material.map) {
                        child.material.map.anisotropy = 8;
                    }
                }
            });

            animate();

        });

        function animate() {
            const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;
            // we look for collisions in substeps to mitigate the risk of
            // an object traversing another too quickly for detection.
            for (let i = 0; i < STEPS_PER_FRAME; i++) {
                controls(deltaTime);
                updatePlayer(deltaTime);
            }
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

    }

    return (
        <canvas id="three"></canvas>
    )
}