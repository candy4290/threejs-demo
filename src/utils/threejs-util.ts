import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

/**
  * 呼吸灯效果-物体轮廓发光效果
 *
 * @export
 * @param {THREE.WebGLRenderer} renderer 渲染器
 * @param {THREE.Scene} scene 场景
 * @param {THREE.Camera} camera 相机
 * @param {number} [edgeStrength=3] 粗
 * @param {number} [edgeGlow=1] 发光
 * @param {number} [edgeThickness=2] 光晕粗
 * @param {number} [pulsePeriod=5] 闪烁
 * @param {boolean} [usePatternTexture=false] 是否使用皮肤
 * @param {string} [visibleEdgeColor='#bb9246']
 * @param {string} [hiddenEdgeColor='#190a05']
 * @return {*}  {{composer: EffectComposer, outlinePass: OutlinePass}}
 */
export function createOutLine(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    edgeStrength: number = 3,
    edgeGlow: number = 1,
    edgeThickness: number = 2,
    pulsePeriod: number = 5,
    usePatternTexture: boolean = false,
    visibleEdgeColor: string = '#bb9246',
    hiddenEdgeColor: string = '#190a05'
): {composer: EffectComposer, outlinePass: OutlinePass} {
    let selectedObjects: any[] = [];
    const mouse = new THREE.Vector2();
    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
    })); /* 用于在Three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。 */
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new RenderPass(scene, camera); /* RenderPass是合成器过程链中的一个过程，它绘制我们的场景和物体，就像它们通常在我们的渲染器中绘制的那样，没有任何影响。这通常是添加到合成器的第一个过程。RenderPass有两个参数，同调用render一样，参数是scene和camera对象。 */
    composer.addPass(renderPass); /* 添加过程 */

    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeStrength = edgeStrength; /* 粗 */
    outlinePass.edgeGlow = edgeGlow; /* 发光 */
    outlinePass.edgeThickness = edgeThickness; /* 光晕粗 */
    outlinePass.pulsePeriod = pulsePeriod; /* 闪烁 */
    outlinePass.usePatternTexture = usePatternTexture; /* 是否使用皮肤 */
    outlinePass.visibleEdgeColor.set(visibleEdgeColor);
    outlinePass.hiddenEdgeColor.set(hiddenEdgeColor);
    composer.addPass(outlinePass);

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
        const raycaster = new THREE.Raycaster();
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

    return {
        composer, outlinePass
    }
}