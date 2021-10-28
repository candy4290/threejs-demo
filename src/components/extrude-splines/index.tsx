import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { Curves } from 'three/examples/jsm/curves/CurveExtras';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

const direction = new THREE.Vector3();
const binormal = new THREE.Vector3();
const normal = new THREE.Vector3();
const position = new THREE.Vector3();
const lookAt = new THREE.Vector3();

const pipeSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 10, - 10), new THREE.Vector3(10, 0, - 10),
    new THREE.Vector3(20, 0, 0), new THREE.Vector3(30, 0, 10),
    new THREE.Vector3(30, 0, 20), new THREE.Vector3(20, 0, 30),
    new THREE.Vector3(10, 0, 30), new THREE.Vector3(0, 0, 30),
    new THREE.Vector3(- 10, 10, 30), new THREE.Vector3(- 10, 20, 30),
    new THREE.Vector3(0, 30, 30), new THREE.Vector3(10, 30, 30),
    new THREE.Vector3(20, 30, 15), new THREE.Vector3(10, 30, 10),
    new THREE.Vector3(0, 30, 10), new THREE.Vector3(- 10, 20, 10),
    new THREE.Vector3(- 10, 10, 10), new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(10, - 10, 10), new THREE.Vector3(20, - 15, 10),
    new THREE.Vector3(30, - 15, 10), new THREE.Vector3(40, - 15, 10),
    new THREE.Vector3(50, - 15, 10), new THREE.Vector3(60, 0, 10),
    new THREE.Vector3(70, 0, 0), new THREE.Vector3(80, 0, 0),
    new THREE.Vector3(90, 0, 0), new THREE.Vector3(100, 0, 0)
]);

const sampleClosedSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, - 40, - 40),
    new THREE.Vector3(0, 40, - 40),
    new THREE.Vector3(0, 140, - 40),
    new THREE.Vector3(0, 40, 40),
    new THREE.Vector3(0, - 40, 40)
]);

sampleClosedSpline['curveType'] = 'catmullrom';
sampleClosedSpline['closed'] = true;

// Keep a dictionary of Curve instances
const splines = {
    GrannyKnot: new Curves.GrannyKnot(),
    HeartCurve: new Curves.HeartCurve(3.5),
    VivianiCurve: new Curves.VivianiCurve(70),
    KnotCurve: new Curves.KnotCurve(),
    HelixCurve: new Curves.HelixCurve(),
    TrefoilKnot: new Curves.TrefoilKnot(),
    TorusKnot: new Curves.TorusKnot(20),
    CinquefoilKnot: new Curves.CinquefoilKnot(20),
    TrefoilPolynomialKnot: new Curves.TrefoilPolynomialKnot(14),
    FigureEightPolynomialKnot: new Curves.FigureEightPolynomialKnot(),
    DecoratedTorusKnot4a: new Curves.DecoratedTorusKnot4a(),
    DecoratedTorusKnot4b: new Curves.DecoratedTorusKnot4b(),
    DecoratedTorusKnot5a: new Curves.DecoratedTorusKnot5a(),
    DecoratedTorusKnot5c: new Curves.DecoratedTorusKnot5c(),
    PipeSpline: pipeSpline,
    SampleClosedSpline: sampleClosedSpline
};

const params = {
    spline: 'GrannyKnot',
    scale: 4,
    extrusionSegments: 100,
    radiusSegments: 3,
    closed: true,
    animationView: false,
    lookAhead: false,
    cameraHelper: false,
};

const material = new THREE.MeshLambertMaterial({ color: 0xff00ff });

const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.3, wireframe: true, transparent: true });
export default function ExtrudeSplines() {
    const threeRef = useRef<{
        camera: THREE.PerspectiveCamera,
        splineCamera: THREE.PerspectiveCamera,
        cameraHelper: THREE.CameraHelper,
        scene: THREE.Scene,
        parent: THREE.Object3D,
        cameraEye: THREE.Mesh,
        tubeGeometry: THREE.TubeGeometry,
        renderer: THREE.WebGLRenderer,
        gui: dat.GUI,
        mesh: THREE.Mesh
    }>({} as any);
    let { camera, splineCamera, cameraHelper, scene, parent, cameraEye, renderer, gui, tubeGeometry, mesh } = threeRef.current;
    const canvasRef = useRef<HTMLCanvasElement>(null); /* 文本搜索框 */

    useEffect(() => {
        init();
        animate();
    }, []);

    function init() {
        camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 10000);
        camera.position.set(0, 50, 500);
        
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        const abl = new THREE.AmbientLight(0xffffff);
        scene.add(abl);

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, 0, 1);
        scene.add(light);

        parent = new THREE.Object3D(); /* 放置辅助摄像机及其辅助线 */
        scene.add(parent);

        splineCamera = new THREE.PerspectiveCamera(84, window.innerWidth / window.innerHeight, 0.01, 1000);
        parent.add(splineCamera);

        cameraHelper = new THREE.CameraHelper(splineCamera);
        scene.add(cameraHelper);

        addTube();

        // debug camera
        cameraEye = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshBasicMaterial({ color: 0xdddddd }));
        parent.add(cameraEye);

        animateCamera();

        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
        }
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        createGUI();

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 100;
        controls.maxDistance = 2000;

        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function createGUI() {
        gui = new dat.GUI();
        const folderGeometry = gui.addFolder('Geometry');
        folderGeometry.add(params, 'spline', Object.keys(splines)).onChange(() => addTube());
        folderGeometry.add(params, 'scale', 2, 10).step(2).onChange(() => setScale());
        folderGeometry.add(params, 'extrusionSegments', 50, 500).step(50).onChange(() => addTube());
        folderGeometry.add(params, 'radiusSegments', 2, 12).step(1).onChange(() => addTube());
        folderGeometry.add(params, 'closed').onChange(() => addTube());
        folderGeometry.open();

        const folderCamera = gui.addFolder('Camera');
        folderCamera.add(params, 'animationView').onChange(() => animateCamera());
        folderCamera.add(params, 'lookAhead').onChange(() => animateCamera());
        folderCamera.add(params, 'cameraHelper').onChange(() => animateCamera());
        folderCamera.open();
    }

    function animateCamera() {
        cameraHelper.visible = params.cameraHelper;
        cameraEye.visible = params.cameraHelper;
    }

    function addTube() {
        if (mesh !== undefined) {
            parent.remove(mesh);
            mesh.geometry.dispose();
        }
        const extrudePath = splines[params.spline];
        tubeGeometry = new THREE.TubeGeometry(extrudePath, params.extrusionSegments, 2, params.radiusSegments, params.closed); /* 沿着3维曲线延伸的管道 */
        console.log(tubeGeometry.tangents)
        addGeometry(tubeGeometry);
        setScale();
    }

    function setScale() {
        mesh.scale.set(params.scale, params.scale, params.scale);
    }

    function addGeometry(geometry) {
        // 3D shape
        mesh = new THREE.Mesh(geometry, material);
        const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
        mesh.add(wireframe);
        parent.add(mesh);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        // animate camera along spline

        const time = Date.now();
        const looptime = 20 * 1000;
        const t = (time % looptime) / looptime;

        tubeGeometry.parameters.path.getPointAt(t, position);
        position.multiplyScalar(params.scale);

        // interpolation

        const segments = tubeGeometry.tangents.length; /* 切线数组长度 */
        const pickt = t * segments; 
        const pick = Math.floor(pickt); /* 当前切线索引 */
        const pickNext = (pick + 1) % segments; /* 下一个位置的切线索引 */
        // console.log('pick:' + pick, 'pickNext:' + pickNext)

        binormal.subVectors(tubeGeometry.binormals[pickNext], tubeGeometry.binormals[pick]); /* binormals-次法线；得到pcik次法线指向pickNext次法线 */
        binormal.multiplyScalar(pickt - pick).add(tubeGeometry.binormals[pick]); /* TODO：没看懂 */

        tubeGeometry.parameters.path.getTangentAt(t, direction); /* 获取当前进度位置的切线-赋值给direction */
        const offset = 15;

        normal.copy(binormal).cross(direction); /* 叉积 */

        // we move on a offset on its binormal

        position.add(normal.clone().multiplyScalar(offset));

        splineCamera.position.copy(position);
        cameraEye.position.copy(position);

        // using arclength for stablization in look ahead

        tubeGeometry.parameters.path.getPointAt((t + 30 / tubeGeometry.parameters.path.getLength()) % 1, lookAt);
        lookAt.multiplyScalar(params.scale);

        // camera orientation 2 - up orientation via normal

        if (!params.lookAhead) lookAt.copy(position).add(direction);
        splineCamera.matrix.lookAt(splineCamera.position, lookAt, normal);
        splineCamera.quaternion.setFromRotationMatrix(splineCamera.matrix);

        cameraHelper.update();

        renderer.render(scene, params.animationView === true ? splineCamera : camera);
    }
    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}