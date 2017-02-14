var express = require('express');
var router = express.Router();
const authHelpers = require('../auth/auth-helpers');
const passport = require('../auth/local');
const models = require('../db/models/index');
require('dotenv').config();
const ds_key = process.env.DS_KEY;
const gm_key = process.env.GM_KEY;
var googleMapsClient = require('@google/maps').createClient({
  key: gm_key
});
const axios = require('axios');
const moment = require('moment');
const app = express();

router.get('/', authHelpers.loginRequired, (req, res, next) => {
  models.Favorites.findAll({
    where: {user: req.user.dataValues.id}
  }).then(function(favorites) {
  res.render('user/index', {
    user: req.user.dataValues,
    favorites: favorites,
    weather: {currently:{temperature:'', summary:''}}
  });
});
});



router.get('/weather', (req, res, next) => {
  console.log(gm_key)
  googleMapsClient.geocode({
    address: req.query.zip
  }, function(err, response) {
  if (err) {
    console.log(err);
  }
  res.locals.town = response.json.results[0].address_components[1].long_name;
  res.locals.lat = response.json.results[0].geometry.location.lat;
  res.locals.lng = response.json.results[0].geometry.location.lng;
  // res.locals.neighb = response.json.results[0].
  axios.get('https://api.darksky.net/forecast/'+ds_key+'/'+res.locals.lat+','+res.locals.lng)
      .then((response) => {
        res.render('user/weather', {
          weather: response.data,
          town: res.locals.town,
          zip: req.query.zip,
          long: res.locals.lng,
          lat: res.locals.lat
           }) ;
    })
      .catch((error) => {
        console.log(error);
    });
    console.log(res.locals)
});
})

router.post('/:town/:zip', (req, res, next) => {
  models.Favorites.create({
    town: req.params.town,
    zip: req.params.zip,
    user: req.user.id
  }).then(function() {
    res.redirect('/user');
  })
})

router.get('/weather/:long/:lat/:town', (req, res, next) => {
  const time = moment(req.query.date).format("X");
   axios.get('https://api.darksky.net/forecast/'+ds_key+'/'+req.params.lat+','+req.params.long+','+time)
      .then((response) => {
        console.log(response)
          res.render('user/oldweather', {
          weather: response.data.currently,
          time: req.query.date,
          town: req.params.town,
          }) ;
    })
      .catch((error) => {
        console.log(error);
    });
    console.log(res.locals)
});

router.post('/', (req, res, next) => {
  console.log(req.body.long)
  console.log(req.body.lat)
      axios.get('https://api.darksky.net/forecast/'+ds_key+'/'+req.body.lat+','+req.body.long)
      .then((response) => {
        console.log(response.data);
        res.json({weather: response.data.currently})
    })
      .catch((error) => {
        console.log(error);
    });
})




module.exports = router;
