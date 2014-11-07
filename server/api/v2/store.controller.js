'use strict';
var Store = require('../store/store.model');
var helpers = require('../../helpers/helpers');
var Validate = helpers.Validate();
var Response = helpers.Response();
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 3000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };

exports.index = function(req, res){

	// Default request query value
	var criteria = {
		distance: 3000,
		location: null,
		limit: 20,
		offset: 0
	};

	// cek apakah query location dikirimkan atau tidak
	// cek juga apakah valid atau tidak
	if(typeof(req.query.location) !== 'undefined'){
		var rawLocation = req.query.location.split(",");
		// pastikan format data adalah pasangan lattitude,longitude
		if(rawLocation.length > 1){
			if(Validate.number(rawLocation[0]) && Validate.number(rawLocation[1])){
				// pastikan nilai lattitude tidak lebih dari 90
				if(rawLocation[0] < 90){
					criteria.location = [parseFloat(rawLocation[1]), parseFloat(rawLocation[0])]; // [llongitude,lattitude]
				} else {
					Response.error.invalidFormat(res);
				}
			} else {
				Response.error.invalidFormat(res);
			}
		} else {
			Response.error.invalidFormat(res);
		}
	}

	// cek apakah query limit dikirimkan atau tidak
	// cek juga apakah format valid atau tidak
	if(typeof(req.query.limit) !== 'undefined'){
		var rawLimit = req.query.limit.split(",");
		if(rawLimit.length > 1){
			if(Validate.number(rawLimit[0]) && Validate.number(rawLimit[1])){
				criteria.offset = parseInt(rawLimit[0]);
				criteria.limit = parseInt(rawLimit[1]);
			} else {
				Response.error.invalidFormat();
			}
		} else if(rawLimit.length == 1){
			if(Validate.number(rawLimit[0])){
				criteria.limit = parseInt(rawLimit[0]);
			} else {
				Response.error.invalidFormat(res);
			}
		}
	}

	// cek apakah distance ada atau tidak 
	if(typeof(req.query.radius) !== 'undefined'){
		if(Validate.number(req.query.radius)){
			criteria.radius = parseInt(req.query.radius);
		} else {
			Response.error.invalidFormat(res);
		}
	}
	// ambil hanya data yang di falg sticky true
	Store.find({sticky:true},null, function (err,stickyData){
		if(criteria.location !== null){
			Store.geoNear(criteria.location,{query:{sticky:false},limit:criteria.limit,spherical:true, maxDistance: criteria.distance/DISTANCE_MULTIPLIER, distanceMultiplier: DISTANCE_MULTIPLIER}).then(function (geoNearData, stats){
				if(stickyData.length > 0 && geoNearData.length > 0){
					Response.success(res, stickyData.concat(geoNearData));
				} else if(geoNearData.length > 0){
					// kemablikan hanya data geonear
					Response.success(res, geoNearData);
				} else {
					Response.nodata(res);
				}
			});
		} else {
			Store.find({sticky:false},null,{limit:criteria.limit, skip:criteria.offset}, function (err, randomData){
				if(stickyData.length > 0 && randomData.length > 0){
					Response.success(res,stickyData.concat(randomData));
				} else if (randomData.length > 0){
					Response.success(res,randomData);
				} else {
					Response.nodata(res);
				}
			});
		}
	});
};

exports.show = function(req, res){
	Store.findById(req.params.storeId).exec(processResponse);
	function processResponse(err, data){
		if(typeof(data) !== 'undefined'){
			Response.success(res, data);
		} else {
			Response.nodata(res);
		}
	}
};