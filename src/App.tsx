import '@babel/polyfill'
import './App.less';
import { useRef } from 'react';
import { useEffect } from 'react';

import Stats from 'stats.js';
// import MapTest from './components/openlayer';
// import UnrealBloom from './components/unreal-bloom';
// import Car1 from './components/car1';
// import Bloom from './components/bloom';
import {BrowserCheck} from '@kzlib/kcomponents';
// import Car2 from './components/car2';
// import DrawLine from './components/draw-line';
// import DrawLine2 from './components/draw-line';
// import Car2 from './components/car2';
// import DingPai from './components/dingpai';
// import FpsGame from './components/fps_games';
// import Cannon from './components/cannon';
// import Cannon2 from './components/cannon2';
// import Cannon3 from './components/cannon3';
// import Cannon4 from './components/cannon4';
// import Cannon5 from './components/cannon5';
import City from './components/city';
// import ShaderMaterial from './components/shader-material';
// import Glsl1 from './components/glsl1';
// import Glsl2 from './components/glsl2';
// import Glsl3 from './components/glsl3';
// import Shader1 from './components/shader1';
// import Sea from './components/sea';
// import Light from './components/light';
// import LightLine from './components/light-line';

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    var stats = new Stats();
    stats.showPanel(0) ; // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom );
    
    function animate() {
      stats.begin();
      // monitored code goes here
      stats.end();
      requestAnimationFrame( animate );
    }
    requestAnimationFrame( animate );
  }, []);

  return (
    <div className='kz-kyk' style={{height: '100%', width: '100%'}} ref={mainRef}>
      {/* <LightLine /> */}
      {/* <Light /> */}
      {/* <Sea /> */}
      {/* <Car1 /> */}
      {/* <Car2 /> */}
      <City />
      {/* <ShaderMaterial /> */}
      {/* <Glsl1 /> */}
      {/* <Glsl2 /> */}
      {/* <Glsl3 /> */}
      {/* <Shader1 /> */}
      {/* <Cannon /> */}
      {/* <Cannon2 /> */}
      {/* <Cannon3 /> */}
      {/* <Cannon4 /> */}
      {/* <Cannon5 /> */}
      {/* <DingPai /> */}
      {/* <DrawLine /> */}
      {/* <DrawLine2 /> */}
      {/* <UnrealBloom /> */}
      {/* <Bloom /> */}
      {/* <MapTest /> */}
      {/* 检查适用的浏览器版本及型号 */}
      <BrowserCheck></BrowserCheck>
    </div>
  );
}

export default App;
