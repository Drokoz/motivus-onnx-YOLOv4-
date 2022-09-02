var start_time;
var elapsed_time;

//Funtion to download
function download(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
 }
 
//Function to jsonfy output and download
function onDownload(jsonData,fileName){
download(JSON.stringify(jsonData), fileName, "text/plain");
}

// Create an ONNX inference session with WebGL backend.
// Can be 'cpu', 'wasm' or 'webgl
async function loadModel() {
  
  //Session options to load
  const sessionOptions = {
    executionProviders: ['wasm'],
    enableProfiling: true
  };
  session = await ort.InferenceSession.create("./yolov4.onnx",sessionOptions);
  await imgSet();
}

async function imgSet() {
    let imageData = await WebDNN.Image.getImageArray(document.getElementById("image_url").value, {dstW: imageSize, dstH: imageSize});
    WebDNN.Image.setImageArrayToCanvas(imageData, imageSize, imageSize, document.getElementById('input_image'));
    document.getElementById('run_button').disabled = false;
    // log('Image loaded to canvas');
}

async function runExample() {

  //This commented section is for another preprocess steps
    //var img = document.getElementById("image_url")
    
    // const img = new Image();
    // img.onload = function() {
    //   imgElement = document.getElementById("image_url");
    //   console.log(imgElement)
    //   img.width = this.width;
    //   img.height = this.height;
    // }
    // img.src = document.getElementById("image_url").value;
    // //console.log(img.width + 'x' + img.height);
    
    // // Load image.
    // const imageLoader = new ImageLoader(imageSize, imageSize);
    // const imageData = await imageLoader.getImageData(document.getElementById("image_url").value);
    
    // // Preprocess the image data to match input dimension requirement, 1x416x416x3
    // const width = imageSize;
    // const height = imageSize;

    
    //debugSlice()
    //const preprocessedData = preprocessYOLO(width, height, img);

    //console.log("first", preprocessedData)
    //console.log([1, width, height, 3])

    // const inputTensor = new ort.Tensor('float32', preprocessedData.data,  [1, width, height, 3]);

    //console.log(session.inputNames)
    //const input = new String(session.inputNames[0]);
    //const output = new String(session.outputNames[0]);
    //const imageArray = await getImagesArray('http://localhost:3000/getImages'+5)
    //console.log(imageArray);
    //const feeds = {[input] : inputTensor};
    //const arrayImages = await preprocessBatch(imageSize,imageSize, imageArray);

    //console.log(arrayImages);

    //const feeds = {[input] : arrayImages};
    //start_time = performance.now();
    // Run model with Tensor inputs and get the result.
    console.log("Loading...")
    //const result = await session.run(feeds);
    
    // //Download result to use a python post process
    // console.log(result);

    // console.log(result[output]);
    //onDownload(result,"output.json");

    // //Print performance timeimage.png
    // console.log("Tiempo")
    // console.log(performance.now() - start_time)
    experiments(imageSize,imageSize)
  }

/**
 * Preprocess raw image data to match YoloV4 requirement.
 */

function preprocessYOLO(width, height, img) {

    //width and height = iw, ih

    //Obtaining real values of width and height
    const realHeight = img.height;
    const realWidth = img.width;

    //Scaling image
    const scale = Math.min(height/realHeight,width/realWidth);
    const newWidth = parseInt(realWidth * scale);
    const newHeight = parseInt(realHeight * scale);
    //console.log(scale, newWidth, newHeight, realWidth, realHeight);

    //Creating a mat to use cv
    let mat = cv.imread(img);

    //Resize
    let image_resized = new cv.Mat();
    let dsize = new cv.Size(newWidth, newHeight);
    cv.resize(mat, image_resized, dsize, 0, 0, cv.INTER_LINEAR);

    //Create array from images and processed data
    const imageResized = ndarray(new Float32Array(image_resized.data), [newHeight,newWidth, 4]);
    const imagePadded = ndarray(new Float32Array(width * height * 3), [height, width, 3]);
    
    //Asigns 128 to make an np.full
    ndarray.ops.assigns(imagePadded, 128.0);
    
    const dWidth = Math.floor((width-newWidth)/2);
    const dHeight = Math.floor((height-newHeight)/2);
    
    ndarray.ops.assign(imagePadded.hi(dHeight+newHeight, dWidth+newWidth,null).lo(dHeight, dWidth, null), imageResized.hi(null, null,3));

    ndarray.ops.divseq(imagePadded, 255.0);

    return imagePadded;
  }
async function getImagesArray(url){
    
    const jsonData = await fetch(url)
    .then(function(response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      return response.json();
    }).then(async function(data) {
      // `data` is the parsed version of the JSON returned from the above endpoint.
      //console.log(data);  //
      var imgArray = new Array();
      var imgArrayNames = new Array();
      var k = 0;
      Object.entries(data).forEach(([key, value]) => {
        //console.log(key, value);
        //console.log(value["data"][0][0][0]);
        var width = value["shape"][1],
            height = value["shape"][0],
            buffer = new Uint8ClampedArray(width * height * 4);
        //console.log(width,height);
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x++) {
              var pos = (y * width + x) * 4; // position in buffer based on x and y
              buffer[pos] = value["data"][y][x][2];           // some R value [0, 255]
              buffer[pos+1] = value["data"][y][x][1];           // some G value
              buffer[pos+2] = value["data"][y][x][0];           // some B value
              buffer[pos+3] = 255;           // set alpha channel
          }
          //console.log("pase")
        }
                // create off-screen canvas element
        var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        // create imageData object
        var idata = ctx.createImageData(width, height);

        // set our buffer as source
        idata.data.set(buffer);

        // update canvas with new data
        ctx.putImageData(idata, 0, 0);

        var dataUri = canvas.toDataURL(); // produces a PNG file
        
        const imgA = new Image(value["shape"][1],value["shape"][0]);
        imgA.data = value["data"];
        //console.log(img);

        imgA.onload = function() {
          imgA.width = this.width;
          imgA.height = this.height;
          }
          imgA.src = dataUri
          //document.body.appendChild(imgA);
        imgArray[k]=imgA;
        imgArrayNames[k]=key; 
        k = k + 1;
      });
    return imgArray;
  })
  return jsonData;
};

async function preprocessBatch(yoloWidth, yoloHeight, imgArray){
      
      k = 0;
      const countImages=imgArray.length
      //console.log(countImages=imgArray.length);
      const processArray = ndarray(new Float32Array((countImages)*yoloHeight*yoloHeight*3), [countImages, yoloHeight, yoloHeight, 3]);
      for (let i = 0; i < countImages; i++) {
        const element = imgArray[i];
        //console.log("Imagen: ",imgArrayNames[k]);
        const preprocessedData = preprocessYOLO(yoloWidth, yoloHeight, element);
        //console.log(preprocessedData);
        ndarray.ops.assign(processArray.pick(k,null,null,null), preprocessedData);
      
        // const input = new String(session.inputNames[0]);
        // const output = new String(session.outputNames[0]);
        // const inputTensor = new ort.Tensor('float32', preprocessedData.data,  [1, yoloWidth, yoloHeight, 3]);

        // const feeds = {[input] : inputTensor};
        // start_time = performance.now();
        // const result = await session.run(feeds);
        // //Print performance timeimage.png
        // console.log("Tiempo")
        // console.log(performance.now() - start_time)
        // onDownload(result,imgArrayNames[k]+".json");
        k = k + 1;
      }
      //console.log(processArray);
      const inputTensor = new ort.Tensor(processArray.data, [k, yoloHeight, yoloHeight, 3]);

      //console.log(k,inputTensor);
      return inputTensor;
};
async function experiments(yoloWidth, yoloHeight){
    const input = new String(session.inputNames[0]);
    const output = new String(session.outputNames[0]);
  for (let index = 1; index < 6; index++) {
    //const feeds = {[input] : inputTensor};
    console.log("Test "+index);
    var startTime = performance.now();
    const imageArray = await getImagesArray('http://localhost:3000/getImages'+index)
    //console.log(arrayImages);
    var startTime = performance.now();
    const arrayImages = await preprocessBatch(imageSize,imageSize, imageArray);
    const feeds = {[input] : arrayImages};
    // Run model with Tensor inputs and get the result.
    const result = await session.run(feeds);
    
    // //Download result to use a python post process
    // console.log(result);
    //Print performance timeimage.png
    var finishTime = performance.now() - startTime;
    console.log("Time total: ");
    console.log(finishTime);

    console.log("Time per Image: ");
    console.log(finishTime/index);
    console.log();
    // console.log(result[output]);
    onDownload(result,"test"+index+".json");

    
  }
}