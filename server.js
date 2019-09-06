require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//Models DB
const User = require('./models/User');
const Login = require('./models/Login');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect('mongodb://127.0.0.1:27017/myapp', {
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('hi')
})

// requires Token to access this endpoint
app.post('/user', (req, res) => {
  const {token, email} = req.body;
  if(!token || !email) return res.status(400).json({msg: 'Please fill all Entries'});
  try{
    var payload = jwt.verify(token, process.env.JWT_SECRET);
  }catch(err){
    res.status(400).json({msg: 'Invalid '})
  }
  if(payload.email === email) User.findOne({email}).then(user => res.json(user));
  else res.status(400).json({msg: "Access Denied!"})
})

app.post('/signin', (req, res) => {
  const {email, password} = req.body;
  if(!password || !email) return res.status(400).json({msg: 'Please fill all Entries'});
  Login.findOne({email}).then(user => {
    if(!user) return res.status(400).json({msg: "Email Id is not registered with us."})
    var bool = bcrypt.compareSync(password, user.password);
    if(bool){
     var token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: 3600});
     res.json({
       token,
       email
     });
    }
    else return res.status(400).json({msg: "Wrong password"});
  })

})

app.post('/register', (req, res) => {
  const {email, password, name, contact} = req.body;
  if(!name || !password || !email || !contact) return res.status(400).json({msg: 'Please fill all Entries'});
  if(!contact.match(/^[0-9]+$/)) return res.status(400).json({msg: 'Phone Number can only be Number'});
  User.findOne({email}).then(user =>{
    if(user) return res.status(400).json({ msg: 'User already exists' });    
    User.findOne({contact}).then(duplicateContact => {
      if(duplicateContact) return res.status(400).json({ msg: 'Phone Number already exists' });

      const hash = bcrypt.hashSync(password, 4);
      const newUser = User({email, name, contact});
      const newLogin = Login({email, password: hash});

      Promise.all([newUser.save(), newLogin.save()]).then(arr => {
        user = arr[0];
        const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: 3600});
        res.json({
          token,
          email: user.email
       });
      })
      .catch(err => res.status(400).json({msg: 'Could not enter data into DB'}));

    });
  });
});

var port = process.env.PORT || 3001
app.listen(port, () => console.log('Connected at:'+ port));
