import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Camera() {
    const modalRef = useRef<{
        frustumSize: number,
        aspect: number,
        SCREEN_WIDTH: number,
        SCREEN_HEIGHT: number,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        cameraPerspective: THREE.PerspectiveCamera,
        cameraPerspectiveHelper: THREE.CameraHelper,
        cameraOrtho: THREE.OrthographicCamera,
        cameraOrthoHelper: THREE.CameraHelper,
        activeCamera: any,
        activeHelper: any,
        cameraRig: THREE.Group,
        mesh: THREE.Mesh,
        renderer: THREE.WebGLRenderer
    }>({
        frustumSize: 600,
        SCREEN_WIDTH: window.innerWidth,
        SCREEN_HEIGHT: window.innerHeight,
        aspect: window.innerWidth / window.innerHeight
    } as any);
    let { frustumSize, aspect, SCREEN_WIDTH, SCREEN_HEIGHT, scene, camera, cameraPerspective, cameraPerspectiveHelper, cameraOrtho, cameraOrthoHelper
        , activeCamera, activeHelper, cameraRig, mesh, renderer } = modalRef.current;
    useEffect(() => {
        init();
        animate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(50, 0.5 * aspect, 1, 10000);
        camera.position.z = 2500;

        cameraPerspective = new THREE.PerspectiveCamera(50, 0.5 * aspect, 150, 1000);
        cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
        scene.add(cameraPerspectiveHelper);

        cameraOrtho = new THREE.OrthographicCamera(0.5 * frustumSize * aspect / - 2, 0.5 * frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 150, 1000); /* 正交相机 */
        cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);
        scene.add(cameraOrthoHelper);

        activeCamera = cameraPerspective;
        activeHelper = cameraPerspectiveHelper;

        cameraOrtho.rotation.y = Math.PI;
        cameraPerspective.rotation.y = Math.PI;

        cameraRig = new THREE.Group();
        cameraRig.add(cameraPerspective);
        cameraRig.add(cameraOrtho);
        scene.add(cameraRig);

        mesh = new THREE.Mesh(
            new THREE.SphereGeometry(100, 16, 8), /* 一个用于生成球体的类 */
            new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }) /* 此材质不受光照影响 wireframe-将几何体渲染为线框 */
        );
        scene.add(mesh);

        const mesh2 = new THREE.Mesh(
            new THREE.SphereGeometry(50, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
        );
        mesh2.position.y = 150;
        mesh.add(mesh2);

        const mesh3 = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 8),
            new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
        );
        mesh3.position.z = 150;
        cameraRig.add(mesh3);

        //

        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];

        for (let i = 0; i < 10000; i++) {
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
            vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x888888 }));
        scene.add(particles);

        //
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.autoClear = false; /* 定义渲染器是否在渲染每一帧之前自动清除其输出。 */

        window.addEventListener('resize', onWindowResize);
        document.addEventListener('keydown', onKeyDown);
    }

    function onKeyDown(event) {
        switch (event.keyCode) {
            case 79: /*O*/
                activeCamera = cameraOrtho;
                activeHelper = cameraOrthoHelper;
                break;
            case 80: /*P*/
                activeCamera = cameraPerspective;
                activeHelper = cameraPerspectiveHelper;
                break;
        }
    }

    //

    function onWindowResize() {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        camera.aspect = 0.5 * aspect;
        camera.updateProjectionMatrix();

        cameraPerspective.aspect = 0.5 * aspect;
        cameraPerspective.updateProjectionMatrix();

        cameraOrtho.left = - 0.5 * frustumSize * aspect / 2;
        cameraOrtho.right = 0.5 * frustumSize * aspect / 2;
        cameraOrtho.top = frustumSize / 2;
        cameraOrtho.bottom = - frustumSize / 2;
        cameraOrtho.updateProjectionMatrix();
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {

        const r = Date.now() * 0.0005;

        mesh.position.x = 700 * Math.cos(r);
        mesh.position.z = 700 * Math.sin(r);
        mesh.position.y = 700 * Math.sin(r);

        mesh.children[0].position.x = 70 * Math.cos(2 * r);
        mesh.children[0].position.z = 70 * Math.sin(r);

        if (activeCamera === cameraPerspective) {

            cameraPerspective.fov = 35 + 30 * Math.sin(0.5 * r);
            cameraPerspective.far = mesh.position.length();
            cameraPerspective.updateProjectionMatrix();

            cameraPerspectiveHelper.update();
            cameraPerspectiveHelper.visible = true;

            cameraOrthoHelper.visible = false;

        } else {

            cameraOrtho.far = mesh.position.length();
            cameraOrtho.updateProjectionMatrix();

            cameraOrthoHelper.update();
            cameraOrthoHelper.visible = true;

            cameraPerspectiveHelper.visible = false;

        }

        cameraRig.lookAt(mesh.position);

        renderer.clear();

        activeHelper.visible = false;

        renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
        renderer.render(scene, activeCamera);

        activeHelper.visible = true;

        renderer.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
        renderer.render(scene, camera);

    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}