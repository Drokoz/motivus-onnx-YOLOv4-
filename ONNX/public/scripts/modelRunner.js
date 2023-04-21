//import { download, onDownload } from "./downloader.js";

//Section of run model

//General run of Yolov4 model, recibe a tensor and run it
async function runOnnxModel(tensor) {
  const input = new String(session.inputNames[0]);
  const feeds = { [input]: tensor };

  //console.log("printing session");
  // Run model with Tensor inputs and get the result.
  const result = await session.run(feeds);
  return result;
}

//Run the onnx model from the image loaded in page
async function runSingleModel(imageSize, arrayExpected, modelName) {
  var startTime = performance.now();
  const tensor = await getTensorFromImage(imageSize, arrayExpected, modelName);
  var startTime2 = performance.now();
  const result = await runOnnxModel(tensor);
  var finishTime2 = performance.now() - startTime2;
  console.log("Tiempo procesado en ejecución modelo: ", finishTime2);
  console.log("Tiempo procesado total: ", finishTime);
  var finishTime = performance.now() - startTime;
  console.log("Tiempo procesado total: ", finishTime);
  onDownload(result, "output.json");
}

//Run the model obtaining a batch or an image from an url
async function runBatchModel(
  imageSize,
  arrayExpected,
  url,
  fileName,
  modelName
) {
  const imageArray = await getImagesArray(url);

  var startTime = performance.now();
  const tensorImages = await getTensorFromBatch(
    imageSize,
    imageArray,
    arrayExpected,
    modelName
  );
  var startTime2 = performance.now();
  const result = await runOnnxModel(tensorImages);
  var finishTime2 = performance.now() - startTime2;
  //console.log("Tiempo procesado en ejecución modelo: ", finishTime2);
  var finishTime = performance.now() - startTime;
  console.log("Tiempo procesado total: ", finishTime);
  return finishTime;
  onDownload(result, fileName);
}

//Run a benchmark of repetition with up to 5 images in batch
//Goes from 1 image to 5 images
async function runBenchmark(
  imageSize,
  arrayExpected,
  repetitions,
  modelName,
  backend
) {
  //console.log(width, height);

  //Create arrays than will have the jason
  var timesJson = [];
  var timesJsonAvg = [];

  //Start the repetitions
  for (let rep = 0; rep < repetitions; rep++) {
    //create json for each repetition
    timesJson[rep] = {};
    timesJsonAvg[rep] = {};

    //Start the benchmark
    for (let index = 1; index < 6; index++) {
      //Create json for each one
      timesJson[rep][index] = {};
      timesJsonAvg[rep][index] = {};
      //console.log("Test " + index);

      var finishTime = await runBatchModel(
        imageSize,
        arrayExpected,
        "http://localhost:3000/getImages" + index,
        "test" + index + ".json",
        modelName
      );
      // console.log("Time total: ");
      // console.log(finishTime);

      // console.log("Time per Image: ");
      // console.log(finishTime / index);
      // console.log("----------------");

      //Saving time in seconds in the rep + amount of images
      timesJson[rep][index] = finishTime / 1000;

      //Saving time avarege per images
      timesJsonAvg[rep][index] = finishTime / 1000 / index;
    }
  }
  //Saving documents to json file to be proccesed

  console.log(timesJson);
  onDownload(timesJson, modelName + "-" + backend + ".json");
  onDownload(timesJsonAvg, "avg-" + modelName + "-" + backend + ".json");
}

//Obtains an array of images connecting to an url
async function getImagesArray(url) {
  const jsonData = await fetch(url)
    .then(function (response) {
      // The response is a Response instance.
      // You parse the data into a useable format using `.json()`
      return response.json();
    })
    .then(async function (data) {
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
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var pos = (y * width + x) * 4; // position in buffer based on x and y
            //Setting RGB value
            buffer[pos] = value["data"][y][x][2];
            buffer[pos + 1] = value["data"][y][x][1];
            buffer[pos + 2] = value["data"][y][x][0];

            //Setting alpha channel
            buffer[pos + 3] = 255;
          }
        }

        // create off-screen canvas element
        var canvas = document.createElement("canvas"),
          ctx = canvas.getContext("2d");

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
        const imgA = new Image(value["shape"][1], value["shape"][0]);
        imgA.data = value["data"];
        //console.log(img);

        imgA.onload = function () {
          imgA.width = this.width;
          imgA.height = this.height;
        };
        imgA.src = dataUri;
        //document.body.appendChild(imgA);
        imgArray[k] = imgA;
        imgArrayNames[k] = key;
        k = k + 1;
      });
      return imgArray;
    });
  return jsonData;
}
