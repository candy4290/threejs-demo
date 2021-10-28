import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import * as dat from 'dat.gui';

let line, renderer, scene, camera, camera2, controls;
let line1;
let matLine, matLineBasic, matLineDashed;
let gui;

// viewport
let insetWidth;
let insetHeight;
export default function LinesFat() {
    const canvasRef = useRef<HTMLCanvasElement>(null); /* canvas */


    useEffect(() => {
        init();
        initGui();
        animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        if (canvasRef.current) {
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0.0);
            renderer.setSize(window.innerWidth, window.innerHeight);

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
            camera.position.set(- 40, 0, 60);

            camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000);
            camera2.position.copy(camera.position);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.minDistance = 10;
            controls.maxDistance = 500;

            const positions: number[] = [];
            const colors: number[] = [];

            const points = GeometryUtils.hilbert3D(new THREE.Vector3(0, 0, 0), 20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);

            const spline = new THREE.CatmullRomCurve3(points);
            const divisions = Math.round(12 * points.length);
            const point = new THREE.Vector3();
            const color = new THREE.Color();

            for (let i = 0, l = divisions; i < l; i++) {

                const t = i / l;

                spline.getPoint(t, point);
                positions.push(point.x, point.y, point.z);

                color.setHSL(t, 1.0, 0.5);
                colors.push(color.r, color.g, color.b);

            }

            const geometry = new LineGeometry();
            geometry.setPositions(positions);
            geometry.setColors(colors);

            matLine = new LineMaterial({

                color: 0xffffff,
                linewidth: 5, // in pixels
                vertexColors: true,
                //resolution:  // to be set by renderer, eventually
                dashed: false,
                alphaToCoverage: true,
            });

            line = new Line2(geometry, matLine);
            line.computeLineDistances();
            line.scale.set(1, 1, 1);
            scene.add(line);


            // THREE.Line ( THREE.BufferGeometry, THREE.LineBasicMaterial ) - rendered with gl.LINE_STRIP

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            matLineBasic = new THREE.LineBasicMaterial({ vertexColors: true });
            matLineDashed = new THREE.LineDashedMaterial({ vertexColors: true, scale: 2, dashSize: 1, gapSize: 1 });

            line1 = new THREE.Line(geo, matLineBasic);
            line1.computeLineDistances();
            line1.visible = false;
            scene.add(line1);

            window.addEventListener('resize', onWindowResize);
            onWindowResize();


            // gpuPanel = new GPUStatsPanel( renderer.getContext() );
            // stats.addPanel( gpuPanel );
            // stats.showPanel( 0 );

            // initGui();
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

        insetWidth = window.innerHeight / 4; // square
        insetHeight = window.innerHeight / 4;

        camera2.aspect = insetWidth / insetHeight;
        camera2.updateProjectionMatrix();
    }


    function animate() {

        requestAnimationFrame(animate);
        // main scene

        renderer.setClearColor(0x000000, 0);

        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

        // renderer will set this eventually
        matLine.resolution.set(window.innerWidth, window.innerHeight); // resolution of the viewport

        renderer.render(scene, camera);

        // inset scene

        renderer.setClearColor(0x222222, 1);

        renderer.clearDepth(); // important!

        renderer.setScissorTest(true); /* 启用剪裁检测 */

        renderer.setScissor(20, 20, insetWidth, insetHeight);

        renderer.setViewport(20, 20, insetWidth, insetHeight);

        camera2.position.copy(camera.position);
        camera2.quaternion.copy(camera.quaternion);

        // renderer will set this eventually
        matLine.resolution.set(insetWidth, insetHeight); // resolution of the inset viewport

        renderer.render(scene, camera2);

        renderer.setScissorTest(false)

    }

    function initGui() {
        gui = new dat.GUI();
        const param = {
            'line type': 0,
            'width (px)': 5,
            'alphaToCoverage': true,
            'dashed': false,
            'dash scale': 1,
            'dash / gap': 1
        };
        gui.add(param, 'line type', { 'LineGeometry': 0, 'gl.LINE': 1 }).onChange(val => {
            switch (val) {
                case '0':
                    line.visible = true;
                    line1.visible = false;
                    break;
                case '1':
                    line.visible = false;
                    line1.visible = true;
                    break;
            }
        });

        gui.add(param, 'width (px)', 1, 10).onChange(val => {
            matLine.linewidth = val;
        });

        gui.add(param, 'alphaToCoverage').onChange(val => {
            matLine.alphaToCoverage = val;
        });

        gui.add(param, 'dashed').onChange(val => {
            matLine.dashed = val;
            line1.material = val ? matLineDashed : matLineBasic;
        });

        gui.add(param, 'dash scale', 0.5, 2, 0.1).onChange(val => {
            matLine.dashScale = val;
            matLineDashed.scale = val;
        });

        gui.add(param, 'dash / gap', { '2 : 1': 0, '1 : 1': 1, '1 : 2': 2 }).onChange(val => {
            switch (val) {
                case '0':
                    matLine.dashSize = 2;
                    matLine.gapSize = 1;

                    matLineDashed.dashSize = 2;
                    matLineDashed.gapSize = 1;
                    break;
                case '1':
                    matLine.dashSize = 1;
                    matLine.gapSize = 1;

                    matLineDashed.dashSize = 1;
                    matLineDashed.gapSize = 1;
                    break;
                case '2':
                    matLine.dashSize = 1;
                    matLine.gapSize = 2;

                    matLineDashed.dashSize = 1;
                    matLineDashed.gapSize = 2;
                    break;
            }
        });
    }

    return (
        <>
            <canvas id="three" ref={canvasRef}></canvas>
        </>
    )
}