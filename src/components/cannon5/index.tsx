import { useEffect } from "react";
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock = new THREE.Clock();
let carModel;

let carBodySize = new THREE.Vector3(4.52, 2.26, 1.08);
let wheelRadius = 0.5
let world: CANNON.World;
let vehicle: CANNON.RaycastVehicle;
let groundMesh: THREE.Mesh;
let chassisBody: CANNON.Body;
const timeStep = 1 / 60
let lastCallTime = performance.now() / 1000

const particleMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
const triggerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })

export default function Cannon5() {

    useEffect(() => {
        console.log(CANNON)
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight('0xffffff'));
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(20, 20, 20);
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(50, 50, 50);
        scene.add(light);
        scene.add(new THREE.AxesHelper(50)) /*  辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        controls = new MapControls(camera, renderer.domElement);

        // const size = 100;
        // const groundGeom = new ParametricGeometry((u, v, target) => {
        //     const height = Math.cos(u * Math.PI * 8) * Math.cos(v * Math.PI * 8);//这里的方法和生成高度场的方法是一样
        //     target.set(u * size - size / 2, height, v * size - size / 2);
        // }, size, size)
        // let groundMate = new THREE.MeshPhongMaterial({ color: 0x666666, side: THREE.DoubleSide });
        // groundMesh = new THREE.Mesh(groundGeom, groundMate);
        // scene.add(groundMesh);


        initCannon2();
        // initCar();

        render();
    }

    function initCannon() {
        world = new CANNON.World();
        world.defaultContactMaterial.contactEquationStiffness = 1e9
        world.defaultContactMaterial.contactEquationRelaxation = 4
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -9.8, 0);
        world.broadphase = new CANNON.SAPBroadphase(world) /* Sweep and prune broadphase */
        world.defaultContactMaterial.friction = 0.2

        let chassisShape = new CANNON.Box(new CANNON.Vec3(carBodySize.y, carBodySize.z, carBodySize.x)); /* 定义车体形状,车体是一个矩形 */

        chassisBody = new CANNON.Body({ 
            mass: 150, 
            material: new CANNON.Material({ friction: 0, restitution: 0.3 }),
            shape: chassisShape, /* 刚体中添加形状 */
            position: new CANNON.Vec3(20, 20, 20)
        }); /* 定义车体刚体 */
        chassisBody.angularVelocity.set(0, 0, 0); /* 设置一个初始的角速度 */
        // world.addBody(chassisBody)

        vehicle = new CANNON.RaycastVehicle({ /* 初始化车路引擎 */
            chassisBody: chassisBody, indexForwardAxis: 0, indexRightAxis: 1, indexUpAxis: 2
        });

        const options = {
            radius: wheelRadius,
            directionLocal: new CANNON.Vec3(0, 0, -wheelRadius * 2),
            suspensionStiffness: 30,
            suspensionRestLength: 0.3,
            frictionSlip: 5,
            dampingRelaxation: 2.3,
            dampingCompression: 4.4,
            maxSuspensionForce: 100000,
            rollInfluence: 0.01,
            axleLocal: new CANNON.Vec3(0, 1, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
            maxSuspensionTravel: 0.3,
            customSlidingRotationalSpeed: -30,
            useCustomSlidingRotationalSpeed: true
        }
        //设置第一个轮的位置，并将轮子信息添加到车辆类中
        options.chassisConnectionPointLocal.set(1.13, 0.95, -0.1);
        vehicle.addWheel(options);
        //设置第二个轮的位置，并将轮子信息添加到车辆类中
        options.chassisConnectionPointLocal.set(1.13, -0.95, -0.1);
        vehicle.addWheel(options);
        //设置第三个轮的位置，并将轮子信息添加到车辆类中
        options.chassisConnectionPointLocal.set(-1.47, 0.95, -0.05);
        vehicle.addWheel(options);
        //设置第四个轮的位置，并将轮子信息添加到车辆类中
        options.chassisConnectionPointLocal.set(-1.47, -0.95, -0.05);
        vehicle.addWheel(options);
        //通过addToWorld方法将将车辆及其约束添加到世界上。
        vehicle.addToWorld(world);

        const size = 100;
        const matrix: any = [];
        for (let i = 0; i < size; i++) {
            matrix.push([]);
            for (let j = 0; j < size; j++) {
                const height = Math.cos(i / size * Math.PI * (size / 10)) * Math.cos(j / size * Math.PI * (size / 10)) / 2;
                matrix[i].push(height)
            }
        }
        const hfShape = new CANNON.Heightfield(matrix, {
            elementSize: 1
        });
        const physicsMaterial = new CANNON.Material("slipperyMaterial");
        var hfBody = new CANNON.Body({ mass: 0, material: physicsMaterial});
        var q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2);
        hfBody.addShape(hfShape, new CANNON.Vec3(-size / 2, 0, size / 2), q);//由于这个高度场是XOY平面第一象限上，所以需要旋转和平移，addShape方法为我们提供了这个功能。
        world.addBody(hfBody);
        groundMesh.userData = hfBody;
    }

    function initCannon2() {
        world = new CANNON.World();
        world.gravity.set(0, -30, 0)
        // Sweep and prune broadphase
        world.broadphase = new CANNON.SAPBroadphase(world)
        // Adjust the global friction
        world.defaultContactMaterial.friction = 0.2

        // Build the car chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 2)) /* 车体形状 */
        const chassisBody = new CANNON.Body({ mass: 1 }) /* 定义车身刚体 */
        const centerOfMassAdjust = new CANNON.Vec3(0, -1, 0)
        chassisBody.addShape(chassisShape)
        world.addBody(chassisBody)

        // Create the vehicle
        const vehicle = new CANNON.RigidVehicle({
          chassisBody,
        })

        const mass = 1
        const axisWidth = 7
        const wheelShape = new CANNON.Sphere(1.5)
        const wheelMaterial = new CANNON.Material('wheel')
        const down = new CANNON.Vec3(0, -1, 0)

        const wheelBody1 = new CANNON.Body({ mass, material: wheelMaterial })
        wheelBody1.addShape(wheelShape)
        vehicle.addWheel({
          body: wheelBody1,
          position: new CANNON.Vec3(-5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
          axis: new CANNON.Vec3(0, 0, 1),
          direction: down,
        })

        const wheelBody2 = new CANNON.Body({ mass, material: wheelMaterial })
        wheelBody2.addShape(wheelShape)
        vehicle.addWheel({
          body: wheelBody2,
          position: new CANNON.Vec3(-5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
          axis: new CANNON.Vec3(0, 0, -1),
          direction: down,
        })

        const wheelBody3 = new CANNON.Body({ mass, material: wheelMaterial })
        wheelBody3.addShape(wheelShape)
        vehicle.addWheel({
          body: wheelBody3,
          position: new CANNON.Vec3(5, 0, axisWidth / 2).vadd(centerOfMassAdjust),
          axis: new CANNON.Vec3(0, 0, 1),
          direction: down,
        })

        const wheelBody4 = new CANNON.Body({ mass, material: wheelMaterial })
        wheelBody4.addShape(wheelShape)
        vehicle.addWheel({
          body: wheelBody4,
          position: new CANNON.Vec3(5, 0, -axisWidth / 2).vadd(centerOfMassAdjust),
          axis: new CANNON.Vec3(0, 0, -1),
          direction: down,
        })

        vehicle.wheelBodies.forEach((wheelBody) => {
          // Some damping to not spin wheels too fast
          wheelBody.angularDamping = 0.4

          // Add visuals
        //   demo.addVisual(wheelBody)
        })

        vehicle.addToWorld(world)

        // Add the ground
        const sizeX = 64
        const sizeZ = sizeX
        const matrix: any[] = []
        for (let i = 0; i < sizeX; i++) {
          matrix.push([])
          for (let j = 0; j < sizeZ; j++) {
            if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
              const height = 6
              matrix[i].push(height)
              continue
            }

            const height = Math.sin((i / sizeX) * Math.PI * 7) * Math.sin((j / sizeZ) * Math.PI * 7) * 6 + 6
            matrix[i].push(height)
          }
        }

        const groundMaterial = new CANNON.Material('ground')
        const heightfieldShape = new CANNON.Heightfield(matrix, {
          elementSize: 300 / sizeX,
        })
        const heightfieldBody = new CANNON.Body({ mass: 0, material: groundMaterial })
        heightfieldBody.addShape(heightfieldShape)
        heightfieldBody.position.set(
          (-(sizeX - 1) * heightfieldShape.elementSize) / 2,
          -15,
          ((sizeZ - 1) * heightfieldShape.elementSize) / 2
        )
        heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        world.addBody(heightfieldBody)
        // demo.addVisual(heightfieldBody)

        // Define interactions between wheels and ground
        const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
          friction: 0.3,
          restitution: 0,
          contactEquationStiffness: 1000,
        })
        world.addContactMaterial(wheel_ground)
    }

    function initCar() {
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: '#00CCFF', metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05
        });
        const detailsMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1.0, roughness: 0.5
        });
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.1, opacity: 0.2, transparent: true
        });
        const shadow = new THREE.TextureLoader().load('/glbs/ferrari_ao.png');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/js/libs/draco/gltf/');
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        loader.load('/glbs/ferrari.glb', (gltf) => {

            carModel = gltf.scene;
            
            const t = carModel.getObjectByName('body');
            console.log(t)
            t.geometry.computeBoundingBox();
            const tt = t.geometry.boundingBox;
            console.log(tt.max.x - tt.min.x, tt.max.y - tt.min.y, tt.max.z - tt.min.z);

            // const geometry = new THREE.BoxGeometry(tt.max.y - tt.min.y, tt.max.z - tt.min.z, tt.max.x - tt.min.x);
            // const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
            // const cube = new THREE.Mesh( geometry, material );
            // cube.position.set(20,20,20);
            // cube.translateY(0.75)
            // scene.add( cube );

            carModel.position.set(20, 20, 20);
            carModel.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true; /* 物体开启“引起阴影” */
                    object.receiveShadow = true; /* 物体开启“接收阴影” */
                };
            });
            carModel.getObjectByName('body').material = bodyMaterial;
            carModel.getObjectByName('rim_fl').material = detailsMaterial;
            carModel.getObjectByName('rim_fr').material = detailsMaterial;
            carModel.getObjectByName('rim_rr').material = detailsMaterial;
            carModel.getObjectByName('rim_rl').material = detailsMaterial;
            carModel.getObjectByName('trim').material = detailsMaterial;
            carModel.getObjectByName('glass').material = glassMaterial;
            carModel.userData = chassisBody;
            scene.add(carModel);

            const brakeForce = 100;
            const maxSteerVal =  Math.PI / 8;
            const params = {
                maxForce: 100,
            }
            document.onkeydown = handler;
            document.onkeyup = handler;
            function handler(event) {
                var up = (event.type == 'keyup');
                if (!up && event.type !== 'keydown') {
                    return;
                }

                vehicle.setBrake(0, 0);
                vehicle.setBrake(0, 1);
                vehicle.setBrake(0, 2);
                vehicle.setBrake(0, 3);

                switch (event.keyCode) {
                    case 38: // 按下向前键时，通过applyEngineForce方法，设置车轮力以在每个步骤中施加在后车轮上
                        vehicle.applyEngineForce(up ? 0 : -params.maxForce, 2);
                        vehicle.applyEngineForce(up ? 0 : -params.maxForce, 3);
                        break;

                    case 40: // 同上
                        console.log('下')
                        vehicle.applyEngineForce(up ? 0 : params.maxForce, 2);
                        vehicle.applyEngineForce(up ? 0 : params.maxForce, 3);
                        break;

                    case 66: // 刹车键b，通过setBrake方法，设置四个车轮的制动力
                        vehicle.setBrake(brakeForce, 0);
                        vehicle.setBrake(brakeForce, 1);
                        vehicle.setBrake(brakeForce, 2);
                        vehicle.setBrake(brakeForce, 3);
                        break;

                    case 39: // 按下右键，通过setSteeringValue方法，设置前轮转向值
                        vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 0);
                        vehicle.setSteeringValue(up ? 0 : -maxSteerVal, 1);
                        break;

                    case 37: // 同上
                        vehicle.setSteeringValue(up ? 0 : maxSteerVal, 0);
                        vehicle.setSteeringValue(up ? 0 : maxSteerVal, 1);
                        break;
                }
            }
        });
    }

    function render() {
        requestAnimationFrame(render);
        const time = performance.now() / 1000
        const dt = time - lastCallTime
        lastCallTime = time
        world.step(timeStep, dt); //第一个参数是以固定步长更新物理世界参数（详情请看api）
        // scene.children.forEach((d: any) => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
        //     if(d.isMesh === true) {
        //         d.position.copy(d.userData.position);
        //         d.quaternion.copy(d.userData.quaternion); /* 对象局部旋转的四元数-欧拉角 */
        //     }
        // })
        if (chassisBody && carModel) {
            carModel.position.copy(chassisBody.position)
            carModel.quaternion.copy(chassisBody.quaternion);
        }
        controls.update();
        renderer.render(scene, camera);
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}