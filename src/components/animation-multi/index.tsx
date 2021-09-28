import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';

export default function AnimationMulti() {
    const modalRef = useRef<
        {
            worldModels: THREE.Group[],
            worldScene: THREE.Scene,
            renderer: THREE.WebGLRenderer,
            camera: THREE.PerspectiveCamera,
            clock: THREE.Clock,
            mixers: any[],
            MODELS: { name: string }[],
            UNITS: { modelName: string, meshName: string, position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }, scale: number, animationName: string }[],
            numLoadedModels: number
        }
    >({
        worldModels: [],
        mixers: [],
        UNITS: [
            {
                modelName: "Soldier", // Will use the 3D model from file models/gltf/Soldier.glb
                meshName: "vanguard_Mesh", // Name of the main mesh to animate
                position: { x: 0, y: 0, z: 0 }, // Where to put the unit in the scene
                scale: 1, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
                animationName: "Idle" // Name of animation to run
            },
            {
                modelName: "Soldier",
                meshName: "vanguard_Mesh",
                position: { x: 3, y: 0, z: 0 },
                scale: 2,
                animationName: "Walk"
            },
            {
                modelName: "Soldier",
                meshName: "vanguard_Mesh",
                position: { x: 1, y: 0, z: 0 },
                scale: 1,
                animationName: "Run"
            },
            {
                modelName: "Parrot",
                meshName: "mesh_0",
                position: { x: - 4, y: 0, z: 0 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                scale: 0.01,
                animationName: "parrot_A_"
            },
            {
                modelName: "Parrot",
                meshName: "mesh_0",
                position: { x: - 2, y: 0, z: 0 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 },
                scale: 0.02,
                animationName: null
            },
        ], MODELS: [
            { name: "Soldier" },
            { name: "Parrot" },
            // { name: "RiflePunch" },
        ], numLoadedModels: 0
    } as any);
    let { worldModels, worldScene, renderer, camera, clock, mixers, MODELS, UNITS, numLoadedModels } = modalRef.current;
    useEffect(() => {
        initScene();
        initRenderer();
        loadModels();
        animate();
        return () => {
            worldScene.clear();
            worldModels.forEach(model => model.clear())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function initScene() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(3, 6, -10);
        camera.lookAt(0, 1, 0);

        clock = new THREE.Clock();

        worldScene = new THREE.Scene();
        worldScene.background = new THREE.Color(0xa0a0a0);
        worldScene.fog = new THREE.Fog(0xa0a0a0, 10, 22);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 20, 0);
        worldScene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(- 3, 10, - 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = - 10;
        dirLight.shadow.camera.left = - 10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        worldScene.add(dirLight);

        const groundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 40),
            new THREE.MeshPhongMaterial({
                color: 0x999999,
                depthWrite: false
            })
        );

        groundMesh.rotation.x = - Math.PI / 2;
        groundMesh.receiveShadow = true;
        worldScene.add(groundMesh);
        window.addEventListener('resize', onWindowResize);
    }

    function initRenderer() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    function getModelByName(name: string) {
        return MODELS.filter(m => m.name === name)[0];
    }

    function startAnimation(skinnedMesh: any, animations: any, animationName: string) {
        const mixer = new THREE.AnimationMixer(skinnedMesh);
        const clip = THREE.AnimationClip.findByName(animations, animationName);
        if (clip) {
            const action = mixer.clipAction(clip);
            action.play();
        }
        return mixer;
    }

    function instantiateUnits() {
        let numSuccess = 0;
        UNITS.forEach(u => {
            const model = getModelByName(u.modelName) as any;
            if (model) {
                const clonedScene = SkeletonUtils.clone(model.scene);
                if (clonedScene) {
                    const clonedMesh = clonedScene.getObjectByName(u.meshName);
                    if (clonedMesh) {
                        const mixer = startAnimation(clonedMesh, model.animations, u.animationName);
                        mixers.push(mixer);
                        numSuccess++;
                    }
                    worldScene.add(clonedScene);
                    if (u.position) {
                        clonedScene.position.set(u.position.x, u.position.y, u.position.z);
                    }
                    if (u.scale) {
                        clonedScene.scale.set(u.scale, u.scale, u.scale);
                    }
                    if (u.rotation) {
                        clonedScene.rotation.x = u.rotation.x;
                        clonedScene.rotation.y = u.rotation.y;
                        clonedScene.rotation.z = u.rotation.z;
                    }
                }
            } else {
                console.error('can not find model', u.modelName);
            }
        })
        console.log(`Successfully instantiated ${numSuccess} units`);
    }

    function loadModels() {
        MODELS.forEach(model => {
            loadGltfModel(model, () => {
                ++numLoadedModels;
                if (numLoadedModels === MODELS.length) {
                    console.log('all models loaded, time to instantiate units...');
                    instantiateUnits();
                }
            })
        })
    }

    function loadGltfModel(model: { [key: string]: any }, onLoaded: Function) {
        const loader = new GLTFLoader();
        const modelName = '/glbs/' + model.name + '.glb';
        loader.load(modelName, gltf => {
            const scene = gltf.scene;
            worldModels.push(scene);
            model.animations = gltf.animations;
            model.scene = scene;
            scene.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true;
                }
            });
            console.log('done loading model', model.name);
            onLoaded();
        })
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        const mixerUpdateDelta = clock.getDelta();
        for (let i = 0; i < mixers.length; ++i) {

            mixers[i].update(mixerUpdateDelta);

        }
        renderer.render(worldScene, camera);
    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}
