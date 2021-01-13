const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer")
const path = require("path")
const childProcess =  require('child_process');
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname,"views"))

var name = '';
var thumbnail_image = null;
const maxSize = 200 * 1000 * 1000;  // 200MB max size

var storage_vid = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads")
    },
    filename: function (req, file, cb) {
      name = "video.mp4";
      cb(null, "video.mp4")
    }
  })

var upload_vid = multer({
    storage: storage_vid,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb){
        var filetypes = /mp4/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	
        if (mimetype && extname) {
            return cb(null, true);
        }
        else{
          cb("Error: File upload only supports the " + "following filetypes - " + filetypes);
              }
      }
}).single("video");

var storage_img = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/thumbnails")
    },
    filename: function (req, file, cb) {
      cb(null, "image.jpg")
    }
  })

var upload_img = multer({
    storage: storage_img,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb){
        var filetypes = /jpg|JPG|jpeg|JPEG|png|PNG/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	
        if (mimetype && extname) {
            return cb(null, true);
        }
        else{
          cb("Error: File upload only supports the " + "following filetypes - " + filetypes);
              }
      }
}).single("image");


app.get("/", function(req, res) {
  res.render("home");
});


app.post("/uploadVideo", function (req, res, next) {
    
    upload_vid(req, res, (err) => {
        if(err) {
            res.send(err)
        }
        else {
            pathToFile = path.join('uploads/', name);
            res.render("home_with_video", {videoPath: pathToFile, thumbnailPath: thumbnail_image });
        }
    });
});

app.post("/", (req, res) => {
  var t1 = Number(req.body.t1);
  var t2 = Number(req.body.t2) - t1;
  
  var start_time = ""; 
  var duration = "";
  for (let i=2; i>=0; i--) {
  	n1 = Math.floor(t1/Math.pow(60, i))
  	n2 = Math.floor(t2/Math.pow(60, i))
  	if (i!=0) {
  		if (n1/10<1) {
	  	start_time = start_time + '0' + n1 + ":";
	  	} else {
	  	start_time = start_time + "" + n1 + ":";
	  	}
	  	if (n2/10<1) {
	  	duration = duration + '0' + n2 + ":";
	  	} else {
	  	duration = duration + "" + n2 + ":";
	  	}
  	} else {
  		n1 = Math.floor(t1%60)
  		n2 = Math.floor(t2%60)
  		if (n1/10<1) {
	  	start_time = start_time + '0' + n1;
	  	} else {
	  	start_time = start_time + "" + n1;
	  	}
	  	if (n2/10<1) {
	  	duration = duration + '0' + n2;
	  	} else {
	  	duration = duration + "" + n2;
	  	}
  	}
  }
  if (name){
  pathToFile = path.join(__dirname,  '/public/uploads/', name);
  var newName = "output-" + Date.now()+".mp4";
  pathToOutput = path.join(__dirname, '/public/uploads/', newName);
  childProcess.exec(('ffmpeg -ss ' + start_time + ' -i ' + pathToFile + ' -to ' + duration + ' -c copy ' + pathToOutput), function () {
     name = newName
     pathToFile = path.join('uploads/', name);
     thumbnail_image = "thumbnails/image.jpg";
     thumbnailPath: thumbnail_image
     res.render("trim", {videoPath: pathToFile, thumbnailPath: thumbnail_image });
  });
  } else {
  	res.send("No File was uploaded");
  }
});
app.post("/show_thumbnails", (req, res) => {
    upload_img(req, res, (err) => {
        if(err) {
            res.send(err)
        } else {
            thumbnail_image = "thumbnails/image.jpg";
            pathToFile = path.join('uploads/', name);
            res.render("home_with_video", {videoPath: pathToFile, thumbnailPath: thumbnail_image });
        }
    });
});

app.post("/thumbnails", (req, res) => {
  var t1 = Number(req.body.time);
  
  var time = "";
  for (let i=2; i>=0; i--) {
  	n1 = Math.floor(t1/Math.pow(60, i))
  	if (i!=0) {
  		if (n1/10<1) {
	  	time = time + '0' + n1 + ":";
	  	} else {
	  	time = time + "" + n1 + ":";
	  	}
  	} else {
  		n1 = Math.floor(t1%60)
  		if (n1/10<1) {
	  	time = time + '0' + n1;
	  	} else {
	  	time = time + "" + n1;
	  	}
  	}
  }
  
  if (name){
  pathToFile = path.join(__dirname,  '/public/uploads/', name);
  var newImName = "image.jpg";
  pathToOutput = path.join(__dirname, '/public/thumbnails/', newImName);
  childProcess.exec("rm " + pathToOutput);
  thumbnail_image = "thumbnails/image.jpg"
  childProcess.exec(("ffmpeg -i " + pathToFile + " -ss " + time + " -r 1 -an -vframes 1 -f mjpeg " + pathToOutput), function(err) {
       pathToFile = path.join('uploads/', name);
       res.render("add_thumbnail", {videoPath: pathToFile, imagePath: "thumbnails/" + newImName, thumbnailPath: thumbnail_image});
  });
  } else {
  	res.send("No File was uploaded");
  }
});

app.get("/about", function(req, res) {
  res.render("about");

});

app.get("/contact", function(req, res) {
  res.render("contact");

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});

