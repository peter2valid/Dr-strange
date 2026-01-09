import { useRef } from 'react';
import Webcam from 'react-webcam';
import { CameraFeed } from './components/CameraFeed';
import { HandTracker, type HandData } from './components/HandTracker';
import { Scene3D } from './components/Scene3D';

function App() {
  const webcamRef = useRef<Webcam>(null);
  const handDataRef = useRef<HandData | null>(null);

  const handleHandUpdate = (data: HandData | null) => {
    handDataRef.current = data;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 1. Camera Background */}
      <CameraFeed ref={webcamRef} />

      {/* 2. Logic Layer (No UI) */}
      <HandTracker
        videoRef={webcamRef}
        onHandUpdate={handleHandUpdate}
      />

      {/* 3. 3D Overlay Layer */}
      <Scene3D handDataRef={handDataRef} />

      {/* 4. Optional UI / Instructions */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-orange-500 font-mono text-center pointer-events-none opacity-70">
        <p className="text-sm">🔮 OPEN PALM to CAST | FIST to HIDE 🔮</p>
      </div>
    </div>
  );
}

export default App;
