import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as dat from 'dat.gui';

/**
 * 画线---three.js
 *
 * @export
 * @return {*} 
 */
let scene, camera, renderer: THREE.WebGLRenderer;


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

/* up与down的位置，用来判断是否发生移动 */
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();
let flag;
let plane;
let geometry: THREE.BufferGeometry;
let points: number[] = []; /* 画线 */
let line;
// const geometry = new THREE.BoxGeometry(20, 20, 20);

export default function DrawLine2() {
    useEffect(() => {
        init();
    }, [])
    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(0, 250, 1000);
        scene.add(camera);
        scene.add(new THREE.AmbientLight(0xf0f0f0));
        const light = new THREE.SpotLight(0xffffff, 1.5);
        light.position.set(0, 1500, 200);
        light.angle = Math.PI * 0.2;
        light.castShadow = true;
        light.shadow.camera.near = 200;
        light.shadow.camera.far = 2000;
        light.shadow.bias = - 0.000222;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        scene.add(light);

        const helperAxis = new THREE.AxesHelper(1000);
        scene.add(helperAxis);

        const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
        planeGeometry.rotateX(- Math.PI / 2);
        const planeMaterial = new THREE.MeshBasicMaterial({ opacity: 0.2, color: '#bb9246' });

        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = - 1;
        plane.receiveShadow = true;
        scene.add(plane);

        const helper = new THREE.GridHelper(2000, 100);
        // helper.position.y = - 199;
        helper.material['opacity'] = 0.25;
        helper.material['transparent'] = true;
        // scene.add(helper);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.dampingFactor = 0.2;

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointermove', onPointerMove);

        // let curve = new THREE.CatmullRomCurve3([ /* 用来计算路线的斜率等等---控制车头方向的 */
        //     new THREE.Vector3(0,0,0),
        //     new THREE.Vector3(0,1,1),
        //     new THREE.Vector3(0,2,2),
        //     new THREE.Vector3(0,5,3),
        //     new THREE.Vector3(0,6,2),
        // ], false, 'catmullrom', 0);

        // geometry = new THREE.BufferGeometry();
        // geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3));

        // const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
        //     color: 0x000000,
        //     opacity: 0.35
        // }));
        // scene.add(line)

        animate();
    }


    function onPointerDown(event) {
        onDownPosition.x = event.clientX;
        onDownPosition.y = event.clientY;
        flag = true;
    }

    function onPointerUp(event) {
        onUpPosition.x = event.clientX;
        onUpPosition.y = event.clientY;
        flag = false;
        // if (onDownPosition.distanceTo(onUpPosition) === 0) transformControl.detach(); /* 点击-且没有移动，则将拖拽工具隐藏 */
    }

    function onPointerMove(event) {
        // if (!flag) {
        //     return;
        // }
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0 && flag) {
            const temp = intersects[0].point;
            points.push(temp.x, temp.y, temp.z)
            if (points.length > 5) {
                if (line) {
                    scene.remove(line);
                    line = null;
                }
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
                console.log(points)
                line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                    color: 0x000000,
                    opacity: 0.35
                }));
                scene.add(line)
            }
            // // console.log(temp);
            // const position = geometry.attributes.position;
            // console.log(position.count)
            // position.setXYZ(position.itemSize, temp.x, temp.y, temp.z);
            // position.needsUpdate = true;
            // geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([]), 3))
            // if (object !== transformControl.object) {
            //     transformControl.attach(object); /* 设置应当变换的3d对象----出现拖拽工具 */
            // }
        }
    }

    function animate() {

        requestAnimationFrame( animate );
        render();

    }

    function render() {
        renderer.render( scene, camera );
    }
    return (
        <canvas id="three"></canvas>
    )
}