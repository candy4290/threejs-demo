import { useEffect } from "react";
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { VoxelLandscape } from './VoxelLandscape.js'
import { PointerLockControlsCannon } from './PointerLockControlsCannon.js'
import './index.less';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: PointerLockControlsCannon;

let world: CANNON.World;
let voxels: VoxelLandscape;
let physicsMaterial: CANNON.Material;
let sphereBody: CANNON.Body;
let boxMeshes: any[] = [];
let material: THREE.MeshLambertMaterial;
const timeStep = 1 / 60
let lastCallTime = performance.now() / 1000

let instructions;

/**
 * 地形生成器+指针锁定控件
 *
 * @export
 * @return {*} 
 */
export default function Cannon3() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        instructions = document.querySelector('#instructions') as HTMLElement;
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        scene.add(camera);

        scene.add(new THREE.AxesHelper(40));

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
        scene.add(ambientLight)

        const spotlight = new THREE.SpotLight(0xffffff, 0.7, 0, Math.PI / 4, 1)
        spotlight.position.set(10, 30, 20)
        spotlight.target.position.set(0, 0, 0)

        spotlight.castShadow = true

        spotlight.shadow.camera.near = 20
        spotlight.shadow.camera.far = 50
        spotlight.shadow.camera.fov = 40

        spotlight.shadow.bias = -0.001
        spotlight.shadow.mapSize.width = 2048
        spotlight.shadow.mapSize.height = 2048

        scene.add(spotlight)

        material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

        const floorGeometry = new THREE.PlaneBufferGeometry(300, 300, 50, 50)
        floorGeometry.rotateX(-Math.PI / 2)
        const floor = new THREE.Mesh(floorGeometry, material)
        floor.receiveShadow = true
        scene.add(floor)

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        
        initCannon();
        initPointerLock();

        render();
    }

    function initPointerLock() {
        controls = new PointerLockControlsCannon(camera, sphereBody)
        scene.add(controls.getObject())
        instructions.addEventListener('click', () => {
            controls.lock()
        })

        controls['addEventListener']('lock', () => {
            controls.enabled = true
            instructions.style.display = 'none'
        })

        controls['addEventListener']('unlock', () => {
            controls.enabled = false
            instructions.style.display = 'flex'
        })
    }

    function initCannon() {
        world = new CANNON.World();
        world.defaultContactMaterial.contactEquationStiffness = 1e9
        world.defaultContactMaterial.contactEquationRelaxation = 4
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -20, 0);
        // world.broadphase = new CANNON.NaiveBroadphase(); /* NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高 */

        const solver = new CANNON.GSSolver()
        solver.iterations = 7
        solver.tolerance = 0.1
        world.solver = new CANNON.SplitSolver(solver)

        world.broadphase.useBoundingBoxes = true

        physicsMaterial = new CANNON.Material('physics'); /* Create a slippery material (friction coefficient = 0.0) */
        const physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0, restitution: 0.3 });//规定相同的physicsMaterial材质之间的发生接触时的物理参数。
        world.addContactMaterial(physicsContactMaterial); /*  We must add the contact materials to the world */


        let nx = 58, ny = 8, nz = 58, sx = 0.5, sy = 0.5, sz = 0.5;

        const radius = 1.3
        const sphereShape = new CANNON.Sphere(radius)
        sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial }) /* /使用球形刚体作为相机载体，让相机拥有质量属性 */
        sphereBody.addShape(sphereShape)
        sphereBody.position.set(nx * sx * 0.5, ny * sy + radius * 2, nz * sz * 0.5)
        sphereBody.linearDamping = 0.9
        world.addBody(sphereBody)

        const groundShape = new CANNON.Plane()
        const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
        groundBody.addShape(groundShape)
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        world.addBody(groundBody)

        voxels = new VoxelLandscape(world, nx, ny, nz, sx, sy, sz);

        for (let i = 0; i < nx; i++) {
            for (let j = 0; j < ny; j++) {
              for (let k = 0; k < nz; k++) {
                let filled = true
  
                // Insert map constructing logic here
                if (Math.sin(i * 0.1) * Math.sin(k * 0.1) < (j / ny) * 2 - 1) {
                  filled = false
                }
  
                voxels.setFilled(i, j, k, filled)
              }
            }
          }
        voxels.update();
        console.log(`${voxels.boxes.length} voxel physics bodies`)

        for(let i=0; i<voxels.boxes.length; i++){//创建地形相应的网格，该数据存储在voxels.boxes数组中
            const box = voxels.boxes[i]
            const voxelGeometry = new THREE.BoxBufferGeometry(voxels.sx * box.nx, voxels.sy * box.ny, voxels.sz * box.nz)
            const voxelMesh = new THREE.Mesh(voxelGeometry, material)
            voxelMesh.castShadow = true
            voxelMesh.receiveShadow = true
            boxMeshes.push(voxelMesh)
            scene.add(voxelMesh);
        }
    }

    function render() {
        requestAnimationFrame(render);
        const time = performance.now() / 1000
        const dt = time - lastCallTime
        lastCallTime = time

        if (controls.enabled) {
            world.step(timeStep, dt); 
            for (let i = 0; i < voxels.boxes.length; i++) {
                boxMeshes[i].position.copy(voxels.boxes[i].position)
                boxMeshes[i].quaternion.copy(voxels.boxes[i].quaternion)
            }
        }
        controls.update(dt);
        renderer.render(scene, camera);
    }
    return (
        <>
            <div id="instructions">
            <span>Click to play</span>
            <br />
            (W,A,S,D = Move, SPACE = Jump, MOUSE = Look, CLICK = Shoot)
            </div>
            <canvas id="three"></canvas>
        </>
    )
}