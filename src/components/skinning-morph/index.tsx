import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as dat from 'dat.gui';
import './index.less';

export default function SkinningMorph() {

    const modalRef = useRef<{
        face: any,
        panel: dat.GUI,
        actions: {
            [key: string]: THREE.AnimationAction;
        },
        api: {
            state: string
        },
        previousAction: THREE.AnimationAction,
        activeAction: THREE.AnimationAction,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        model: THREE.Group,
        skeleton: THREE.SkeletonHelper,
        mixer: THREE.AnimationMixer,
        clock: THREE.Clock,
    }>({
        actions: {},
        api: {
            state: 'Walking'
        },
        crossFadeControls: [],
        allActions: [],
        currentBaseAction: 'idle',
    } as any);
    let { face, panel, actions, previousAction, activeAction, scene, renderer, camera, model, api, mixer, clock } = modalRef.current;

    useEffect(() => {
        init();
        animate();
        return () => {
            console.log('组件销毁')
            panel.destroy();
            scene.clear();
            model.clear();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);
        camera.position.set(-5, 3, 10);
        camera.lookAt(new THREE.Vector3(0, 2, 0));

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xe0e0e0);
        scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        clock = new THREE.Clock();


        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(0, 20, 10);
        scene.add(dirLight);

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
        mesh.rotation.x = - Math.PI / 2;
        scene.add(mesh);

        const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
        (grid.material as any).opacity = 0.2;
        (grid.material as any).transparent = true;
        scene.add(grid);

        const loader = new GLTFLoader();
        loader.load('/glbs/RobotExpressive.glb', gltf => {
            console.log(gltf)
            model = gltf.scene;
            scene.add(model);

            createGUI(model, gltf.animations)
        });

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;

        window.addEventListener('resize', onWindowResize);
    }

    function createGUI(model: THREE.Group, animations: THREE.AnimationClip[]) {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
        const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];
        panel = new dat.GUI();
        mixer = new THREE.AnimationMixer(model);
        actions = {};
        animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            actions[clip.name] = action;
            if (emotes.indexOf(clip.name) > -1 || states.indexOf(clip.name) >= 4) {
                action.clampWhenFinished = true; /* true-动画将在最后一帧之后自动暂停 */
                action.loop = THREE.LoopOnce; /* LoopOnce-只执行一次 */
            }
        });

        const statesFolder = panel.addFolder('状态');
        const clipCtrl = statesFolder.add(api, 'state').options(states);
        clipCtrl.onChange(() => {
            fadeToAction(api.state, .5);
        });
        statesFolder.open();

        const emoteFolder = panel.addFolder('Emotes');
        function createEmoteCallback(name: string) {
            api[name] = () => {
                fadeToAction(name, .2);
                mixer.addEventListener('finished', restoreState);
            }
            emoteFolder.add(api, name);
        }

        function restoreState() {
            mixer.removeEventListener('finished', restoreState);
            fadeToAction(api.state, .2);
        }

        emotes.forEach(emote => {
            createEmoteCallback(emote);
        });
        emoteFolder.open();

        // expressions
        face = model.getObjectByName('Head_4');
        const expressions = Object.keys(face.morphTargetDictionary);
        const expressionFolder = panel.addFolder('Expressions');

        console.log(face)
        for (let i = 0; i < expressions.length; i++) {
            expressionFolder.add(face.morphTargetInfluences, i + '', 0, 1, 0.01).name(expressions[i]);
        }

        activeAction = actions['Walking'];
        activeAction.play();

        expressionFolder.open();

    }

    function fadeToAction(state: string, duration: number) {
        previousAction = activeAction;
        activeAction = actions[state];
        if (previousAction !== activeAction) {
            previousAction.fadeOut(duration);
        }
        activeAction.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function animate() {
        const dt = clock.getDelta();
        if (mixer) mixer.update(dt);
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }


    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}