import { useEffect } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;

let t = {
    value: 0
}
export default function Wall() {
    useEffect(() => {
        init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;

        scene = new THREE.Scene();
        
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(20, 20, 20);
        scene.add(camera);

        const light = new THREE.AmbientLight(0xadadad); /* 环境光 */
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); /* 平行光源 */
        directionalLight.position.set(100, 100, 0);
        scene.add(directionalLight);

        renderer = new THREE.WebGLRenderer({
            canvas, antialias: true,
            alpha: true /* canvas是否包含alpha (透明度)。默认为 false */
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(new THREE.Color('#32373E'), 1);

        controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2.02;
        controls.screenSpacePanning = false;
        controls.target.set(2, 0, 0);
        const tt = new THREE.BoxGeometry(10,10,10);
        console.log(tt.attributes.position.array)
        console.log(tt.attributes.uv.array)
        const mesh = new THREE.Mesh(createBoxWithOutTopAndBottom([[0,5,0], [5,5,0], [5,5,5],[0,5,5],[0,5,0]], 5), getMaterial());
        scene.add(mesh);

        scene.add(new THREE.AxesHelper(10));

        const animate = () => {
            requestAnimationFrame(animate);
            t.value += 0.02
            renderer.render(scene, camera);
        };

        animate();

    }

    function getMaterial() {
        const vertexs = {
            normal_vertex: "\n  precision lowp float;\n  precision lowp int;\n  "
            .concat(THREE.ShaderChunk.fog_pars_vertex, "\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    ").concat(THREE.ShaderChunk.fog_vertex, "\n  }\n"),
        }

        const fragments = {
            rippleWall_fragment: "\n  precision lowp float;\n  precision lowp int;\n  uniform float time;\n  uniform float opacity;\n  uniform vec3 color;\n  uniform float num;\n  uniform float hiz;\n\n  varying vec2 vUv;\n\n  void main() {\n    vec4 fragColor = vec4(0.);\n    float sin = sin((vUv.y - time * hiz) * 10. * num);\n    float high = 0.92;\n    float medium = 0.4;\n    if (sin > high) {\n      fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);\n    } else if(sin > medium) {\n      fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));\n    } else {\n      fragColor = vec4(color, 0.);\n    }\n\n    vec3 fade = mix(color, vec3(0., 0., 0.), vUv.y);\n    fragColor = mix(fragColor, vec4(fade, 1.), 0.85);\n    gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - vUv.y));\n  }\n",
        }
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: t,
                color: {
                    value: new THREE.Color('#0099FF')
                },
                opacity: {
                    value: 0.5
                },
                num: {
                    value: 5
                },
                hiz: {
                    value: 0.15
                }
            },
            vertexShader: vertexs.normal_vertex,
            fragmentShader: fragments.rippleWall_fragment,
            blending: THREE.AdditiveBlending,
            transparent: !0,
            depthWrite: !1,
            depthTest: !0,
            side: THREE.DoubleSide
        });
        return material;
    }

    /**
     * 根据底面各个连接点位的坐标，以及高度；生成不包含上、下两个面的BufferGeometry;默认垂直于x\z平面
     *
     * @param {[number,number,number][]} points
     * @param {number} height
     */
    function createBoxWithOutTopAndBottom(points: [number,number,number][], height: number) {
        const joinLonLat: number[] = [];
        const positionsV: {x: number, y: number, z: number}[] = [];
        points.forEach(item => {
            joinLonLat.push(item[0], item[2]);
            positionsV.push({
                x: item[0],
                y: item[1],
                z: item[2]
            })
        });
        for (var a = joinLonLat, polySub: number[] = [], o = 0, s = 0; o < a.length - 2; o += 2, s++)
                    0 === o ?
                        polySub[0] = Math.sqrt((a[2] - a[0]) * (a[2] - a[0]) + (a[3] - a[1]) * (a[3] - a[1])) :
                        polySub[s] = polySub[s - 1] + Math.sqrt((a[o + 2] - a[o]) * (a[o + 2] - a[o]) + (a[o + 3] - a[o + 1]) * (a[o + 3] - a[o + 1]));
                let pos: number[] = [],
                    uvs: number[] = [];
                let polylenth = polySub[polySub.length - 1];
                for (let d = 0, u = pos.length, p = uvs.length; d < positionsV.length - 1; d++) {
                    let pv1 = positionsV[d],
                        pv2 = positionsV[d + 1],
                        polyPice = polySub[d];
                        pos[u++] = pv1.x;
                        pos[u++] = pv1.y;
                        pos[u++] = pv1.z;
                        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
                        uvs[p++] = 0;
                        pos[u++] = pv2.x;
                        pos[u++] = pv1.y;
                        pos[u++] = pv2.z;
                        uvs[p++] = polyPice / polylenth;
                        uvs[p++] = 0;
                        pos[u++] = pv1.x;
                        pos[u++] = pv1.y + height;
                        pos[u++] = pv1.z;
                        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
                        uvs[p++] = 1;
                        pos[u++] = pv1.x;
                        pos[u++] = pv1.y + height;
                        pos[u++] = pv1.z;
                        uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth;
                        uvs[p++] = 1;
                        pos[u++] = pv2.x;
                        pos[u++] = pv1.y;
                        pos[u++] = pv2.z;
                        uvs[p++] = polyPice / polylenth;
                        uvs[p++] = 0;
                        pos[u++] = pv2.x;
                        pos[u++] = pv1.y + height;
                        pos[u++] = pv2.z;
                        uvs[p++] = polyPice / polylenth;
                        uvs[p++] = 1
                }
                var geometry = new THREE.BufferGeometry();
                console.log(pos)
                console.log(uvs)
                geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
                geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
                return geometry;
    }

    return (
        <div id="parent">
            <canvas id="three"></canvas>
        </div>
    )
}