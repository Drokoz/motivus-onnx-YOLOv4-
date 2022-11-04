//Libreries

//Functions to use
  // Create an ONNX inference session with WebGL backend.
  // Can be 'cpu', 'wasm' or 'webgl
  async function main(imageSize, nunImages, dataImages){
    
    
  }
  async function loadModel() {
    //Session options to load
    const sessionOptions = {
      executionProviders: ['wasm','cpu'],
      enableProfiling: true
    };
    session = await ort.InferenceSession.create("./yolov4.onnx",sessionOptions);
    await imgSet();
  }
  
  //Exececute the program
  async function runExample(imageSize,n_images) {
  
      console.log("Loading...")
      //runSingleModel(imageSize)
      runBatchModel(imageSize,imageSize,'http://localhost:3000/getImages',"output.json")
      //benchmark(imageSize,imageSize, 5)
    }
  
  
  //Preprocess raw image data to match YoloV4 requirement.
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

    function preprocessResnet(data, width, height) {
        const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
        const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, 3, height, width]);
      
        // Normalize 0-255 to (-1)-1
        ndarray.ops.divseq(dataFromImage, 128.0);
        ndarray.ops.subseq(dataFromImage, 1.0);
      
        // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
        ndarray.ops.assign(dataProcessed.pick(0, 0, null, null), dataFromImage.pick(null, null, 2));
        ndarray.ops.assign(dataProcessed.pick(0, 1, null, null), dataFromImage.pick(null, null, 1));
        ndarray.ops.assign(dataProcessed.pick(0, 2, null, null), dataFromImage.pick(null, null, 0));
      
        return dataProcessed.data;
     }
  
  //Section of tensors
  
  //Get tensor from the image loaded in page
  async function getTensorFromImage(imageSize){
    //This commented section is for another preprocess steps
      //var img = document.getElementById("image_url")
      
      const img = new Image();
      img.onload = function() {
        imgElement = document.getElementById("image_url");
        console.log(imgElement)
        img.width = this.width;
        img.height = this.height;
      }
      img.src = document.getElementById("image_url").value;
      
      // Preprocess the image data to match input dimension requirement, 1x416x416x3
      const width = imageSize;
      const height = imageSize;
  
      const preprocessedData = preprocessYOLO(width, height, img);
  
      const inputTensor = new ort.Tensor('float32', preprocessedData.data,  [1, width, height, 3]);
  
      return inputTensor;
  }
  
  //Get tensor from an imgArray
  async function getTensorFromBatch(yoloWidth, yoloHeight, imgArray){
        
    k = 0;
    const countImages=imgArray.length
    const processArray = ndarray(new Float32Array((countImages)*yoloHeight*yoloHeight*3), [countImages, yoloHeight, yoloHeight, 3]);
    for (let i = 0; i < countImages; i++) {
      const element = imgArray[i];
      const preprocessedData = preprocessYOLO(yoloWidth, yoloHeight, element);
      ndarray.ops.assign(processArray.pick(k,null,null,null), preprocessedData);  
      k = k + 1;
    }
    //console.log(processArray);
    const inputTensor = new ort.Tensor(processArray.data, [k, yoloHeight, yoloHeight, 3]);
  
    //console.log(k,inputTensor);
    return inputTensor;
  };
  
  //Obtains an array of images connecting to an url
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
  
        //Get shape and create buffer
        var width = value["shape"][1],
            height = value["shape"][0],
            buffer = new Uint8ClampedArray(width * height * 4);
  
  
        //Copy data from img to buffer
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x++) {
              var pos = (y * width + x) * 4; // position in buffer based on x and y
              //Setting RGB value
              buffer[pos] = value["data"][y][x][2]; 
              buffer[pos+1] = value["data"][y][x][1]; 
              buffer[pos+2] = value["data"][y][x][0];  
  
              //Setting alpha channel
              buffer[pos+3] = 255;
          }
        }
        
        // create off-screen canvas element
        var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
  
        canvas.width = width;
        canvas.height = height;
  
        // create imageData object
        var idata = ctx.createImageData(width, height);
  
        // set buffer as source
        idata.data.set(buffer);
  
        // update canvas with new data
        ctx.putImageData(idata, 0, 0);
  
        // produces a PNG file with an url
        var dataUri = canvas.toDataURL(); 
        
        // create an image object
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
  
  
  //Section of run model
  
  //General run of Yolov4 model, recibe a tensor and run it
  async function runOnnxModel(tensor){
    const input = new String(session.inputNames[0]);
    const feeds = {[input] : tensor};
    // Run model with Tensor inputs and get the result.
    const result = await session.run(feeds);
    return result;
  }
  
  
  //Run the onnx model from the image loaded in page
  async function runSingleModel(imageSize){
    const tensor = await getTensorFromImage(imageSize);
    const result = await runOnnxModel(tensor)
    onDownload(result,"output.json");
  }
  
  //Run the model obtaining a batch or an image from an url
  async function runBatchModel(yoloWidth, yoloHeight, url, fileName){
    const imageArray = await getImagesArray(url)
    
    var startTime = performance.now();
    const tensorImages = await getTensorFromBatch(yoloWidth,yoloHeight, imageArray);
    const result = await runOnnxModel(tensorImages)
    var finishTime = performance.now() - startTime;
    return finishTime;
    //onDownload(result,fileName);
  }