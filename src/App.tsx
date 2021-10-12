import './App.less';
import { useRef } from 'react';
import { useEffect } from 'react';

import Stats from 'stats.js';
// import Trace from './components/trace';
// import MiscLookat from './components/misc-lookat';
import Car1 from './components/car1';
// import LightPhysical from './components/lights-physical';
// import MaterialCar from './components/material-car';
// import LoadGlb from './components/load-glb';
// import Camera from './components/camera';
// import LoadTtf from './components/load-ttf';
// import TextShapes from './components/text-shapes';
// import HemisphereLight from './components/hemisphere';
// import AnimationMulti from './components/animation-multi';
// import SkinningMorph from './components/skinning-morph';
// import SkinningAdditive from './components/skinning-additive';
// import BasicUse from './components/basic-use';
// import ChinaMap from './components/china-map';
// import InteractiveVoxelpainter from './components/interactive-voxelpainter';
// import AnimationSkinning from './components/animation-skinning';
// import MaterialsEnvmaps from './components/materials-envmaps';
// import ShadersOcean from './components/shaders-ocean';
// import Kmz from './components/kmz';
// import PointerLock from './components/pointerlock';

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
      {/* <LoadGlbf /> */}
      {/* <LoadGlb /> */}
      {/* <AnimationSkinning /> */}
      {/* <MaterialsEnvmaps /> */}
      {/* <ShadersOcean /> */}
      {/* <Kmz /> */}
      {/* <PointerLock /> */}
      {/* <BasicUse /> */}
      {/* <ChinaMap /> */}
      {/* <InteractiveVoxelpainter /> */}
      {/* <SkinningAdditive /> */}
      {/* <SkinningMorph /> */}
      {/* <AnimationMulti /> */}
      {/* <Camera /> */}
      {/* <LoadTtf /> */}
      {/* <TextShapes /> */}
      {/* <HemisphereLight /> */}
      {/* <LightPhysical /> */}
      {/* <MaterialCar /> */}
      {/* <MiscLookat /> */}
      <Car1 />
      {/* <Trace /> */}
    </div>
  );
}

export default App;
