import { useEffect } from "react"
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let clock = new THREE.Clock();

let world: CANNON.World;
let groundMesh: THREE.Mesh;

/**
 * 高度场
 *
 * @export
 * @return {*} 
 */
export default function Cannon4() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        // scene.background = new THREE.Color('0xffffff')
        scene.add(new THREE.AxesHelper(400)); 

        scene.add(new THREE.AmbientLight(0xffffff));

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(50, 50, 50);
        scene.add(light);

        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(20,20,20)
        renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio)
        controls = new OrbitControls(camera, renderer.domElement);

        const size = 100;
        const groundGeom = new ParametricGeometry((u,v,target) => {
            const height = Math.cos(u * Math.PI * 8) * Math.cos(v * Math.PI * 8);//这里的方法和生成高度场的方法是一样的，不了解ParametricBufferGeometry几何体的可以参考我之前发的博客。
            target.set(u * size - size / 2, height, v * size - size / 2);
        }, size, size)
        let groundMate = new THREE.MeshPhongMaterial({color: 0x666666, side: THREE.DoubleSide});
        groundMesh = new THREE.Mesh(groundGeom, groundMate);
        scene.add(groundMesh);

        initCannon();

        render();
    }

    function initCannon() {
        world = new CANNON.World();
        world.defaultContactMaterial.contactEquationStiffness = 1e9
        world.defaultContactMaterial.contactEquationRelaxation = 4
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -20, 0);

        const matrix: any = []; /* 创建高度场的数组 */
        const size = 100;
        for (let i = 0; i < size; i++) {
            matrix.push([]);
            for (var j = 0; j < size; j++) {
                            //高度由两个余弦函数叠加形成
                var height = Math.cos(i / size * Math.PI * 8) * Math.cos(j / size * Math.PI * 8);
                matrix[i].push(height)
            }
        }
        console.log(matrix)
        const hfShape = new CANNON.Heightfield(matrix, {
            elementSize: 1 //数据点的距离设置为1
        });
        const physicsMaterial = new CANNON.Material("slipperyMaterial");
        var hfBody = new CANNON.Body({ mass: 0, material: physicsMaterial});
        var q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2);
        hfBody.addShape(hfShape, new CANNON.Vec3(-size / 2, 0, size / 2), q);//由于这个高度场是XOY平面第一象限上，所以需要旋转和平移，addShape方法为我们提供了这个功能。
        world.addBody(hfBody);
        groundMesh.userData = hfBody;

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

    function render() {
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
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