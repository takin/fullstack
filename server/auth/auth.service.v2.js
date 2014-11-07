'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var User = require('../api/user/user.model');
var validateJwt = expressJwt({ secret: config.secrets.session });
var appToken = jwt.sign({media:"device"},"kulinerapptoken");
var helpers = require('../helpers/helpers');
var Response = helpers.Response();
var Validate = helpers.Validate();

// fungsi untuk melakukan autentifikasi awal
var VALIDATE = {
	Token: function(req, res, next){
		if(Validate.string(req.headers.token)){
			jwt.verify(req.headers.token,"kulinerapptoken", function (err, decoded){
				if(err){
					Response.error.invalidToken(res);
				}
				if(decoded.media === 'device' || decoded.media === 'web'){
					next();
					return;
				}
				Response.error.invalidToken(res);
			});	
			return;
		}
		Response.error.invalidToken(res);
	},
	Keyword: function(req, res, next){
		if(!Validate.string(req.query.keyword)){
			Response.error.invalidFormat(res);
		}
		next();
	}
};

exports.isAllowed = VALIDATE.Token;
exports.isValidSearchNearby = (function(){
	return compose()
	.use(VALIDATE.Token)
	.use(function (req, res, next){
		if(Validate.string(req.query.location)){
			var raw = req.query.location.split(",");
			if(raw.length === 2){
				var lat = parseFloat(raw[0]);
				var lng = parseFloat(raw[1]);
				if(isNaN(lat) || isNaN(lng) || lat > 90){
					Response.error.invalidFormat(res);
				}
				next();
				return;	
			}
			Response.error.invalidFormat(res);
		}
		Response.error.invalidFormat(res);
	})
	.use(function (req, res, next){
		if(Validate.string(req.query.distance)){
			if(!Validate.integer(req.query.distance)){
				Response.error.invalidFormat(res);
				next();
			}
			next();
			return;
		}
		Response.error.invalidFormat(res);
	});
}());
exports.isValidSearch = (function(){
	return compose()
	.use(VALIDATE.Token)
	.use(VALIDATE.Keyword);
}());