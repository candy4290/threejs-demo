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
let ttt: THREE.Texture;
export default function Shield() {
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

        scene.add(new THREE.AxesHelper(10));

        const material2 = getMater2();
        // const geometry = new THREE.SphereBufferGeometry(1, 50, 50, 0, Math.PI * 2);
        // const material = getMaterial();
        // const mesh = new THREE.Mesh(geometry, material);
        // // scene.add(mesh);

        const geometry1 = new THREE.SphereBufferGeometry(10, 500, 500, 0, Math.PI * 2, -Math.PI/2);
        ttt = new THREE.TextureLoader().load('/textures/six-side.png', function(t) {
        });
        ttt.wrapS = ttt.wrapT = THREE.RepeatWrapping;
        ttt.needsUpdate = true;
        material2.uniforms.textureMap.value=ttt;
        const mesh2 = new THREE.Mesh(geometry1, material2);
        scene.add(mesh2);

        const animate = () => {
            requestAnimationFrame(animate);
            t.value += 0.02
            if (ttt) {
                ttt.offset.x -= 0.2
            }
            renderer.render(scene, camera);
        };

        animate();



    }

    function getMaterial() {
        var ElectricShield = {
            uniforms: {
                time: t,
                color: {
                    value: new THREE.Color("#9999FF")
                },
                opacity: {
                    value: 1
                }
            },
            vertexShaderSource: "\n  precision lowp float;\n  precision lowp int;\n  "
                .concat(
                    THREE.ShaderChunk.fog_pars_vertex,
                    "\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    "
                )
                .concat(THREE.ShaderChunk.fog_vertex, "\n  }\n"),
            fragmentShaderSource: `
            #if __VERSION__ == 100
             #extension GL_OES_standard_derivatives : enable
            #endif
            uniform vec3 color;
            uniform float opacity;
            uniform float time;
            varying vec2 vUv;
            #define pi 3.1415926535
            #define PI2RAD 0.01745329252
            #define TWO_PI (2. * PI)
            float rands(float p){
                return fract(sin(p) * 10000.0);
            }
            float noise(vec2 p){
                float t = time / 20000.0;
                if(t > 1.0) t -= floor(t);
                return rands(p.x * 14. + p.y * sin(t) * 0.5);
            }
            vec2 sw(vec2 p){
                return vec2(floor(p.x), floor(p.y));
            }
            vec2 se(vec2 p){
                return vec2(ceil(p.x), floor(p.y));
            }
            vec2 nw(vec2 p){
                return vec2(floor(p.x), ceil(p.y));
            }
            vec2 ne(vec2 p){
                return vec2(ceil(p.x), ceil(p.y));
            }
            float smoothNoise(vec2 p){
                vec2 inter = smoothstep(0.0, 1.0, fract(p));
                float s = mix(noise(sw(p)), noise(se(p)), inter.x);
                float n = mix(noise(nw(p)), noise(ne(p)), inter.x);
                return mix(s, n, inter.y);
            }
            float fbm(vec2 p){
                float z = 2.0;
                float rz = 0.0;
                vec2 bp = p;
                for(float i = 1.0; i < 6.0; i++){
                rz += abs((smoothNoise(p) - 0.5)* 2.0) / z;
                z *= 2.0;
                p *= 2.0;
                }
                return rz;
            }
            void main() {
                vec2 uv = vUv;
                vec2 uv2 = vUv;
                if (uv.y < 0.5) {
                discard;
                }
                uv *= 4.;
                float rz = fbm(uv);
                uv /= exp(mod(time * 2.0, pi));
                rz *= pow(15., 0.9);
                gl_FragColor = mix(vec4(color, opacity) / rz, vec4(color, 0.1), 0.2);
                if (uv2.x < 0.05) {
                gl_FragColor = mix(vec4(color, 0.1), gl_FragColor, uv2.x / 0.05);
                }
                if (uv2.x > 0.95){
                gl_FragColor = mix(gl_FragColor, vec4(color, 0.1), (uv2.x - 0.95) / 0.05);
                }
            }`
        };
        let material = new THREE.ShaderMaterial({
            uniforms: ElectricShield.uniforms,
            vertexShader: ElectricShield.vertexShaderSource,
            fragmentShader: ElectricShield.fragmentShaderSource,
            blending: THREE.AdditiveBlending,
            depthWrite: !1,
            depthTest: !0,
            side: THREE.DoubleSide,
            transparent: !0
        });
        return material;
    }

    function getMater2() {
        let material = new THREE.ShaderMaterial({
            uniforms: {
                scale: { value: -1.0 },
                bias: { value: 1.0 },
                power: { value: 3.3 },
                glowColor: { value: new THREE.Color(0x00ffff) },
                textureMap: {
                    value: undefined
                },
                repeat: {
                    value: new THREE.Vector2(30.0, 15.0)
                },
                time: t
            },
            vertexShader: `
            varying vec3 vNormal;
                varying vec3 vPositionNormal;
                varying vec2 vUv;
                void main() 
                {
                    vUv = uv;
                    vNormal = normalize( normalMatrix * normal ); // 转换到视图空间
                    vPositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float bias;
                uniform float power;
                uniform float scale;
                varying vec3 vNormal;
                varying vec3 vPositionNormal;
                uniform sampler2D textureMap;
                uniform vec2 repeat;
                varying vec2 vUv;
                uniform float time;
                void main() 
                {
                    float a = pow( bias + scale * abs(dot(vNormal, vPositionNormal)), power );
                    //*(vec2(1.0,time))
                    vec4 mapColor=texture2D( textureMap, vUv*repeat);
                    gl_FragColor = vec4( glowColor*mapColor.rgb, a );
                }
            `,
            // blending: THREE.AdditiveBlending,
            depthWrite: false,
            // side: THREE.DoubleSide,
            transparent: true
        });
        return material;
    }



    return (
        <div id="parent">
            <canvas id="three"></canvas>
        </div>
    )
}