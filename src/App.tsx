import '@babel/polyfill'
import './App.less';
import { useRef } from 'react';
import { useEffect } from 'react';

// import Stats from 'stats.js';
import MapTest from './components/openlayer';
// import UnrealBloom from './components/unreal-bloom';
// import Car1 from './components/car1';
// import Bloom from './components/bloom';
import {BrowserCheck} from '@kzlib/kcomponents';

function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // var stats = new Stats();
    // stats.showPanel(0) ; // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild( stats.dom );
    
    // function animate() {
    //   stats.begin();
    //   // monitored code goes here
    //   stats.end();
    //   requestAnimationFrame( animate );
    // }
    // requestAnimationFrame( animate );
  }, []);

  return (
    <div className='kz-kyk' style={{height: '100%', width: '100%'}} ref={mainRef}>
      {/* <Car1 /> */}
      {/* <UnrealBloom /> */}
      {/* <Bloom /> */}
      <MapTest />
      {/* 检查适用的浏览器版本及型号 */}
      <BrowserCheck></BrowserCheck>
    </div>
  );
}

export default App;
