import { useEffect, useRef } from "react";
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

export default function Outline() {
    const modalRef = useRef<{
        camera: THREE.PerspectiveCamera,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        controls: OrbitControls,
        gui: dat.GUI,
        settings: any,
        clock: THREE.Clock,
        obj3d: THREE.Object3D,
        group: THREE.Group,
        composer: EffectComposer,
        outlinePass: OutlinePass,
        effectFXAA: ShaderPass,
        raycaster: THREE.Raycaster,
        mouse: THREE.Vector2,
        selectedObjects: any[]
    }>({ group: new THREE.Group(), obj3d: new THREE.Object3D(), raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(), selectedObjects: [] } as any);

    let { camera, scene, renderer, controls, gui, settings, clock, obj3d, group, composer, outlinePass, effectFXAA, raycaster, mouse, selectedObjects } = modalRef.current;

    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        /* 渲染器 */
        renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        /* 相机 */
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 100);
        camera.position.set(0, 0, 0);

        /* 场景 */
        scene = new THREE.Scene();

        controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 5;
        controls.maxDistance = 20;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        scene.add(new THREE.AmbientLight(0xaaaaaa, 0.2));
        const light = new THREE.DirectionalLight(0xddffdd, 0.6);
        light.position.set(1, 1, 1);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;

        const d = 10;

        light.shadow.camera.left = - d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = - d;
        light.shadow.camera.far = 1000;

        scene.add(light);


        const manager = new THREE.LoadingManager();

        manager.onProgress = function (item, loaded, total) {
            console.log(item, loaded, total);
        };

        const loader = new OBJLoader(manager);
        loader.load('/models/obj/tree.obj', (object) => {
            let scale = 1.0;
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.geometry.center();
                    child.geometry.computeBoundingSphere();
                    scale = 0.2 * child.geometry.boundingSphere.radius;

                    const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 5 });
                    child.material = phongMaterial;
                    child.receiveShadow = true;
                    child.castShadow = true;
                }
            });

            object.position.y = 1;
            object.scale.divideScalar(scale);
            obj3d.add(object);
        });

        scene.add(group);

        group.add(obj3d)

        const geometry = new THREE.SphereGeometry(3, 48, 24);

        for (let i = 0; i < 20; i++) {

            const material = new THREE.MeshLambertMaterial();
            material.color.setHSL(Math.random(), 1.0, 0.3);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = Math.random() * 4 - 2;
            mesh.position.y = Math.random() * 4 - 2;
            mesh.position.z = Math.random() * 4 - 2;
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            mesh.scale.multiplyScalar(Math.random() * 0.3 + 0.1);
            group.add(mesh);

        }

        const floorMaterial = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });

        const floorGeometry = new THREE.PlaneGeometry(12, 12);
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.rotation.x -= Math.PI * 0.5;
        floorMesh.position.y -= 1.5;
        group.add(floorMesh);
        floorMesh.receiveShadow = true;

        const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
        const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffaaff });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.position.z = - 4;
        group.add(torus);
        torus.receiveShadow = true;
        torus.castShadow = true;

        composer = new EffectComposer(renderer);

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
        outlinePass.edgeThickness = 2;
        outlinePass.pulsePeriod = 5;
        composer.addPass(outlinePass);

        // const textureLoader = new THREE.TextureLoader();
        // textureLoader.load('/textures/tri_pattern.jpg', (texture) => {
        //     outlinePass.patternTexture = texture;
        //     texture.wrapS = THREE.RepeatWrapping;
        //     texture.wrapT = THREE.RepeatWrapping;
        // });

        // effectFXAA = new ShaderPass(FXAAShader);
        // effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        // composer.addPass(effectFXAA);

        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.addEventListener('pointermove', onPointerMove);

        function onPointerMove(event) {
            if (event.isPrimary === false) return;
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            checkIntersection();
        }

        function addSelectedObject(object) {
            selectedObjects = [];
            selectedObjects.push(object);
        }

        function checkIntersection() {

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(scene, true);
            if (intersects.length > 0) {
                const selectedObject = intersects[0].object;
                addSelectedObject(selectedObject);
                outlinePass.selectedObjects = selectedObjects;
            } else {
                outlinePass.selectedObjects = [];
            }

        }

        animate();
    }

    function animate() {
        requestAnimationFrame(animate);
        // controls.update();
        composer.render();
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}