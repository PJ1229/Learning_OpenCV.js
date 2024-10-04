// init game window
const game = new PIXI.Application({
    width: 640,
    height: 360,
    backgroundColor: 0x000000,
});
document.getElementById('game-container').appendChild(game.view);

// create video element
let video = document.createElement("video");
video.width = 640;
video.height = 360;
video.autoplay = true;
video.style.width = 640;
video.style.height = 360;
video.style.position = 'relative';
video.style.objectFit = 'cover';
document.getElementById('opencv-container').appendChild(video);

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        video.srcObject = stream;
        video.play();
    })
    .catch(function(err) {
        console.log("An error occurred! " + err);
    });

// wait for opencv
cv['onRuntimeInitialized'] = () => {
    console.log('opencv ready');

    let canvasFrame = document.getElementById("opencv-container"); // canvasFrame is the id of <canvas>
    let context = canvasFrame.getContext("2d");
    let src = new cv.Mat(360, 640, cv.CV_8UC4); // adjust height and width according to video
    let dst = new cv.Mat(360, 640, cv.CV_8UC1);

    const FPS = 30;
    function processVideo() {
        let begin = Date.now();

        // draw the video frame to the canvas
        context.drawImage(video, 0, 0, 640, 360);
        src.data.set(context.getImageData(0, 0, 640, 360).data);
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.imshow("canvasOutput", dst); // canvasOutput is the id of another <canvas>;

        // schedule next frame
        let delay = 1000 / FPS - (Date.now() - begin);
        setTimeout(processVideo, delay);
    }

    // schedule first one
    setTimeout(processVideo, 0);
};

// debugging
if (cv['onRuntimeInitialized'] === undefined) {
    console.error('opencv didnt initialize correctly');
}
