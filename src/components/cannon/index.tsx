import { useEffect } from "react"
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * 物理引擎cannon----给下落的box的userData一个刚体数据，然后根据userData的刚体数据，更新box的位置
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;

let world: CANNON.World;
let ground: THREE.Mesh;
let bodyGround: CANNON.Body;

let clock = new THREE.Clock();
export default function Cannon() {
    useEffect(() => {
        init();
    }, [])

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.y = 30;
        camera.position.z = 20;
        camera.lookAt(0, 5, 0);
        scene.add(camera)

        scene.add(new THREE.AmbientLight(0x888888));
        const light = new THREE.DirectionalLight(0xbbbbbb, 1);
        light.position.set(6,30,6);
        scene.add(light);

        const axisHelper = new THREE.AxesHelper(50);
        scene.add(axisHelper);

        renderer = new THREE.WebGLRenderer({canvas, antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0xbfd1e5);

        let groundGeom = new THREE.BoxBufferGeometry(40, 0.2, 40);
        // let groundMate = new THREE.MeshPhongMaterial({color: 0xdddddd, map: texture})
        let groundMate = new THREE.MeshPhongMaterial({color: 0xdddddd})
        ground = new THREE.Mesh(groundGeom, groundMate);
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground); //step 5 添加地面网格

        controls = new MapControls(camera, renderer.domElement);

        initCannon();
        animation();
    }

    function initCannon() {
        world = new CANNON.World(); /* 初始化物理世界（包含物理世界的相关数据：刚体数据、世界中所受外力等等） */
        world.gravity.set(0, -9.8, 0); /* 设置物理世界的重力为沿y轴向上-9.8米m/s2 */
        world.broadphase = new CANNON.NaiveBroadphase(); // NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高

        bodyGround = new CANNON.Body({ /* 创建一个刚体（物理世界的刚体数据） */
            mass: 0, //刚体的质量，这里单位为kg
            position: new CANNON.Vec3(0, -0.1, 0), //刚体的位置，单位是米
            shape: new CANNON.Box(new CANNON.Vec3(20, 0.1, 20)), //刚体的形状（这里是立方体，立方体的参数是一个包含半长、半宽、半高的三维向量，具体我们以后会说）
            material: new CANNON.Material({friction: 0.05, restitution: 0}) //材质数据，里面规定了摩擦系数和弹性系数
        });
        ground.userData = bodyGround; /* 将刚体数据赋值给地面网格的userData属性 */
        world.addBody(bodyGround); /* 物理世界中添加刚体 */
        const geometry = new THREE.BoxGeometry(1,1,1);
        setInterval(() => {
            createBox(geometry); /* 创建网格和刚体 */
        }, 200);
    }

    function createBox(geometry) {
        let x = Math.random() * 10 - 5;
        let z = Math.random() * 10 - 5;
        let box = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff})); //createRandomMaterial创建随机颜色的材质
        box.position.set(0, 20, 0);
        scene.add( box ); //创建box，并添加到场景

        let bodyBox = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(x, 20, z),
            shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
            material: new CANNON.Material({friction: 0.1, restitution: 0})
        });//创建一个质量为1kg，位置为（x,20,z），形状为halfSize为1,1,1的正方形刚体，材质中摩擦系数为0.1，弹性系数为0。
        box.userData = bodyBox;//给box的userData属性添加刚体数据
        world.addBody(bodyBox);//在物理世界中添加该刚体

        setTimeout(() => { //10秒钟之后在场景中移除box，并在物理世界中移除该刚体
            scene.remove(box);
            box.material.dispose();
            box.geometry.dispose();
            world.removeBody(bodyBox);
        }, 10000)
    }

    function animation() {
        requestAnimationFrame(animation);
        render();
    }

    function render() {
        updatePhysics();
        controls.update();
        renderer.render(scene, camera);
    }

    function updatePhysics() {
        world.step(clock.getDelta()); //第一个参数是以固定步长更新物理世界参数（详情请看api）
        scene.children.forEach((d: any) => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
            if(d.isMesh === true) {
                d.position.copy(d.userData.position);
                d.quaternion.copy(d.userData.quaternion); /* 对象局部旋转的四元数-欧拉角 */
            }
        })
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}