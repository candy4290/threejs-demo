import { useEffect } from "react";
import axios from "axios";
import * as d3 from 'd3';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import './index.less';

/**
 * 中国地图
 *
 * @export
 * @return {*} 
 */
export default function ChinaMap() {
    useEffect(() => {
        init();
    });
    function init() {
        let provinceInfo = document.querySelector('#provinceInfo') as HTMLElement;

        let activeInstersect: any[] = [];

        const map = new THREE.Object3D();

        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        // 渲染器
        const renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const scene = new THREE.Scene();

        // 相机 透视相机
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); /* 透视相机 */
        camera.position.set(0, -70, 150);
        camera.lookAt(0, 0, 0); // 设置相机对象看向的位置

        /* controls */
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update(); /* must be called after any manual changes to the camera's transform */
        controls.enablePan = false; /* 禁止右键拖拽 */
        controls.enableDamping = true; /* 阻尼效果 */

        const raycaster = new THREE.Raycaster(); /* 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体） */
        const mouse = new THREE.Vector2();
        let eventOffset: any = {};

        function onMouseMove(event: any) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            eventOffset.x = event.clientX;
            eventOffset.y = event.clientY;
            if (provinceInfo) {
                provinceInfo.style.left = eventOffset.x + 2 + 'px';
                provinceInfo.style.top = eventOffset.y + 2 + 'px';
            }
        }

        window.addEventListener('mousemove', onMouseMove, false);

        axios.get('/china.json').then(rsp => {

            const chinaJson = rsp.data;
            const projection = d3.geoMercator().center([104.0, 37.5]).scale(80).translate([0, 0]); /* 墨卡托投影转换 */
            chinaJson.features.forEach((elem: any) => {
                // 定一个省份3D对象
                const province = new THREE.Object3D();
                // 每个的 坐标 数组
                const coordinates = elem.geometry.coordinates;
                // 循环坐标数组
                coordinates.forEach((multiPolygon: any) => {
                    multiPolygon.forEach((polygon: any) => {
                        const shape = new THREE.Shape(); /* 使用路径以及可选的孔洞来定义一个二维形状平面 */
                        const lineMaterial = new THREE.LineBasicMaterial({ /* 一种用于绘制线框样式几何体的材质。 */
                            color: 'white'
                        });
                        const lineGeometry = new THREE.BufferGeometry(); /* 带有一些顶点的结合体 */
                        const points: THREE.Vector3[] = [];
                        for (let i = 0; i < polygon.length; i++) {
                            const temp = projection(polygon[i]);
                            if (temp) {
                                const [x, y] = temp;
                                if (i === 0) {
                                    shape.moveTo(x, -y);
                                }
                                shape.lineTo(x, -y);
                                points.push(new THREE.Vector3(x, -y, 4.01));
                            }
                        }
                        lineGeometry.setFromPoints(points);

                        const extrudeSettings = {
                            depth: 4, /* 挤出的形状的深度，默认值为100。 */
                            bevelEnabled: false /* 对挤出的形状应用是否斜角，默认值为true */
                        };

                        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings); /* 从一个形状路径中，挤压出一个BufferGeometry。 */
                        const material = new THREE.MeshBasicMaterial({ /* 一个以简单着色（平面或线框）方式来绘制几何体的材质。此材质不受光照影响 */
                            color: '#02A1E2', 
                            transparent: true,
                            opacity: 0.6
                        });
                        const material1 = new THREE.MeshBasicMaterial({
                            color: '#3480C4',
                            transparent: true,
                            opacity: 0.5
                        });
                        const mesh = new THREE.Mesh(geometry, [material, material1]);
                        const line = new THREE.Line(lineGeometry, lineMaterial);
                        province.add(mesh);
                        province.add(line)
                    })
                })
                province['properties'] = elem.properties;
                if (elem.properties.contorid) {
                    const temp = projection(elem.properties.contorid);
                    if (temp) {
                        const [x, y] = temp;
                        province['properties']._centroid = [x, y];
                    }
                }
                map.add(province);
                scene.add(map);
            });

            animate();
            function animate() {
                requestAnimationFrame(animate);

                raycaster.setFromCamera(mouse, camera); /* 通過摄像机和鼠标位置更新射线 */
                const intersects = raycaster.intersectObjects(scene.children, true); /* 计算物体和射线的焦点 */
                if (activeInstersect.length > 0) { // 将上一次选中的恢复颜色
                    activeInstersect.forEach(element => {
                        element.object.material[0].color.set('#02A1E2');
                        element.object.material[1].color.set('#3480C4');
                    });
                }

                activeInstersect = []; // 设置为空

                for (var i = 0; i < intersects.length; i++) {
                    const t: any = intersects[i].object;
                  if (t.material && t.material.length === 2) {
                    activeInstersect.push(intersects[i]);
                    t.material[0].color.set(0xff0000);
                    t.material[1].color.set(0xff0000);
                    break; // 只取第一个
                  }
                }

                if (activeInstersect.length !== 0 && activeInstersect[0].object.parent.properties.name) {
                    var properties = activeInstersect[0].object.parent.properties;
                    provinceInfo.textContent = properties.name;
                    provinceInfo.style.visibility = 'visible';
                } else {
                    provinceInfo.style.visibility = 'hidden';
                }

                render();
            }

            function render() {
                renderer.render(scene, camera);
            }
        })
    }
    return (<>
        <canvas id="three"></canvas>
        <div id="provinceInfo"></div>
    </>)
}