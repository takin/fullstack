'use strict';
var Store = require('../store/store.model');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 3000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };

exports.index = function(req, res){
	res.end("ok");
};

exports.show = function(req, res){
	Store.getPhotoByStore(req.params.store, function (err, data){
		Response.success(res,data);
	});
}