import { useEffect } from "react"
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as dat from 'dat.gui';

/**
 * 画线---three.js
 *
 * @export
 * @return {*} 
 */
let scene, camera, renderer: THREE.WebGLRenderer;
const splineHelperObjects: any[] = [];
let splinePointsLength = 4;
let transformControl;

const ARC_SEGMENTS = 200;

const splines = {};
const positions: any[] = [];
const point = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

/* up与down的位置，用来判断是否发生移动 */
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();

const geometry = new THREE.BoxGeometry(20, 20, 20);

const params = {
    uniform: true,
    tension: 0.5,
    centripetal: true,
    chordal: true,
    addPoint: () => { },
    removePoint: () => { },
};

export default function DrawLine() {
    useEffect(() => {
        init();
    }, [])
    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(0, 250, 1000);
        scene.add(camera);
        scene.add(new THREE.AmbientLight(0xf0f0f0));
        const light = new THREE.SpotLight(0xffffff, 1.5);
        light.position.set(0, 1500, 200);
        light.angle = Math.PI * 0.2;
        light.castShadow = true;
        light.shadow.camera.near = 200;
        light.shadow.camera.far = 2000;
        light.shadow.bias = - 0.000222;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        scene.add(light);

        const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
        planeGeometry.rotateX(- Math.PI / 2);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });

        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = - 200;
        plane.receiveShadow = true;
        scene.add(plane);

        const helper = new THREE.GridHelper(2000, 100);
        helper.position.y = - 199;
        helper.material['opacity'] = 0.25;
        helper.material['transparent'] = true;
        scene.add(helper);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        const gui = new dat.GUI();
        gui.add(params, 'uniform');
        gui.add(params, 'tension', 0, 1).step(0.01).onChange(function (value) {
            splines['uniform'].tension = value;
            updateSplineOutline();
        });
        gui.add(params, 'addPoint');
        gui.add(params, 'removePoint');
        gui.open();

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.dampingFactor = 0.2;

        transformControl = new TransformControls(camera, renderer.domElement);
        transformControl.addEventListener('dragging-changed', function (event) {
            controls.enabled = !event.value;
        });
        scene.add(transformControl);

        transformControl.addEventListener('objectChange', function () {
            updateSplineOutline();
        });

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointermove', onPointerMove);

        for (let i = 0; i < splinePointsLength; i++) {
            addSplineObject(positions[i]);
        }

        positions.length = 0;

        for (let i = 0; i < splinePointsLength; i++) {
            positions.push(splineHelperObjects[i].position);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3));

        let curve = new THREE.CatmullRomCurve3(positions);
        curve['curveType'] = 'catmullrom';
        curve['mesh'] = new THREE.Line(geometry.clone(), new THREE.LineBasicMaterial({
            color: 0xff0000,
            opacity: 0.35
        }));
        curve['mesh'].castShadow = true;
        splines['uniform'] = curve;

        for (const k in splines) {
            const spline = splines[k];
            scene.add(spline.mesh);
        }
        
        load( [ new THREE.Vector3( 289.76843686945404, 452.51481137238443, 56.10018915737797 ),
            new THREE.Vector3( - 53.56300074753207, 171.49711742836848, - 14.495472686253045 ),
            new THREE.Vector3( - 91.40118730204415, 176.4306956436485, - 6.958271935582161 ),
            new THREE.Vector3( - 383.785318791128, 491.1365363371675, 47.869296953772746 ) ] );

        animate();
    }

    function load( new_positions ) {
        while ( new_positions.length > positions.length ) {
            // addPoint();
        }

        while ( new_positions.length < positions.length ) {
            // removePoint();
        }

        for ( let i = 0; i < positions.length; i ++ ) {
            positions[ i ].copy( new_positions[ i ] );
        }

        updateSplineOutline();

    }

    function addSplineObject(position) {
        const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        const object = new THREE.Mesh(geometry, material);
        if (position) {
            object.position.copy(position);
        } else {
            object.position.x = Math.random() * 1000 - 500;
            object.position.y = Math.random() * 600;
            object.position.z = Math.random() * 800 - 400;
        }
        object.castShadow = true;
        object.receiveShadow = true;
        scene.add(object);
        splineHelperObjects.push(object);
        return object;
    }

    function updateSplineOutline() {
        for (const k in splines) {
            const spline = splines[k];
            const splineMesh = spline.mesh;
            const position = splineMesh.geometry.attributes.position;
            console.log(position)
            for (let i = 0; i < ARC_SEGMENTS; i++) {
                const t = i / (ARC_SEGMENTS - 1);
                spline.getPoint(t, point);
                position.setXYZ(i, point.x, point.y, point.z);
            }
            position.needsUpdate = true;
        }
    }

    function onPointerDown(event) {
        onDownPosition.x = event.clientX;
        onDownPosition.y = event.clientY;
    }

    function onPointerUp(event) {
        onUpPosition.x = event.clientX;
        onUpPosition.y = event.clientY;
        if (onDownPosition.distanceTo(onUpPosition) === 0) transformControl.detach(); /* 点击-且没有移动，则将拖拽工具隐藏 */
    }

    function onPointerMove(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(splineHelperObjects);
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object !== transformControl.object) {
                transformControl.attach(object); /* 设置应当变换的3d对象----出现拖拽工具 */
            }
        }
    }

    function animate() {

        requestAnimationFrame( animate );
        render();

    }

    function render() {
        splines['uniform'].mesh.visible = params.uniform;
        renderer.render( scene, camera );
    }
    return (
        <canvas id="three"></canvas>
    )
}