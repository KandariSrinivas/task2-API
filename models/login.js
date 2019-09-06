const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var loginSchema  = new Schema({
  email:{
    type: String,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true
  }
});

module.exports = Login = mongoose.model('login', loginSchema)
