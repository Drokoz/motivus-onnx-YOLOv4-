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
  //Run a benchmark of repetition with up to 5 images in batch
  //Goes from 1 image to 5 images
  async function benchmark(yoloWidth, yoloHeight, repetitions){
    var timesJson = [];
    for (let rep = 0; rep < repetitions; rep++) {
      timesJson[rep] = {}
      for (let index = 1; index < 6; index++){
        timesJson[rep][index]={}
        console.log("Test "+index);
   
        var finishTime = await runBatchModel(yoloWidth, yoloHeight,'http://localhost:3000/getImages'+index, "test"+index+".json")
        
        console.log("Time total: ");
        console.log(finishTime);
  
        console.log("Time per Image: ");
        console.log(finishTime/index);
        console.log("----------------");
        timesJson[rep][index] = finishTime/1000;
        //timesJson[rep][index]['avarage'] = (finishTime/index);
      }
    }
    console.log(timesJson);
    onDownload(timesJson, "timesChromeParallel.json");
  }
  