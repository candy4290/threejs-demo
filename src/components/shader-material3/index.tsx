import { useEffect } from "react"
import * as THREE from 'three';
import { MapControls } from "three/examples/jsm/controls/OrbitControls";
/**
 * shadertoy效果移植：https://www.shadertoy.com/view/llKXWz
 *
 * @export
 * @return {*} 
 */
let scene: THREE.Scene;
let camera: THREE.Camera;
let renderer: THREE.WebGLRenderer;
let controls: MapControls;
let uniforms: any;

export default function ShaderMaterial3() {
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
        var planeGeom = new THREE.PlaneBufferGeometry(2, 2);
        uniforms = {
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
                vec4 circle(vec2 uv, vec2 pos, float rad)
                {
                    float d = length(pos - uv) - rad;
                    
                    float t = 1.0 - clamp(d, 0.0, 1.0);
                    
                    float dist = (rad) - distance(uv, pos);
                    dist = clamp(dist * 0.01, 0.0, 1.0);
                    t -= dist;
                    
                    return vec4(t);
                }
                void main() {
                    vec2 uv = gl_FragCoord.xy;
                    vec2 center = iResolution.xy * 0.5;
                    
                    float time = iTime * 0.25;
                    float iTime = floor(time);
                    float fTime = time - iTime;
                    
                    float radius = fTime * (iResolution.y * 0.5);
                    
                    vec2 uv2 = uv - center;
                    uv2 /= iResolution.xy;
                    uv2 *= vec2(2, 2);
                    
                    vec4 col = circle(uv, center, radius);
                    col *= 1.0 - fTime;
                    
                    gl_FragColor = col * vec4(0.2, 0.2, 1.0, 1.0);
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