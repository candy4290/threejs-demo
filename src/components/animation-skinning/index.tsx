import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { AnimationAction } from "three";
import * as dat from 'dat.gui';
import './index.less';


/**
 * glb模型加载&动画
 *
 * @export
 * @return {*} 
 */
export default function AnimationSkinning() {

  const modolRef = useRef<{
    controls: OrbitControls,
    panel: dat.GUI,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    model: THREE.Group,
    skeleton: THREE.SkeletonHelper,
    mixer: THREE.AnimationMixer,
    clock: THREE.Clock,
    crossFadeControls: dat.GUIController[],
    idleAction: AnimationAction,
    walkAction: AnimationAction,
    runAction: AnimationAction,
    idleWeight: any,
    walkWeight: any,
    runWeight: any,
    actions: AnimationAction[],
    settings: any,
    singleStepMode: boolean,
    sizeOfNextStep: number,
  }>({ crossFadeControls: [] } as any);
  let { controls, panel, scene, renderer, camera, model, skeleton, mixer, clock, crossFadeControls, idleAction, walkAction, runAction, idleWeight, walkWeight, runWeight, actions, settings, singleStepMode, sizeOfNextStep } = modolRef.current;

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      console.log('组件销毁')
      panel.destroy();
      scene.clear();
      model.clear();
    }
  }, []);

  function loadModel() {

    const canvas = document.querySelector('#three') as HTMLCanvasElement;
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000); /* 透视摄像机 */
    camera.position.set(1, 4, -3);
    camera.lookAt(0, 1, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50); /* 雾 */

    const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
    scene.add(axesHelper);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444); /* 半球光-光源直接放置于场景之上、光照颜色从天空光线颜色渐变到地面光线颜色 */
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff); /* 平行光 */
    dirLight.position.set(- 3, 10, - 10); /* 平行光源位置 */
    dirLight.castShadow = true; /* 是否产生动态阴影 */
    dirLight.shadow.camera.top = 2; /* 指定摄像机视锥体的上侧面 */
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;/* 指定摄像机视锥体近端面 */
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    // scene.add(new THREE.CameraHelper(dirLight.shadow.camera)); /* 人物投影辅助线条 */

    // 地面
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000), /* 一个用于生成平面几何体的类 */
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }) /* 具有镜面高光的光泽表面的材质;depthWrite-渲染此材质是否对深度缓冲区有任何影响 */
    );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true; /* 材质是否接受阴影 */
    scene.add(mesh);

    const loader = new GLTFLoader();
    loader.load('/glbs/soldier/Soldier.glb', (gltf) => {
      console.log(gltf)
      model = gltf.scene;
      scene.add(model);

      model.traverse((object: any) => {
        if (object.isMesh) object.castShadow = true;
      });


      skeleton = new THREE.SkeletonHelper(model); /* 用来模拟骨骼Skeleton的辅助对象。该辅助对象使用LineBasicMaterial材质 */
      skeleton.visible = false; /* 是否显示该辅助对象 */
      scene.add(skeleton);

      createPanel();

      const animations = gltf.animations;

      mixer = new THREE.AnimationMixer(model); /* 动画混合器 */

      idleAction = mixer.clipAction(animations[0]);
      walkAction = mixer.clipAction(animations[3]);
      runAction = mixer.clipAction(animations[1]);

      actions = [idleAction, walkAction, runAction];

      activateAllActions();

      animate();

    }, xhr => {
      console.log(xhr.loaded, xhr.total)
      // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    }, err => {
      console.log('an error happened')
    });

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding; /* 定义渲染器的输出编码 */
    renderer.shadowMap.enabled = true; /* 允许在场景中使用阴影贴图 */

    /* controls */
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update(); /* must be called after any manual changes to the camera's transform */
    controls.enablePan = false; /* 禁止右键拖拽 */
    controls.enableDamping = true; /* 阻尼效果 */

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    })

  }

  function activateAllActions() {
    setWeight(idleAction, settings['调整闲散重力']);
    setWeight(walkAction, settings['调整步行重力']);
    setWeight(runAction, settings['调整跑步重力']);
    actions.forEach(action => action.play());
  }

  function updateWeightSliders() {
    settings['调整闲散重力'] = idleWeight;
    settings['调整步行重力'] = walkWeight;
    settings['调整跑步重力'] = runWeight;
  }

  function updateCrossFadeControls() {
    crossFadeControls.forEach(function (control: any) {
      control.setDisabled();
    });

    if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
      (crossFadeControls[1] as any).setEnabled();
    }

    if (idleWeight === 0 && walkWeight === 1 && runWeight === 0) {
      (crossFadeControls[0] as any).setEnabled();
      (crossFadeControls[2] as any).setEnabled();
    }

    if (idleWeight === 0 && walkWeight === 0 && runWeight === 1) {
      (crossFadeControls[3] as any).setEnabled();
    }

  }

  function animate() {
    requestAnimationFrame(animate); /* 周期性执行渲染函数 */

    idleWeight = idleAction.getEffectiveWeight(); /* 返回影响权重(考虑当前淡入淡出状态和enabled的值). */
    walkWeight = walkAction.getEffectiveWeight();
    runWeight = runAction.getEffectiveWeight();

    updateWeightSliders();
    updateCrossFadeControls();

    let delta = clock.getDelta(); /* 获取前后两次执行该方法的时间间隔 */

    if (singleStepMode) {
      delta = sizeOfNextStep;
      sizeOfNextStep = 0;
    }
    controls.update();
    mixer.update(delta); /* 推进混合器时间并更新动画，传入按照混合器的时间比例缩放过的clock.getDelta */
    renderer.render(scene, camera); /* 使用渲染器和相机进行渲染；渲染出来一帧图像 */

  }

  /* 创建GUI控制面板 */
  function createPanel() {
    dat.GUI.TEXT_CLOSED = '关闭Controls';
    dat.GUI.TEXT_OPEN = '打开Controls';
    panel = new dat.GUI({ width: 310 });

    const folder1 = panel.addFolder('显示与隐藏');
    const folder2 = panel.addFolder('激活/停止');
    const folder3 = panel.addFolder('暂停/步骤');
    const folder4 = panel.addFolder('淡入淡出');
    const folder5 = panel.addFolder('调整重力');
    const folder6 = panel.addFolder('综合速度');

    settings = {
      '展示模型': true,
      '展示骨骼': false,
      '停止所有动画': () => {
        actions.forEach(action => action.stop());
      },
      '激活所有动画': () => {
        setWeight(idleAction, settings['调整闲散重力']);
        setWeight(walkAction, settings['调整步行重力']);
        setWeight(runAction, settings['调整跑步重力']);
        activateAllActions();
      },
      '暂停/继续': () => {
        if (singleStepMode) {
          singleStepMode = false;
          actions.forEach(action => action.paused = false);
        } else {
          if (idleAction.paused) {
            actions.forEach(action => action.paused = false);
          } else {
            actions.forEach(action => action.paused = true);
          }
        }
      },
      '仅走一步': () => {
        actions.forEach(action => action.paused = false);
        singleStepMode = true;
        sizeOfNextStep = settings['调整步伐大小']
      },
      '调整步伐大小': 0.05,
      '从步行到闲散': () => {
        prepareCrossFade(walkAction, idleAction, 1.0);
      },
      '从闲散到步行': () => { prepareCrossFade(idleAction, walkAction, 1.0) },
      '从步行到跑': () => { prepareCrossFade(walkAction, runAction, 1.0) },
      '从跑到步行': () => { prepareCrossFade(runAction, walkAction, 1.0) },
      '使用默认持续时间': true,
      '设置自定义持续时间': 3.5,
      '调整闲散重力': 0.0,
      '调整步行重力': 1.0,
      '调整跑步重力': 0.0,
      '调整时间比例': 1.0
    };

    folder1.add(settings, '展示模型').onChange(e => {
      model.visible = e;
    });
    folder1.add(settings, '展示骨骼').onChange(e => {
      skeleton.visible = e;
    });
    folder2.add(settings, '停止所有动画');
    folder2.add(settings, '激活所有动画');
    folder3.add(settings, '暂停/继续');
    folder3.add(settings, '仅走一步');
    folder3.add(settings, '调整步伐大小', 0.01, 0.1, 0.001);
    crossFadeControls.push(folder4.add(settings, '从步行到闲散'));
    crossFadeControls.push(folder4.add(settings, '从闲散到步行'));
    crossFadeControls.push(folder4.add(settings, '从步行到跑'));
    crossFadeControls.push(folder4.add(settings, '从跑到步行'));
    folder4.add(settings, '使用默认持续时间');
    folder4.add(settings, '设置自定义持续时间', 0, 10, 0.01);
    folder5.add(settings, '调整闲散重力', 0.0, 1.0, 0.01).listen().onChange((weight) => {
      setWeight(idleAction, weight);
    });
    folder5.add(settings, '调整步行重力', 0.0, 1.0, 0.01).listen().onChange((weight) => {
      setWeight(walkAction, weight);
    });
    folder5.add(settings, '调整跑步重力', 0.0, 1.0, 0.01).listen().onChange((weight) => {
      setWeight(runAction, weight);

    });
    folder6.add(settings, '调整时间比例', 0.0, 1.5, 0.01).onChange(e => {
      mixer.timeScale = e; /* 全局时间的比例因子 */
    });
    folder1.open();
    folder2.open();
    folder3.open();
    folder4.open();
    folder5.open();
    folder6.open();

    crossFadeControls.forEach((control: any) => {
      control.classList1 = control.domElement.parentElement.parentElement.classList;
      control.classList2 = control.domElement.previousElementSibling.classList; /* 相同层级的前一个兄弟元素 */

      control.setDisabled = function () {
        control.classList1.add('no-pointer-events');
        control.classList2.add('control-disabled');
      };

      control.setEnabled = function () {
        control.classList1.remove('no-pointer-events');
        control.classList2.remove('control-disabled');
      };
    })
  }

  function prepareCrossFade(action: THREE.AnimationAction, targetAction: THREE.AnimationAction, duration: number) {
    const dur = setCrossFadeDuration(duration);
    singleStepMode = false;
    actions.forEach(action => action.paused = false);

    /* 如果当前动画是闲散，则立即开始过度；否则需要等当前动作完成现在的循环再进行过渡 */
    if (action === idleAction) {
      executeCrossFade(action, targetAction, dur);
    } else {
      synchronizeCrossFade(action, targetAction, dur);
    }
  }

  function synchronizeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
    mixer.addEventListener('loop', onLoopFinished);
    function onLoopFinished(event) {
      if (event.action === startAction) {
        mixer.removeEventListener('loop', onLoopFinished);
        executeCrossFade(startAction, endAction, duration);
      }
    }
  }

  /* 获取持续时间duration */
  function setCrossFadeDuration(defaultDuration: number) {
    if (settings['使用默认持续时间']) {
      return defaultDuration;
    } else {
      return settings['设置自定义持续时间'];
    }
  }

  function executeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
    setWeight(endAction, 1);
    endAction.time = 0; /* endAction开始的时间点 */
    startAction.crossFadeTo(endAction, duration, true); /* 在duration时间内，让此动作淡出，同时让endAction淡入， true-额外的warping(时间比例的渐变)将被应用 */
  }

  function setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true;
    action.setEffectiveTimeScale(1); /* 设置时间比例 */
    action.setEffectiveWeight(weight); /* 设置weight以及停止所有淡入淡出 */
  }

  return (
    <canvas id="three"></canvas>
  );
}