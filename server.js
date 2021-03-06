var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
//const db = require("./views/js/db.js"); 
var cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const keys = require("./config/keys.js");
const morgan = require("morgan");
var logger = require('logger').createLogger(); 
var utils = require('utils');

// Enable ejs
app.set('view engine', 'ejs');
app.use(express.json());

var router = express.Router();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false 
}));

app.use(cookieParser('how-are-you'));

app.use(cookieSession({
  maxAge: 1000 * 60, // age of 1min 
  keys: [keys.session.cookieKey]
}));


// create application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// parse application/json
app.use(bodyParser.json())

let mydb, cloudant;
var vendor; // Because the MongoDB and Cloudant use different API commands, we
            // have to check which command should be used based on the database
            // vendor.
var dbName = 'mydb';
var dbLeaderboard = 'leaderboard'; 
var dbQuestions = 'questions'; 

// Separate functions are provided for inserting/retrieving content from
// MongoDB and Cloudant databases. These functions must be prefixed by a
// value that may be assigned to the 'vendor' variable, such as 'mongodb' or
// 'cloudant' (i.e., 'cloudantInsertOne' and 'mongodbInsertOne')

var insertOne = {};
var getAll = {};
var checkExist = {}; 
var getIndex = {};
var checkExist = {};
var queryDB = {};



/* Initialize Cloudant DB from IBM
 * tutorial
 */ 

const Cloudant = require('@cloudant/cloudant');

const vcap = require('./vcap-local.json');

function dbCloudantConnect() {
    return new Promise((resolve, reject) => {
        Cloudant({  // eslint-disable-line
            //url: vcap.services.cloudantNoSQLDB.credentials.url
            url: "https://5a395d49-fbe3-4d7d-a999-29a1463932f1-bluemix:61ea763f4c23474b6328259df24ff74e6aa82ff15491aed83e9da9ab99a32585@5a395d49-fbe3-4d7d-a999-29a1463932f1-bluemix.cloudantnosqldb.appdomain.cloud"
        }, ((err, cloudant) => {
            if (err) {
                //logger.error('Connect failure: ' + err.message + ' for Cloudant DB: ' +
                  //  appSettings.cloudant_db_name);
                reject(err);
            } else {
                let db = cloudant.use('mydb');
                //logger.info('Connect success! Connected to DB: ' + 'mydb');
                resolve(db);
            }
        }));
    });
}

let db;

// Initialize the DB when this module is loaded
(function getDbConnection() {
    //logger.info('Initializing Cloudant connection...', 'items-dao-cloudant.getDbConnection()');
    dbCloudantConnect().then((database) => {
        //logger.info('Cloudant connection initialized.', 'items-dao-cloudant.getDbConnection()');
        db = database;
    }).catch((err) => {
        //logger.error('Error while initializing DB: ' + err.message, 'items-dao-cloudant.getDbConnection()');
        throw err;
    });
})();


/* Query DB with partial selector */ 

function findByDescription(partialDescription) {
    return new Promise((resolve, reject) => {
        let search = partialDescription;
        db.find({
            "selector": {
                  "loginCookie": search
            } 
        }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function teacherSubjectQuery(teacherCookie){
    return new Promise((resolve, reject) => {
        db.find({
            "selector": {
                "loginCookie": teacherCookie,
                "type": "user"
            }
        }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function schoolClassQuery(){
    return new Promise((resolve, reject) => {
        db.find({
            "selector": {
                "type": "module"
            }
        }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function loginQuery(username, password) {
  return new Promise((resolve, reject) => {
    
      db.find({
          "selector": {
                "type": "user",
                "_id": username, 
                "password": password
          } 
      }, (err, documents) => {
          if (err) {
              reject(err);
          } else {
              //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
              resolve((documents.docs));
          }
      });
  });
}

function cookietoName(cookie){
      return new Promise((resolve, reject) => {
        let search = cookie;
        db.find({
            "selector": {
                  "type": "user",
                  "loginCookie": search
            } 
        }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function findQuestionDB (school) {
  return new Promise((resolve, reject) => {
  
      db.find({
          "selector": {
                "type": {
                  "$eq": "question"
                },
                "school": {
                  "$eq": school
                }
          } 
      }, (err, documents) => {
          if (err) {
              reject(err);
          } else {
              //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
              resolve((documents.docs));
          }
      });
  });
}

function findUserDB (email, password) {
return new Promise((resolve, reject) => {
          db.find({
          "selector": {
                "email": {
                  "$eq": email
                },
                "password": {
                  "$eq": password
                }
          } 
      }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function findDBmodule(school){
    return new Promise((resolve, reject) => {
          db.find({
          "selector": {
                "school": school,
                "type": "module"
                    
          } 
      }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                //resolve({ data: JSON.stringify(documents.docs), statusCode: (documents.docs.length > 0) ? 200 : 404 });
                resolve((documents.docs));
            }
        });
    });
}

function deleteQuestionEntry(questionID) {
  return new Promise((resolve, reject) => {
    db.get(questionID, function(err, body) {
      if (!err) {
        var latestRev = body._rev;
        db.destroy(questionID, latestRev, function(err, body, header) {
          if (!err) {
              console.log("Successfully deleted doc", questionID);
          }
        });
      }
    }, (err, documents) => {
        if (err) {
          reject(err);
        } else {
          documents.passed = true; 
          resolve(documents); 
        }
    })
  })
}


// get indexes of DB 
getIndex.cloudant = function(res) {
  mydb.index(function(err, result) {
    if (err) {
      throw err;
    }

    console.log('The database has %d indexes', result.indexes.length);
    for (var i = 0; i < result.indexes.length; i++) {
      console.log('  %s (%s): %j', result.indexes[i].name, result.indexes[i].type, result.indexes[i].def);
    }

    result.should.have.a.property('indexes').which.is.an.Array;
    done();
  });
}

// query with selector from DB 
queryDB.cloudant = function(query) {
  // query of form -- { selector: { name:'Alice' } } 
  mydb.find(query, function(err, result) {
    if (err) {
      throw err;
    }

    console.log('Found %d documents with selector', result.docs.length);
    for (var i = 0; i < result.docs.length; i++) {
      console.log('  Doc id: %s', result.docs[i]._id);
    }
  });
}

// insert JSON in DB 
insertOne.cloudant = function(doc) {
  mydb.insert(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insert] ', err.message);
      //response.send("Error");
      return;
    }
    //doc._id = body.id;
    //callback(err, body); 
  });
}

getAll.cloudant = function(response) {
  var names = [];  
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
  //return names;
}

checkExist.cloudant = function(doc) {
    

    
    return mydb.find(doc.username).then(res=>{
        return res;
    }).catch(err=>{
        console.log("Couldn't find username");
        return err;
    });
}

// Register users 
app.post("/registerUser", urlencodedParser, function (req, res, done) {
  console.log("Register new user");
  var username = req.body.username;
  var email    = req.body.email;
  var password = req.body.password; 
  var repPassword = req.body.repeatPassword;  
  var school = req.body.school;
  var accountType = req.body.accountType;
  var classList = req.body.classTag;


  // Register the number of modules in classTag list 
  console.log(req.body.classTag);
  /*for (var i = 0; i < req.body.classTag.length; i++) {
    if (req.body.classTag[i] == "Other") {
      classList.push(req.body.classTag[i+1]); 
      i++;
    }
    else {
      classList.push(req.body.classTag[i]);
    }
  }*/

  // initialize score list 
  
  console.log(typeof(classList));
  var scoreList = []; 
  var otherIndex = classList.indexOf("Other");
  if(otherIndex > -1) classList.splice(otherIndex, 1);
if(typeof(classList) == "object"){
    for (var i = 0; i < classList.length; i++) {
        scoreList.push(0); 
    }
}
else{
    scoreList.push(0);
}
console.log("ScoreList: " + scoreList);
  var type = "user"; 

  // pass checks 
  if (password != repPassword) {
    return done (Error ('Non-repeated password'));
  }
  else {

    var randomNumber = (Math.floor(Math.random() * 100000000000) + 100000000000).toString().substring(2);
    console.log(randomNumber);
    console.log('cookie created successfully');

    var doc = { "_id": username, "type" : type, "accountType":accountType, "email" : email, "password" : password, "school" : school, "classTag" : classList, "loginCookie" : randomNumber, "score" : scoreList};
  
    console.log(doc);
    var classArray = [];
    if(typeof(classList) == "string"){
        classArray.push(classList);
    }
    else{
        classList.forEach(c => {
            classArray.push(c);
        })
    }
    
    
    findDBmodule(school).then(function(v){
        let modules = v.map(s => s.module)
        modules.push("Other");
        console.log(modules);
        let addClasses = classArray.filter(el => modules.indexOf(el) < 0);
        console.log("This is Add Classes" + addClasses);
        console.log("This is Modules" + modules);
        addClasses.forEach(c => {
            let qdoc = {"school": school, "module": c, "type":"module"}
                db.insert(qdoc, function(err, body, header) {
                    if (err) {
                        console.log('[mydb.insert] ', err.message);
                        //response.send("Error");
                        return;
                    }
                    else{
                        console.log("added module");
                    }
                });})
            })
    
    db.insert(doc, function(err, body, header) {
      if (err) {
        console.log('[mydb.insert] ', err.message);
        res.redirect('/register')
        //response.send("Error");
        return;
      } else {
        res.cookie('loginKey', randomNumber); 
        
        if(accountType == "Teacher")
        res.redirect('/questionForm');  
        else{
            res.redirect('/studentRegistered.html');
        }
      }
      //doc._id = body.id;
      //callback(err, body); 
    }); 
    
  }

  
})

app.post("/loginUser", urlencodedParser, function (req, res, done) {
  console.log("User Login");
  var email    = req.body.email;
  var password = req.body.password; 

  var type = "user"; 

  
  findUserDB(email, password).then( function(dbData) {

  res.cookie('loginKey', dbData.loginCookie); 
  res.redirect('/questionForm');  
    })
})
// Submit question
app.post("/submitQuestion", urlencodedParser, function (req, res, done) {
  console.log("Submit new question");

  // find user requesting 
  //var userID = findByDescription(req.cookie); 
  console.log(req.cookies.loginKey);


  findByDescription(req.cookies.loginKey.toString()).then(function(v) {
    var _class = v[0].classTag[0]; 
    var school = v[0].school; 
    console.log(req.body.question);

    var type = "question";
    var module = req.body.module;
    console.log(module);
    var week   = req.body.week;
    var question = req.body.question; 
    var answer = req.body.answer;  
    var teacher = v[0]._id; 
    var difficulty = req.body.difficulty; 
    var wrong1 = req.body.wrong1; 
    var wrong2 = req.body.wrong2; 
    var wrong3 = req.body.wrong3; 
    var wrong4 = req.body.wrong4; 


    var doc = {"type" : type, "module" : module , "week" : week, "question" : question, "answer" : answer, "classTag" : _class, "school" : school, "teacher" : teacher, "difficulty": difficulty, "wrong1": wrong1, "wrong2": wrong2, "wrong3": wrong3, "wrong4": wrong4};


    // json to store question 
    // need to find cookie to store it right 

    console.log(doc.answer);

    db.insert(doc, function(err, body, header) {
      if (err) {
        console.log('[mydb.insert] ', err.message);
        //response.send("Error");
        return;
      }

      doc._id = body.id;
      res.redirect('/questionForm');
      
      //callback(err, body); 
    }); 
    
  }); 
  
  
  
  //console.log(JSON.stringify(documents.docs));


  
  
})

// Get leaderboard values from leaderboard collection and publish all
// of them in URL 
// use find() method to filter players  
// players should fill the following params -> score, class, ...
app.get('/getLeaderboard', (req,res)=>{

  var queryParameter = req.query; 
  //res.json(queryParameter); 

  db.getDB().collection(collection).find(queryParameter).toArray((err, documents)=>{
      if(err) {
          console.log(err);
      }
      else{
          console.log(documents); 
          res.json(documents); 
      }
  })
});

app.post('/deleteEntry', (req, res) => {
  
  console.log("request sent");
  var userCookie = req.cookies.loginKey.toString(); 
  var questionDeleteId = req.body.questionDeleteId;
  console.log(req.body);
  console.log(questionDeleteId);
  if (questionDeleteId != null) {

        deleteQuestionEntry(questionDeleteId).then( function(v) {
        }); 
  }

  console.log("request sent");
  var userCookie = req.cookies.loginKey.toString()  ; 

})


app.get('/getQuestion', (req, res) =>{
    console.log("request sent");
  var userCookie = req.cookies.loginKey.toString()  ; 
  // req.cookies.loginKey.toString() 
    
  findByDescription(userCookie).then( function(v) {
    
    var user = v[0]._id; 
    console.log(user);
    // fetched user making request 
    // fetch questions from user now 
    findQuestionDB(v[0].school).then( function(dbData) {
      var questions = dbData; 
      module.exports.dbData = dbData;
      console.log(dbData); 
      //res.json(dbData); 
      cookietoName(userCookie).then(function(userName) {
          var name = userName[0]._id;
          console.log(userName);
          res.render('getQuestion', {formsub: questions, name});
      })
    })
  })

  // res.json(documents); 
})

app.get('/questionForm', (req, res) =>{
    var userCookie = req.cookies.loginKey.toString();
    teacherSubjectQuery(userCookie).then(function(teacherData){
       console.log(teacherData);
       module.exports.teacherData = teacherData;
       console.log("Display ClassTag" + teacherData[0].classTag);
        res.render('questionForm', {questionSub: teacherData[0].classTag});
    })
});

app.get('/register', (req, res) => {
    schoolClassQuery().then(function(schoolClassData){
        console.log(schoolClassData);
        let schools = schoolClassData.map(s => s.school);
        let sortedSchools = schools.sort();
        var uniqueSchools = [sortedSchools[0]];
        for (var i = 1; i < sortedSchools.length; i++) {
            if (sortedSchools[i-1] !== sortedSchools[i]) {
            uniqueSchools.push(sortedSchools[i]);
            }
        }
        var temp = [];
        var schoolModuleList = [];
        for(var i = 0; i < uniqueSchools.length; i++){
            schoolClassData.forEach(c => {
                if(c.school == uniqueSchools[i]){
                    temp.push(c.module);
                }
            })
            console.log(temp);
            schoolModuleList.push(temp);
            temp = []
        }
        console.log(schools);
        console.log(sortedSchools);
        console.log(uniqueSchools);
        var jsonString = "[";
        for(var i = 0; i < uniqueSchools.length; i++){
            jsonString += '{"' + uniqueSchools[i] + '":' + JSON.stringify(schoolModuleList[i]) + '},';
        }
        console.log(jsonString);
        jsonString = jsonString.substring(0, jsonString.length - 1);
        jsonString += "]";
        console.log(jsonString);
        
        var formData = JSON.parse(jsonString);
        
        res.render('register', {formData: formData, uniqueSchools: uniqueSchools});
    });
})

// login check 
app.post('/loginCheck', urlencodedParser, function (req, res) {
  console.log("Login");

  if (!req.body) return res.sendStatus(400)
  console.log('welcome, ' + req.body.username); 

  var userName = req.body.username;
  var password = req.body.password; 

  
  if(!mydb) {
    console.log("No database.");
    res.send(doc);
    return;
  } else{
    
    loginQuery(userName, password).then(function(v) {
      if (v.length != 0) {
        console.log(v);
        // login successful 

        // get user data 
        var _class = v[0].classTag;
        var school = v[0].school; 
        var email = v[0].email; 
        var type = v[0].type; 
        var score = v[0].score;


        // create cookie 
        var randomNumber = (Math.floor(Math.random() * 100000000000) + 100000000000).toString().substring(2);
        console.log(randomNumber);
        res.cookie('loginKey', randomNumber);
        console.log('cookie created successfully');
    
        var doc = {"_id" : userName, "password" : password, "loginCookie" : randomNumber, "_rev" : v[0]._rev, "school" : school, "classTag": _class, "type" : type, "email" : email, "score": score};
        console.log(doc);
        // Update user cookie 
        db.insert(doc, function(err, body, header) {
          if (err) {
            console.log('[mydb.insert] ', err.message);
            //response.send("Error");
            return;
          }
        });
        
        return res.redirect('/questionForm');
      }
      else {
        // login unsuccessful 
        return res.redirect('/'); 
      }
    })

  }

  
});

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['compose-for-mongodb'] || appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/)) {
  // Load the MongoDB library.
  var MongoClient = require('mongodb').MongoClient;

  dbName = 'mydb';

  // Initialize database with credentials
  if (appEnv.services['compose-for-mongodb']) {
    MongoClient.connect(appEnv.services['compose-for-mongodb'][0].credentials.uri, null, function(err, db) {
      if (err) {
        console.log(err);
      } else {
        mydb = db.db(dbName);
        console.log("Created database: " + dbName);
      }
    });
  } else {
    // user-provided service with 'mongodb' in its name
    MongoClient.connect(appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/).credentials.uri, null,
      function(err, db) {
        if (err) {
          console.log(err);
        } else {
          mydb = db.db(dbName);

          console.log("Created database: " + dbName);
        }
      }
    );
  }

  vendor = 'mongodb';
} else if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/[Cc][Ll][Oo][Uu][Dd][Aa][Nn][Tt]/)) {
  // Load the Cloudant library.
  //var Cloudant = require('@cloudant/cloudant');
  //var cloudant = Cloudant({ account:username, password:password });
  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
    // CF service named 'cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
    console.log(appEnv.services['cloudantNoSQLDB'][0].credentials);
    console.log("First");
  } else {
     // user-provided service with 'cloudant' in its name
     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
     console.log("Second");
  }
} else if (process.env.CLOUDANT_URL){
  cloudant = Cloudant(process.env.CLOUDANT_URL);
  console.log("Third");
}

if(cloudant) {
  //database name
  dbName = 'mydb';
  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) { //err if database doesn't already exists
      console.log("Created database: " + dbName);
    }
    else {
      console.log(err);
    }
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);

  vendor = 'cloudant';
}



//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
