import {useEffect} from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
const clock = new THREE.Clock();

const uniforms = {
    u_time: {value: 1.0},
    u_resolution: { value: new THREE.Vector2() }
}
export default function Shader1() {
    useEffect(() => {
        // init();
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);
        camera.position.set(100,100,100)
        renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls = new MapControls(camera, renderer.domElement);

        addXiaoguo()

        render();
    }

    function addXiaoguo() {
        const geometry = new THREE.PlaneBufferGeometry(.2, .2);
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
                void main() {
                    gl_Position = vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                uniform float iTime;
                uniform vec2 iResolution;
                float t=iTime;
                vec2 r=iResolution.xy;
                void main() {
                vec3 c;
                    float l,z=t;
                    for(int i=0;i<3;i++) {
                        vec2 uv,p=gl_FragCoord.xy/r;
                        uv=p; p-=.5; p.x*=r.x/r.y;
                        z+=.07;
                        l=length(p);
                        uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z*2.));
                        c[i]=.01/length(abs(mod(uv,1.)-.5));
                    }
                    gl_FragColor=vec4(c/l,t); 
                }
            `
        });
        const mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
    }

    function render() {
        requestAnimationFrame(render);
        uniforms.u_time.value += clock.getDelta();
        controls.update();
        renderer.render(scene, camera);
    }
    return (
        <>
        <div>

            <script>console.log('aabb')</script>
        </div>
            <canvas id="three"></canvas>
        </>
    )
}