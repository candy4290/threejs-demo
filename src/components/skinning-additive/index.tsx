import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'dat.gui';

export default function SkinningAdditive() {

    const modalRef = useRef<{
        panel: dat.GUI,
        panelSettings: any,
        crossFadeControls: dat.GUIController[],
        allActions: THREE.AnimationAction[],
        baseActions: {
            [key: string]: { [key: string]: any }
        },
        additiveActions: {
            [key: string]: { [key: string]: any }
        },
        currentBaseAction: string,
        numAnimations: number,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        model: THREE.Group,
        skeleton: THREE.SkeletonHelper,
        mixer: THREE.AnimationMixer,
        clock: THREE.Clock,
    }>({
        crossFadeControls: [],
        allActions: [],
        currentBaseAction: 'idle',
        baseActions: {
            idle: { weight: 1 },
            walk: { weight: 0 },
            run: { weight: 0 },
        },
        additiveActions: {
            sneak_pose: { weight: 0 },
            sad_pose: { weight: 0 },
            agree: { weight: 0 },
            headShake: { weight: 0 },
        },
    } as any);
    let { panel, panelSettings, crossFadeControls, allActions, baseActions, additiveActions, currentBaseAction, numAnimations, scene, renderer, camera, model, skeleton, mixer, clock } = modalRef.current;

    useEffect(() => {
        init();
        return () => {
            console.log('组件销毁')
            panel.destroy();
            scene.clear();
            model.clear();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        clock = new THREE.Clock();

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xa0a0a0);
        scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        scene.add(axesHelper);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(3, 10, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 2;
        dirLight.shadow.camera.bottom = - 2;
        dirLight.shadow.camera.left = - 2;
        dirLight.shadow.camera.right = 2;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 40;
        scene.add(dirLight);

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);

        const loader = new GLTFLoader();
        loader.load('/glbs/Xbot.glb', gltf => {
            console.log(gltf)
            model = gltf.scene;
            scene.add(model);

            model.traverse((object: any) => {
                if (object.isMesh) object.castShadow = true;
            });

            skeleton = new THREE.SkeletonHelper(model);
            skeleton.visible = false;
            scene.add(skeleton);

            const animations = gltf.animations;
            mixer = new THREE.AnimationMixer(model);

            numAnimations = animations.length;
            for (let i = 0; i !== numAnimations; ++i) {
                let clip = animations[i];
                const name = clip.name;
                if (baseActions[name]) {
                    const action = mixer.clipAction(clip);
                    activateAction(action);
                    baseActions[name].action = action;
                    allActions.push(action);
                } else if (additiveActions[name]) {
                    THREE.AnimationUtils.makeClipAdditive(clip); /* Converts the keyframes of the given animation clip to an additive format. */
                    if (clip.name.endsWith('_pose')) {
                        clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30); /* 创建一个新的片段、仅包含给定帧之间的原始剪辑片断 */
                    }
                    const action = mixer.clipAction(clip);
                    activateAction(action);
                    additiveActions[name].action = action;
                    allActions.push(action);
                }
            }

            createPanel();
            animate();
        });

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.shadowMap.enabled = true;

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
        camera.position.set(- 1, 2, 3);

        const controls = new OrbitControls(camera, renderer.domElement); /* 轨道控制器，可使得相机围绕目标进行轨道运动 */
        controls.enablePan = false; /* false-禁止摄像机平移 */
        controls.enableZoom = false;
        controls.target.set(0, 1, 0); /* target-控制器的焦点 */
        controls.update();
    }

    function animate() {
        requestAnimationFrame(animate); /* 周期性执行渲染函数 */
        allActions.forEach(action => {
            const clip = action.getClip();
            const settings = baseActions[clip.name] || additiveActions[clip.name];
            settings.weight = action.getEffectiveWeight(); /* 返回影响权重(考虑当前淡入淡出状态和enabled的值). */
        })
        let delta = clock.getDelta(); /* 获取前后两次执行该方法的时间间隔 */
        mixer.update(delta); /* 推进混合器时间并更新动画，传入按照混合器的时间比例缩放过的clock.getDelta */
        renderer.render(scene, camera); /* 使用渲染器和相机进行渲染；渲染出来一帧图像 */
    }

    function activateAction(action: THREE.AnimationAction) {
        const clip = action.getClip();
        const settings = baseActions[clip.name] || additiveActions[clip.name];
        setWeight(action, settings.weight);
        action.play();
    }

    function setWeight(action: THREE.AnimationAction, weight: number) {
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }

    function executeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
        if (endAction) {
            setWeight(endAction, 1);
            endAction.time = 0;
            if (startAction) {
                startAction.crossFadeTo(endAction, duration, true);
            } else {
                endAction.fadeIn(duration);
            }
        } else {
            startAction.fadeOut(duration);
        }
    }

    /* 在本次action循环结束后再进入endAction */
    function synchronizeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
        mixer.addEventListener('loop', onLoopFinished);
        function onLoopFinished(event: any) {
            if (event.action === startAction) {
                mixer.removeEventListener('loop', onLoopFinished);
                executeCrossFade(startAction, endAction, duration);
            }
        }
    }

    function prepareCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
        if (currentBaseAction === 'idle' || !startAction || !endAction) {
            executeCrossFade(startAction, endAction, duration);
        } else {
            synchronizeCrossFade(startAction, endAction, duration);
        }

        /* 更新control的颜色 */
        if (endAction) {
            const clip = endAction.getClip();
            currentBaseAction = clip.name;
        } else {
            currentBaseAction = 'None';
        }

        crossFadeControls.forEach((control: any) => {
            const name = control.property;
            if (name === currentBaseAction) {
                control.setActive();
            } else {
                control.setInactive();
            }
        })
    }

    function createPanel() {
        dat.GUI.TEXT_CLOSED = '关闭Controls';
        dat.GUI.TEXT_OPEN = '打开Controls';
        panel = new dat.GUI({ width: 310 });

        const folder1 = panel.addFolder('基础动作');
        const folder2 = panel.addFolder('叠加动作重力');
        const folder3 = panel.addFolder('综合速度');

        panelSettings = {
            '调整时间比例': 1.0
        };

        const baseNames = ['无', ...Object.keys(baseActions)];
        baseNames.forEach(name => {
            const settings = baseActions[name];
            panelSettings[name] = () => {
                const currentSettings = baseActions[currentBaseAction];
                const currentAction = currentSettings ? currentSettings.action : null;
                const action = settings ? settings.action : null;
                prepareCrossFade(currentAction, action, 0.35);
            }
            crossFadeControls.push(folder1.add(panelSettings, name));
        });

        for (const name of Object.keys(additiveActions)) {
            const settings = additiveActions[name];
            panelSettings[name] = settings.weight;
            folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(weight => {
                setWeight(settings.action, weight);
                settings.weight = weight;
            });
        }

        folder3.add(panelSettings, '调整时间比例', 0.0, 1.5, 0.01).onChange(speed => mixer.timeScale = speed);

        folder1.open();
        folder2.open();
        folder3.open();

        crossFadeControls.forEach((control: any) => {
            control.classList1 = control.domElement.parentElement.parentElement.classList;
            control.classList2 = control.domElement.previousElementSibling.classList;
            control.setInactive = function () {
                control.classList2.add('control-inactive');
            };
            control.setActive = function () {
                control.classList2.remove('control-inactive');
            };
            const settings = baseActions[control.property];
            if (!settings || !settings.weight) {
                control.setInactive();
            }
        });

    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}