//Handles filesystem actions related to creating and recreating output folder and its contents
'use strict'
//const Stream = require('stream');


exports.createOutputDir= async function createDir(fs,path,dirName,workBook,myxlsx,prepareRequests) {
  //copy file to destination function
  let copyFile = (sourceFile, destination)=>{
    
    let basename = path.basename(sourceFile);
    //console.log(f);
    let source = fs.createReadStream(sourceFile);
    let dest = fs.createWriteStream(path.resolve(destination, basename));
  
    source.pipe(dest);

    source.on('end', function() {
       console.log(`${sourceFile} coppied from backup folder`);
       });

    source.on('error', function(err) { 
      
      console.log(`${sourceFile} not yet available`); 

      if (basename == "output.json") {

        fs.writeFile("./output/output.json",JSON.stringify([]),()=>{

          console.log("istantiated output backup file")

                     })
      }
    
    
    });
 
  };

  
 fs.mkdir(dirName, async  (err,path) => {
  
    if (err && err.code=='EEXIST')
    {
     
       await  copyFile("./output/output.json", "./archivehistorybackup")

      
        console.log("Making new ouput directory... @ filesys.js, line 19")
        console.log("Output Folder recreated succesfullly @ filesys.js ,line 14")
            
       await  myxlsx.writeFile(workBook,"./output/input_data.xlsx")

        
        console.log("input file created @ filesys, line 18")

        setTimeout(() => {
          prepareRequests();
        }, 5000);
        
         
    }
    
    else
      {
      
      myxlsx.writeFile(workBook,"./output/input_data.xlsx")
      fs.writeFile("./output/output.json",JSON.stringify([]),()=>{
      console.log("istantiated output backup file")
                 })
      setTimeout(() => {
        prepareRequests()
      }, 5000);

      }

  });}
