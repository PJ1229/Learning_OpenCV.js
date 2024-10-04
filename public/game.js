// init pixijs
const app = new PIXI.Application({
  width: 640,
  height: 360,
});
document.getElementById('game-container').appendChild(app.view);

// wait for opencv
cv['onRuntimeInitialized'] = () => {
    console.log('OpenCV.js is ready to use!');

    // load image w opencv
    let imgElement = document.createElement('img');
    imgElement.src = 'images/mountain.jpg';
    
    imgElement.onload = function () {
        // create open cv mat for img
        let src = cv.imread(imgElement);
        let dst = new cv.Mat();

        // debugging
        console.log(`Image dimensions: ${src.cols} x ${src.rows}, Channels: ${src.channels()}`);

        // convert to grayscale
        try {
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);

            // debugging
            console.log('converted to grayscale.');
        } catch (error) {

            //debugging
            console.error('error converting to grayscale:', error);

            // clean up open cv
            src.delete();
            dst.delete();
            return;
        }

        // debugging, img dimensions
        console.log(`grayscale image dimensions: ${dst.cols} x ${dst.rows}, channels: ${dst.channels()}`);

        // check output
        const outputWidth = dst.cols;
        const outputHeight = dst.rows;
        const expectedLength = outputWidth * outputHeight; // grayscale

        // check if length of data is expected
        if (dst.data.length !== expectedLength) {
            // debugging
            console.error('Grayscale image data length is invalid:', dst.data.length);

            // delete open cv objects
            src.delete();
            dst.delete();
            return; // exit if not valid
        }

        // convert to image data for pixijs
        try {
            // create array for rgba data
            let rgbaData = new Uint8ClampedArray(outputWidth * outputHeight * 4);

            for (let i = 0; i < expectedLength; i++) {
                const grayValue = dst.data[i]; // grayscale value
                rgbaData[i * 4] = grayValue;     // r
                rgbaData[i * 4 + 1] = grayValue; // g
                rgbaData[i * 4 + 2] = grayValue; // b
                rgbaData[i * 4 + 3] = 255;        // a (fully opaque)
            }

            let imageData = new ImageData(rgbaData, outputWidth, outputHeight);

            // use the image data with pixijs
            const texture = PIXI.Texture.fromBuffer(imageData.data, outputWidth, outputHeight);
            const sprite = new PIXI.Sprite(texture);

            // add sprite to pixijs stage
            app.stage.addChild(sprite);
            console.log('sprite added to pixijs stage.');
        } catch (error) {

          // debugging
            console.error('error creating image data:', error);
        }

        // clean up opencv objects
        src.delete();
        dst.delete();
    };

    imgElement.onerror = function () {

        // debugging
        console.error('error loading image, check path');
    };
};

// debugging
if (cv['onRuntimeInitialized'] === undefined) {
    console.error('OpenCV.js did not initialize correctly.');
}
