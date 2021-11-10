import { useEffect } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader";

let camera, scene, renderer, light, controls;

let bloomComposer;

let camera2, scene2;
let logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAgVBMVEUAAADPz8/Pz8/Pz8/m5ub0aGjlOTn5OzvlOzvlaGjmaWn8JCTm5ubPz8/0amrm5ubm5ubmIyP5OjrPz8/sbGzm5ubmEhLm5ubPz8/5OTn5Ojrm5ubm5ub3SUnmSkrm5ubPz8/m5ubPz8/m5ubPz8//AADlAADmAAD9Dw/lDw/mDw99mUFhAAAAI3RSTlMA/SmmpVDj4eBSSvmpqUksJvfj0jMp/e/v4+LUz8fGhoYbG4z3WGIAAADhSURBVFjD7c7HDsIwEEVR0+JAaCn0XpwA//+BYI1GRvFqniU2+K1mM1dHxcXF/WJVnlVBgaQxRcj/sG6MGYQAbGATArCBAEJCgQIHUAAmJBzYogAKwITUBTTyP6opABPS74BGARwwUwzgAhoBUAAkpO2ABgAUwAhHP3AQBXI/kIkCS/v8/Oz14MkCqxvvzluLAns/UIoCJz9wFgXmXqDTVaL124GeUhgBBDiCA4AEBwAJCIC24AADQAIDYAIDYAIBsM0oQABoYwpM7A0TGAATGAATGAATCADvsiuvKi7uL/YGYLhANadUnSAAAAAASUVORK5CYII=';

export default function Bloom() {
    useEffect(() => {
        init()
        animate();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
        camera2 = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
        camera.position.set(100, 200, 300);
        camera2.position.set(100, 200, 300);
        scene = new THREE.Scene();
        scene2 = new THREE.Scene();
        scene.background = new THREE.Color(0xa0a0a0);
        scene2.background = new THREE.Color(0xa0a0a0);

        light = new THREE.HemisphereLight(0xffffff, 0x444444);
        light.position.set(0, 200, 0);
        scene.add(light);
        scene2.add(light);


        // ground
        const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene2.add(mesh);

        const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
        scene2.add(grid);

        // model
        const geometry = new THREE.BoxGeometry(100, 100, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        //compass
        const compass = new THREE.Sprite(new THREE.SpriteMaterial({
            map: new THREE.TextureLoader().load(logo)
        }));
        compass.scale.set(40, 40, 1);
        compass.center.set(0.0, 1.0);
        const _w = window.innerWidth / 2, _h = window.innerHeight / 2;
        compass.position.set(-_w + 20, _h - 20, 1);
        scene2.add(compass);
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.autoClear = false;
        controls = new OrbitControls( camera, renderer.domElement );
        controls.target.set( 0, 0, 0 );
        controls.update();


        const renderScene = new RenderPass(scene, camera);
        const effectCopy = new ShaderPass(CopyShader);
        effectCopy.renderToScreen = true;

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85, [cube], scene, camera,);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0;



        bloomComposer = new EffectComposer(renderer);
        bloomComposer.renderToScreen = true;
        bloomComposer.addPass(renderScene);
        bloomComposer.addPass(bloomPass);
        //bloomComposer.addPass( effectCopy );



        window.addEventListener('resize', onWindowResize, false);


    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        renderer.autoClear = false;
        renderer.clear();
        bloomComposer.render();
        renderer.clearDepth();
        renderer.render(scene2, camera2);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}