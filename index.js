const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
let ctx;
let videoWidth, videoHeight; 

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            video.width = videoWidth;
            video.height = videoHeight;
            resolve(video);
        }; 
    });
}

async function setupCanvas() {
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.fillStyle = "green";
}

async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection
                .load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                      {maxFaces: 1});
}

function compute(x,y)
{
    var a=(x[0]-y[0])*(x[0]-y[0]) + (x[1]-y[1])*(x[1]-y[1]);
    return a;
}

function blinked(ratio)
{
    if(ratio>=9.2)
        return 1;
    else
        return 0;
}
async function renderPrediction() {
    const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false
    });

    ctx.drawImage(
        video, 0, 0, video.width, video.height, 0, 0, canvas.width, canvas.height);

    if(predictions.length > 0) {
        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;
            // for (let i = 0; i < keypoints.length; i++) {
                // const points=[33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161 , 246,
                //                 362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385,384, 398];
                // for(let i=0;i<points.length;i++)
                // {
                //     const x=keypoints[points[i]][0];
                //     const y=keypoints[points[i]][1];
                //     ctx.beginPath();
                // ctx.arc(x, y, 2, 0, 2 * Math.PI);
                // ctx.fill();
                // }
                var lefteye=compute(keypoints[362],keypoints[263])/compute(keypoints[374],keypoints[386]);
                var righteye=compute(keypoints[33],keypoints[133])/compute(keypoints[145],keypoints[159]);
                var left_blinked=blinked(lefteye);
                var right_blinked=blinked(righteye);
                if(left_blinked==1 || right_blinked==1)
                {
                    sleep++;
                    active=0;
                }
                else
                {
                    sleep=0;
                    active+=1;
                }
                var audio=new Audio("mixkit-facility-alarm-908.wav")
                document.getElementById("h1").innerHTML=lefteye;
                if(sleep>=8)
                {
                    audio.play();
                }
        });
    }

    window.requestAnimationFrame(renderPrediction);
}

async function main() {
    //Set up camera
    await setupCamera();

    //Set up canvas
    await setupCanvas();

    //Load the model
    model = await loadFaceLandmarkDetectionModel();

    //Render Face Mesh Prediction
    renderPrediction();
}
var sleep=0,drowsy=0,active=0;
main();