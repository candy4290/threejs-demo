import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
/**
 * 着色器材质内置变量
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let clock = new THREE.Clock();
const time = {
    value: 0
}

export default function ShaderMaterial() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);
        camera.position.set(100, 100, 100)
        renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls = new MapControls(camera, renderer.domElement);

        var planeGeom = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const uniforms = {
            time
        }
        var planeMate = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: uniforms,
            vertexShader: `
                // 控制大小和位置，以出现波浪效果
                uniform float time;
                void main() {
                    float y = sin(position.x / 50.0 + time) * 10.0 + sin(position.y / 50.0 + time) * 10.0;
                    vec3 newPosition = vec3(position.x, position.y, y * 2.0 );
                    gl_PointSize = (y + 20.0) / 4.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
                }
            `,
            fragmentShader: `
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if(r < 0.5) {
                        gl_FragColor = vec4(0.0,1.0,1.0,1.0);
                    }
                }
            `
        })
        var planeMesh = new THREE.Points(planeGeom, planeMate);
        planeMesh.rotation.x = - Math.PI / 2;
        scene.add(planeMesh);

        render();
    }
    function render() {
        requestAnimationFrame(render);
        time.value += 0.01;
        controls.update();
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}