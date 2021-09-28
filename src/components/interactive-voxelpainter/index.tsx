import { useEffect } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * 交互
 *
 * @export
 * @return {*} 
 */
export default function InteractiveVoxelpainter() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        let isShiftDown = false;
        const objects: THREE.Object3D[] = [];
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000); /* 透视相机 */
        camera.position.set(500, 800, 1300);
        camera.lookAt(0, 0, 0);

        const scene = new THREE.Scene(); /* 创建场景 */
        scene.background = new THREE.Color(0xf0f0f0);

        const axesHelper = new THREE.AxesHelper(1000); /* 辅助坐标轴，z-蓝色 x-红色 y-绿色 */
        // axesHelper.rotation.y -= 0.01; /* 坐标轴旋转 */
        scene.add(axesHelper);

        // const helper = new THREE.CameraHelper(camera); /* 模拟相机视锥体的辅助对象 */
        // scene.add(helper);

        const rollOverGeo = new THREE.BoxGeometry(50, 50, 50); /* 立方体 */
        const rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: .5, transparent: true }); /* 一个以简单着色（平面或线框）方式来绘制几何体的材质，此材质不受光照的影响 */
        const rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial); /* 物体的类 */
        rollOverMesh.position.set(25, 25, 25);
        scene.add(rollOverMesh);

        const cubeGeo = new THREE.BoxGeometry(50, 50, 50);
        const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xfeb74c, map: new THREE.TextureLoader().load('/textures/square-outline-textured.png') });

        const gridHelper = new THREE.GridHelper(1000, 20); /* 坐标格辅助对象，坐标格实际上是2维线数组 */
        scene.add(gridHelper);

        const raycaster = new THREE.Raycaster(); /* 这个类用于进行raycasting（光线投射）。 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体）。 */
        const pointer = new THREE.Vector2(); /* 表示二维向量的类 */

        const geometry = new THREE.PlaneGeometry(1000, 1000); /* 一个用于生成平面几何体的类 */
        geometry.rotateX(-Math.PI / 2); /* 几何体在x轴上进行旋转 */

        const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false, color: 'yellow' }));
        scene.add(plane);

        objects.push(plane);

        const ambientLight = new THREE.AmbientLight(0x606060); /* 环境光会均匀的照亮场景中的所有物体。 环境光不能用来投射阴影，因为它没有方向。 */
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff); /* 平行光 */
        directionalLight.position.set(1, 0.75, 0.5).normalize(); /* normalize-将向量转换为单位向量 */
        scene.add(directionalLight);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); /* 渲染器 antialias-是否执行抗锯齿 */
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update(); /* must be called after any manual changes to the camera's transform */
        controls.enablePan = false; /* 禁止右键拖拽 */
        controls.enableDamping = true; /* 阻尼效果 */

        window.addEventListener('pointermove', event => { /* 移动位置 */
            pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1); /* 将光标位置的屏幕坐标转换成threejs中的标准坐标（世界坐标） */
            raycaster.setFromCamera(pointer, camera); /* 通过摄像机和鼠标位置更新射线 */
            const intersects = raycaster.intersectObjects(objects); /* 计算物体和射线的焦点 */
            if (intersects.length > 0) {
                const intersect = intersects[0];
                if (intersect.face) {
                    rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
                }
                rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25); /* divideScalar(50)将该向量除以标量50;floor()向量的分量向下取整;multiplyScalar(50)将该向量与标量50进行相乘;addScalar(25)将传入的标量25和这个向量的x y z相加 */
            }
            renderer.render(scene, camera);
        });

        window.addEventListener('pointerdown', event => {
            pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1); /* 将光标位置的屏幕坐标转换成threejs中的标准坐标（世界坐标） */
            raycaster.setFromCamera(pointer, camera); /* 通过摄像机和鼠标位置更新射线 */
            const intersects = raycaster.intersectObjects(objects); /* 计算物体和射线的焦点 */
            if (intersects.length > 0) {
                const intersect = intersects[0];
                if (isShiftDown) {
                    if (intersect.object !== plane) {
                        scene.remove(intersect.object);
                        objects.splice(objects.indexOf(intersect.object), 1);
                    }
                    // create cube

                } else {
                    const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
                    if (intersect.face) {
                        voxel.position.copy(intersect.point).add(intersect.face.normal);
                    }
                    voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
                    scene.add(voxel);
                    objects.push(voxel);
                }
            }
            renderer.render(scene, camera);
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', event => {
            switch (event.keyCode) {
                case 16: isShiftDown = true; break;
            }
        });

        window.addEventListener('keyup', event => {
            switch (event.keyCode) {
                case 16: isShiftDown = false; break;
            }
        });

        renderer.render(scene, camera);

    }

    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}