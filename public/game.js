// init game window
const game = new PIXI.Application({
    width: 640,
    height: 360,
    backgroundColor: 0x000000,
});
document.getElementById('game-container').appendChild(game.view); // Correct usage

// create video element
let video = document.createElement("video");
video.width = 640; 
video.height = 360; 
video.autoplay = true; 
video.style.position = 'relative'; 
video.style.objectFit = 'cover'; 
video.style.transform = 'scaleX(-1)';
document.getElementById('opencv-container').appendChild(video);

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        video.srcObject = stream;
        video.play(); // Play the video stream
        console.log("Video stream received and playing.");
    })
    .catch(function(err) {
        console.log("An error occurred! " + err);
    });

// wait for opencv to be ready
cv['onRuntimeInitialized'] = () => {
    console.log('OpenCV ready');

    let streaming = true;

    // reference canvas, set willReadFrequently to true
    let canvasFrame = document.getElementById("canvas-output");

    // matrices
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let gray = new cv.Mat();
    let cap = new cv.VideoCapture(video);
    let faces = new cv.RectVector();
    let classifier = new cv.CascadeClassifier();

    // Load pre-trained classifier
    classifier.load('classifiers/haarcascade_frontalface_default.xml');
    
    const FPS = 30;
    function processVideo() {
        if (!streaming) {
            // clean and stop.
            src.delete();
            dst.delete();
            gray.delete();
            faces.delete();
            classifier.delete();
            return;
        }
        let begin = Date.now();
        // start processing.
        cap.read(src);
        src.copyTo(dst);
        cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);
        // detect faces.
        classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
        console.log("Frame captured.");
        // draw faces.
        for (let i = 0; i < faces.size(); ++i) {
            let face = faces.get(i);
            let point1 = new cv.Point(face.x, face.y);
            let point2 = new cv.Point(face.x + face.width, face.y + face.height);
            cv.rectangle(dst, point1, point2, [255, 0, 0, 255]);
        }
        cv.imshow('canvas-output', dst);
        let delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(processVideo, delay); // Ensure delay is not negative
    }

    // schedule first one
    setTimeout(processVideo, 0);
};

// debugging
if (cv['onRuntimeInitialized'] === undefined) {
    console.error('OpenCV did not initialize correctly');
}
