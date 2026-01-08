import { forwardRef } from 'react';
import Webcam from 'react-webcam';

// We wrap Webcam in a forwardRef to pass it easily
export const CameraFeed = forwardRef<Webcam>((_, ref) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-black overflow-hidden">
            <Webcam
                ref={ref}
                mirrored={true}
                className="w-full h-full object-cover"
                videoConstraints={{
                    facingMode: "user",
                    width: 1280,
                    height: 720
                }}
            />
        </div>
    );
});

CameraFeed.displayName = 'CameraFeed';
