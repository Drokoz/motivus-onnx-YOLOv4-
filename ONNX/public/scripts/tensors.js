//Section of tensors

//Get tensor from the image loaded in page
async function getTensorFromImage(imageSize, arrayExpected, modelName) {
  //This commented section is for another preprocess steps
  //var img = document.getElementById("image_url")

  const img = new Image();
  img.onload = function () {
    imgElement = document.getElementById("image_url");
    console.log(imgElement);
    img.width = this.width;
    img.height = this.height;
  };
  img.src = document.getElementById("image_url").value;

  // Preprocess the image data to match input dimension requirement, 1x416x416x3
  const width = imageSize;
  const height = imageSize;

  const preprocessedData = preprocess[modelName](width, height, img);

  const inputTensor = new ort.Tensor(
    "float32",
    preprocessedData.data,
    arrayExpected
  );

  return inputTensor;
}

//Get tensor from an imgArray
async function getTensorFromBatch(
  imageSize,
  imgArray,
  arrayExpected,
  modelName
) {
  k = 0;
  const countImages = imgArray.length;
  arrayExpected[0] = countImages;
  //console.log(imageSize);
  const processArray = ndarray(
    new Float32Array(countImages * imageSize * imageSize * 3),
    arrayExpected
  );
  for (let i = 0; i < countImages; i++) {
    const element = imgArray[i];
    const preprocessedData = preprocess[modelName](
      imageSize,
      imageSize,
      element
    );
    ndarray.ops.assign(
      processArray.pick(k, null, null, null),
      preprocessedData
    );
    k = k + 1;
  }
  //   console.log(processArray);
  //   console.log(arrayExpected);
  const inputTensor = new ort.Tensor(processArray.data, arrayExpected);

  return inputTensor;
}
//Case manegment to call diferent preprocess steps
const preprocess = {
  //Preprocess raw image data to match YoloV4 requirement.
  yolo: function preprocessYOLO(width, height, img) {
    //width and height = iw, ih

    //Obtaining real values of width and height
    const realHeight = img.height;
    const realWidth = img.width;

    //Scaling image
    const scale = Math.min(height / realHeight, width / realWidth);
    const newWidth = parseInt(realWidth * scale);
    const newHeight = parseInt(realHeight * scale);
    console.log(scale, newWidth, newHeight, realWidth, realHeight);

    //Creating a mat to use cv
    let mat = cv.imread(img);

    //Resize
    let image_resized = new cv.Mat();
    let dsize = new cv.Size(newWidth, newHeight);
    cv.resize(mat, image_resized, dsize, 0, 0, cv.INTER_LINEAR);

    //Create array from images and processed data
    const imageResized = ndarray(new Float32Array(image_resized.data), [
      newHeight,
      newWidth,
      4
    ]);
    console.log(imageResized);

    const arrayExpected = [height, width, 3];
    //const arrayExpected = [3, height, width]
    const imagePadded = ndarray(
      new Float32Array(width * height * 3),
      arrayExpected
    );

    //Asigns 128 to make an np.full
    ndarray.ops.assigns(imagePadded, 128.0);

    const dWidth = Math.floor((width - newWidth) / 2);
    const dHeight = Math.floor((height - newHeight) / 2);

    ndarray.ops.assign(
      imagePadded
        .hi(dHeight + newHeight, dWidth + newWidth, null)
        .lo(dHeight, dWidth, null),
      imageResized.hi(null, null, 3)
    );
    //ndarray.ops.assign(imagePadded.hi(null, dHeight+newHeight, dWidth+newWidth).lo(null, dHeight, dWidth), imageResized.hi(3, null, null));
    ndarray.ops.divseq(imagePadded, 255.0);

    return imagePadded;
  },
  //Preprocess raw image data to match Resnet requirement. (N x 3 x H x W),
  resnet: function preprocessResnet(width, height, img) {
    let mat = cv.imread(img);

    //Resize
    let image_resized = new cv.Mat();
    let dsize = new cv.Size(width, height);
    cv.resize(mat, image_resized, dsize, 0, 0, cv.INTER_LINEAR);

    //console.log("checking");
    //Create array from images and processed data
    const arrayExpected = [height, width, 4];

    const arrayExpected2 = [3, height, width];

    const dataFromImage = ndarray(
      new Float32Array(image_resized.data),
      arrayExpected
    );
    const dataProcessed = ndarray(
      new Float32Array(width * height * 3),
      arrayExpected2
    );

    // Normalize 0-255 to (-1)-1
    ndarray.ops.divseq(dataFromImage, 128.0);
    ndarray.ops.subseq(dataFromImage, 1.0);

    // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
    ndarray.ops.assign(
      dataProcessed.pick(0, null, null),
      dataFromImage.pick(null, null, 2)
    );
    ndarray.ops.assign(
      dataProcessed.pick(1, null, null),
      dataFromImage.pick(null, null, 1)
    );
    ndarray.ops.assign(
      dataProcessed.pick(2, null, null),
      dataFromImage.pick(null, null, 0)
    );

    return dataProcessed;
  }
};
