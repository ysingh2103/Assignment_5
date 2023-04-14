
var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

var Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
      type: String,
      unique: true,
    },
    password: String,
    email: String,
    loginHistory:[
      {
        dateTime: Date,
        userAgent: String,
      },
    ],
  });

 /// mongodb+srv://dbUser:Yuvraj21@SenecaWeb.mongodb.net/web322_week8?retryWrites=true&w=majority

 // mongodb+srv://dbUser:Yuvraj21@senecaweb.0nnhjyk.mongodb.net/?retryWrites=true&w=majority

  let User;
/// mongodb+srv://dbUser:<password>@senecaweb.ylnyp3f.mongodb.net/?retryWrites=true&w=majority
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
         let db = mongoose.createConnection("mongodb+srv://dbUser:Yuvraj21@senecaweb.0nnhjyk.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true}); //////// Update this later ////// 
        db.on('error', (err)=>{
            reject(err); 
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};


module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
      if (userData.password !== userData.password2) {
        reject("Passwords do not match");
      } else {
        bcrypt
          .hash(userData.password, 10)
          .then((hash) => {
            userData.password = hash;
            let newUser = new User(userData);

            User.create(userData)
            newUser.save().then(() => {
                resolve();
              })
              .catch((err) => {
                if (err.code === 11000) {
                  reject("User Name already taken");
                } else {
                  reject(`There was an error creating the user: ${err}`);
                }
              });
          })
          .catch((err) => {
            reject("There was an error encrypting the password");
          });
      }
    });
  };

  module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
      User.find({ userName: userData.userName })
        .then((users) => {
          if (users.length === 0) {
            reject(`Unable to find user: ${userData.userName}`);
          } else {
            const user = users[0];
            bcrypt.compare(userData.password, user.password).then((result) => {
              if (result === true) {
                user.loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });
  
                User.updateOne(
                  { userName: user.userName },
                  {
                    $set: {
                      loginHistory: user.loginHistory,
                    },
                  }
                )
                  .then(() => resolve(user))
                  .catch((err) => {
                    reject(`There was an error saving the login history: ${err}`);
                  });
              } else {
                reject(`Incorrect Password for user: ${userData.userName}`);
              }
            });
          }
        })
        .catch((err) => {
          reject(`There was an error finding the user: ${err}`);
        });
    });
  };
  

