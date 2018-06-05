'use strict';

const express = require('express');
const mongo = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const urlExists = require('url-exists');

mongoose.connect(process.env.MONGODB, {useMongoClient: true});

// create MongoDB schema and model
var urlSchema = new mongoose.Schema ({
  original_url: String,
  short_url: String
});

var Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
 
app.get("/", (req, res) => {
    res.sendFile('index.html', { root: 'views'});
});

// redirects to original url
app.get("/api/shorturl/:short_url?", (req, res, next) => {
  
  const url = req.params.short_url;
  
  // search for an entry in DB
  Url.findOne({"short_url":url}, (error, data) => {
    
    if (error) {
      throw error;
    } else {
      // if found then redirect to original url
      if (data !== null){
        res.redirect(data.original_url);
      } else {
        // if not found then show an error message
        res.json({"error":"URL does not exist"});
        next();
      };
    };
  });
});


app.post("/api/shorturl/new", (req, res) => {
  
  var short_url = 0;
  
  // first check if URL is valid
  urlExists(req.body.originalUrl, (error, exists) => {
        
    if (!error && exists) {
      
      // search if it is already in DB
      Url.findOne({original_url:req.body.originalUrl}, (error, data) => {

        if (data === null) {
            // here we need to know a short url for a last entry
            Url.find({}, {_id:0, "short_url":1})
              .sort({"short_url":-1})
              .limit(1)
              .exec((err, shorturls) => {
                if (!err){
                  // if it is first entry than set short url to 0
                  if (!shorturls[0]){
                        short_url = 0;
                      } else {
                  // else increment the short url
                        short_url = Number(shorturls[0].short_url) + 1;
                      };
                      // then create a new entry in db
                      Url.create({original_url: req.body.originalUrl,short_url:short_url}, (error, data) => {
                        if (!error) {
                          res.json({original_url: data.original_url, short_url: data.short_url});
                        };
                      });
                  };
              });
          } else {
            // if the url is already in db then show the db entry
            res.json({original_url: data.original_url, short_url: data.short_url});
          };
      });
    } else {
      // show an error if the url is invalid
      res.json({"error":"invalid URL"});
    };
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});