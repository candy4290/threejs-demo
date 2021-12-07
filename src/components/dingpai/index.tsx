import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import './index.less';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let labelRenderer: CSS2DRenderer;

let scene2: THREE.Scene;
let renderer2: CSS3DRenderer;

export default function DingPai() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xf0f0f0 );
        scene2 = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set( 200, 200, 200 );

        const axisHelper = new THREE.AxesHelper(20);
        scene.add(axisHelper);

        const GridHelper = new THREE.GridHelper(100, 100);
        scene.add(GridHelper);

        const directionalLight = new THREE.DirectionalLight('#fff')
        directionalLight.position.set(30, 30, 30).normalize()
        scene.add(directionalLight)
        const ambientLight = new THREE.AmbientLight('#fff', 0.3) // obj 唯一 id
        scene.add(ambientLight)

        const dingPaiDiv = document.querySelector('#box2') as HTMLDivElement;
        const dingPaiLable = new CSS2DObject(dingPaiDiv);

        const material = new THREE.LineBasicMaterial( { color: 0xffffff } );
        const points: any[] = [];
        points.push( new THREE.Vector3( 1, 0, 1 ) );
        points.push( new THREE.Vector3( 1, 5, 1 ) );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        scene.add(line);

        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';

        dingPaiLable.position.set(1,5,1);
        scene.add(dingPaiLable);
        document.body.appendChild(labelRenderer.domElement);

        
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        const dingPaiDiv3 = document.querySelector('#box3') as HTMLDivElement;
        const dingPaiLable3 = new CSS3DObject(dingPaiDiv3);
        dingPaiLable3.position.set(1,5,1);
        dingPaiLable3.scale.set(0.01,0.01,0.01)
        scene2.add(directionalLight)
        scene2.add(ambientLight)
        scene2.add(dingPaiLable3);
        renderer2 = new CSS3DRenderer();
        renderer2.setSize( window.innerWidth, window.innerHeight );
        renderer2.domElement.style.position = 'absolute';
        renderer2.domElement.style.top = '0px';
        document.body.appendChild( renderer2.domElement );

        controls = new OrbitControls(camera, renderer2.domElement);


        render();

        window.addEventListener('resize', resize);
    }

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        renderer2.setSize(window.innerWidth, window.innerHeight);
    }

    function render() {
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        renderer2.render( scene2, camera );
    }
    return (
        <>
            <canvas id="three"></canvas>
            {/* <div style={{display: 'none'}}>
            <div className="box1" id="box1">
                这是一个css2d文本
            </div> */}
            <div className="box2" id="box2">
                <div className="ys-block">
                    <div className="ys-tit-sm"><span>标题</span></div>
                    <div className="ys-con">
                        这是一个精彩的文本
                    </div>
                </div>
            </div>
            <div className="box2" id="box3">
                <div className="ys-block">
                    <div className="ys-tit-sm"><span>标题3</span></div>
                    <div className="ys-con">
                        这是一个精彩的文本3
                    </div>
                </div>
            </div>
            {/* </div> */}
        </>
    )
}