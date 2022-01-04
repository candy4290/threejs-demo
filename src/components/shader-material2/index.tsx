import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
/**
 * shadertoy效果移植：https://www.shadertoy.com/view/XsXXDn
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.Camera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let uniforms: any;

export default function ShaderMaterial2() {
    useEffect(() => {
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function init() {
        const canvas = document.querySelector('#three') as HTMLCanvasElement;
        scene = new THREE.Scene();
        scene.add(new THREE.AmbientLight(0xffffff))
        camera = new THREE.PerspectiveCamera();
        camera.position.z = 2;
        renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        controls = new MapControls(camera, renderer.domElement);
        var planeGeom = new THREE.PlaneBufferGeometry(1, 1);
        uniforms = {
            resolution: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            iTime: {
                value: 1.0
            },
            iResolution: {
                value: new THREE.Vector2()
            },
        }
        var planeMate = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: `
            void main() { gl_Position = vec4( position, 1.0 ); }
            `,
            fragmentShader: `
                uniform float iTime;
                uniform vec2 iResolution;
                void main() {
                    float t=iTime;
                    vec2 r=iResolution.xy;
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
        })
        var planeMesh = new THREE.Mesh(planeGeom, planeMate);
        scene.add(planeMesh);
        scene.add(new THREE.AxesHelper(20))
        uniforms.iResolution.value.x = renderer.domElement.width;
        uniforms.iResolution.value.y = renderer.domElement.height;
        window.addEventListener('resize', event => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.iResolution.value.x = renderer.domElement.width;
            uniforms.iResolution.value.y = renderer.domElement.height;
        })

        render();
    }
    function render() {
        requestAnimationFrame(render);
        if (uniforms && uniforms.iTime) {
            uniforms.iTime.value += 0.05;
        }
        controls.update();
        renderer.render(scene, camera);
    }
    return (
        <>
            <canvas id="three"></canvas>
        </>
    )
}