import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls, OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * 着色器材质
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

export default function Glsl1() {
    
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

        // scene.add(new THREE.AmbientLight(0xffffff))

        const geom = new THREE.SphereGeometry(10, 30, 20);
        const mate = new THREE.ShaderMaterial({ 
            vertexShader: ` 
            // 顶点着色器
            varying vec3 vNormal;
            void main() {
                        //将attributes的normal通过varying赋值给了向量vNormal
                vNormal = normal;
                        //projectionMatrix是投影变换矩阵 modelViewMatrix是相机坐标系的变换矩阵 最后我们将y值乘以1.4得到了一个形如鸡蛋的几何体
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position.x, position.y, position.z, 1.0 );
            }
            `,
            fragmentShader: `
                //片元着色器同样需要定义varying vec3 vNormal；
                varying vec3 vNormal;
                void main() {
                            //vNormal是一个已经归一化的三维向量
                    float pr = (vNormal.x + 1.0) / 2.0; //pr红色通道值范围为0~1
                    float pg = (vNormal.y + 1.0) / 2.0; //pg绿色通道值范围为0~1
                    float pb = (vNormal.z + 1.0) / 2.0; //pb蓝色通道值范围为0~1
                    gl_FragColor=vec4(pr, pg, pb, 1.0); //最后设置顶点颜色，点与点之间会自动插值
                }
            `
        })
        const mesh = new THREE.Mesh(geom, mate);
        scene.add(mesh)

        // const geometry = new THREE.SphereGeometry( 15, 32, 16 );
        // const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        // const sphere = new THREE.Mesh( geometry, material );
        // sphere.position.set(30,30,30)
        // scene.add( sphere );

        render()
    }
    function render() {
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