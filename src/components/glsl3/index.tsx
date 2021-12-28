import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * glsl内置函数：https://www.mrguo.link/article?id=32
 * 着色器材质变量
 * Uniforms是所有顶点都具有相同的值的变量。 比如灯光，雾，和阴影贴图就是被储存在uniforms中的数据。 uniforms可以通过顶点着色器和片元着色器来访问。
 * Varyings 是从顶点着色器传递到片元着色器的变量。因此需要在两个着色器中同时定义，对于每一个片元，每一个varying的值将是相邻顶点值的平滑插值。
 * Attributes 与每个顶点关联的变量。例如，顶点位置，法线和顶点颜色都是存储在attributes中的数据。attributes 只可以在顶点着色器中访问。
 * 
 * 
 * projectionMatrix、modelViewMatrix和position都是three为我们设置好的变量，可以直接拿来用，前两个变量我们之前已经说了，而position就是每一个顶点的坐标值，
 * 当着色器代码执行时，会循环执行gl_Position和gl_FragColor设置顶点位置，和颜色插值。并且我们最终要设置的就是gl_Position和gl_FragCol
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
const StartTime = {
    value: 0
};
const clock = new THREE.Clock();

export default function Glsl3() {
    
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.add(new THREE.AxesHelper(100))
        camera = new THREE.PerspectiveCamera();
        camera.position.set(100,100,100)
        renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls = new OrbitControls(camera, renderer.domElement);

        var sphere = new THREE.SphereBufferGeometry(10, 120, 80);
        const count = sphere.attributes.position.count;//顶点的数量
        const verticesArray = new Float32Array(count);//存放每一个点的噪声值
        const boolArray = new Float32Array(count);//辅助类型数组
        for(var v = 0; v < count; v++) {
            verticesArray[v] = Math.random() * 2 + 10;//随机数[10,12)
            if(Math.random() >= 0.5) {//在创造一个随机数，如果大于如果大于0.5，boolArray设置成10.5，boolArray设置成1。如果小于0.5，boolArray设置成-1
                boolArray[v] = 1;
            } else {
                boolArray[v] = -1;
            }
        }
        var bufferAttribute = new THREE.BufferAttribute(verticesArray, 1);
        sphere.setAttribute('noise', bufferAttribute);
        
        render()
    }
    function render() {
        // const dt = clock.getDelta();
        StartTime.value += 0.1;
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}