const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false })); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route("/api/users").get((req,res) => {
  console.log("start GET /api/users/");
  User.find({}, function (err,data){
    if(err) return done(err);
    res.json(data);
  });
  console.log("end GET /api/users/");
}).post((req,res) => {
  console.log("start POST /api/users/");
  User.create({ username: req.body.username }, function (err, user) {
    if (err) console.error ('err');
    res.json({"username":req.body.username,"_id":user._id});
  });
  console.log("end POST /api/users/");
});



app.route("/api/users/:_id/exercises").post(async (req,res) => {
  var tDate = new Date();
  if (req.body.date !='' && req.body.date !==undefined){
    tDate = new Date(req.body.date);
  }
  
  User.findById(req.params._id, function(err,user){
    if (err){
      console.error('this one');
      res.json({"error":"user id not found"});
      return (err);
    }
    
    if(user===null){
      console.error('e6');
      res.json({"error":"user id not found "+req.params._id});
    }
    Exercise.create({//userid: req.params._id,
                  description: req.body.description, 
                  duration: req.body.duration,
                  date: tDate.toDateString()}, function (err,exercise){
      if(err) {
        console.error('failed to create exercise', ({userid: req.params._id,
                  description: req.body.description, 
                  duration: req.body.duration,
                  date: tDate.toDateString()}));
        res.json(err);
      }
      if(exercise === null || exercise ===undefined){
        console.error('exercise null or undef');
        res.json(err);
      }

      User.findByIdAndUpdate(req.params._id, {$push:{exercises:exercise}}, {new:true}, function(err,uUser){
        if(err) {
          console.error('failed to find ln 73 exercise');
          res.json( err);
        }
        res.json({_id:uUser._id,
                  username:uUser.username,
                 date:tDate.toDateString(),
                 duration:exercise.duration,
                 description:exercise.description});
      });
    });
  });
});


app.route("/api/users/:_id/logs").get((req,res) => {
  console.log("start get /api/users/:_id/logs", req.query);

  let from = (req.query.from===undefined) ? undefined : Date.parse(req.query.from);
  let to = (req.query.to===undefined)? undefined : Date.parse(req.query.to);
  let limit = req.query.limit;
  
  User.findById(req.params._id, function(err,user){
    if (err){
      console.error('logs user id not found');
      res.json({"error":"user id not found"});
      return (err);
    }
    let logs = [];
    let li = 0;
    for(var i = 0; i < user.exercises.length && (limit === undefined||(li < limit)); i++){
      var td = Date.parse(user.exercises[i].date);
      if( (from ===undefined) || ((td >= from) && (td <= to)) ){
        console.log("added");
        li++;
        //logs.push(user.exercises[i]);
        logs.push({description:user.exercises[i].description,
                   duration:user.exercises[i].duration,
                   date:user.exercises[i].date});
      }
    }
    res.json({_id:user._id,
             username:user.username,
             count:user.exercises.length,
             log:logs});
  });
}).post((req,res) => {
    console.log("start get /api/users/:_id/logs");
    res.json({hello:'world'});
});



//mongoose-----------------------------
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
var exerciseSchema = new mongoose.Schema({
 // userid: String,
  description:  String,
  duration:  Number,
  date:  String
});
var userSchema = new mongoose.Schema({
  username:  {type: String, required: true},
  exercises: [exerciseSchema]
});

var logSchema = new mongoose.Schema({
  username:{type:String, required:true},
  count: Number,
  log: [exerciseSchema]
});

User = mongoose.model('User', userSchema);
Exercise = mongoose.model('Exercise', exerciseSchema);
Log = mongoose.model('Log', logSchema);

const findUserById = (userId, tUser, done) => {
    User.findById(userId, (err, user) => {
        if (err) return done(err)
        tUser = user;
      console.log('2a');
        return done(null, user)
    })
}



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
