'use strict';
var Store = require('../store/store.model');
var Comment = require('../comment/comment.model');
var Category = require('../category/category.model');
var helpers = require('../../helpers/helpers');
var _ = require('lodash');
var Validate = helpers.Validate();
var Response = helpers.Response();
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 3000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };

exports.index = function(req, res){
	
	var query = {
		limit: 20,
		offset: 0,
		open_only: false,
		keyword: null,
		keyword_type: null
	};

	var SEARCH_RESULT;

	if((typeof(req.query.radius) === 'undefined' && typeof(req.query.keyword) === 'undefined') || (typeof(req.query.location) === 'undefined' && typeof(req.query.radius) !== 'undefined')){
		Response.error.invalidFormat(res);
	}

	if(typeof(req.query.keyword) === 'undefined' && typeof(req.query.keyword_type) !== 'undefined' || typeof(req.query.keyword_type) === 'undefined' && typeof(req.query.keyword) !== 'undefined'){
		Response.error.invalidFormat(res);
	}

	/* cek kembali validasi integerya */
	if(typeof(req.query.radius) !== 'undefined'){
		if(!Validate.number(req.query.radius)){
			Response.error.invalidFormat(res);
		}
		query.radius = (parseInt(req.query.radius) / DISTANCE_MULTIPLIER);
	}

	if(typeof(req.query.keyword) !== 'undefined'){
		query.keyword = req.query.keyword.replace('/\+/', ' ');
	}

	if(typeof(req.query.keyword_type) !== 'undefined'){
		if(req.query.keyword_type === 'tags' || req.query.keyword_type === 'name'){
			query.keyword_type = req.query.keyword_type;
		} else {
			Response.error.invalidFormat(res);
		}
	}

	if(typeof(req.query.location) !== 'undefined'){
		var rawLocation = req.query.location.split(",");
		// pastikan format data adalah pasangan lattitude,longitude
		if(rawLocation.length > 1){
			if(Validate.number(rawLocation[0]) && Validate.number(rawLocation[1])){
				// pastikan nilai lattitude tidak lebih dari 90
				if(rawLocation[0] < 90){
					query.location = [parseFloat(rawLocation[1]), parseFloat(rawLocation[0])]; // [llongitude,lattitude]
				} else {
					console.log('longitude salah');
					Response.error.invalidFormat(res);
				}
			} else {
				Response.error.invalidFormat(res);
			}
		} else {
			Response.error.invalidFormat(res);
		}
	}

	if(typeof(req.query.limit) !== 'undefined'){
		var rawLimit = req.query.limit.split(",");
		if(rawLimit.length > 1){
			if(Validate.number(rawLimit[0]) && Validate.number(rawLimit[1])){
				query.offset = parseInt(rawLimit[0]);
				query.limit = parseInt(rawLimit[1]);
			} else {
				Response.error.invalidFormat();
			}
		} else if(rawLimit.length == 1){
			if(Validate.number(rawLimit[0])){
				query.limit = parseInt(rawLimit[0]);
			} else {
				Response.error.invalidFormat(res);
			}
		}
	}

	if(typeof(req.query.open_only) !== 'undefined'){
		if(req.query.open_only == 'true' || req.query.open_only == 'false' || req.query.open_only == '0' || req.query.open_only == '1'){
			if(req.query.open_only == 'true' || req.query.open_only == '1'){
				query.open_only = true;
			}
			if(req.query.open_only == 'false' || req.query.open_only == '0'){
				query.open_only = false;
			}	
		} else {
			Response.error.invalidFormat(res);
		}
	}

	if(query.radius){
		Store.geoNear(query.location, {maxDistance:query.radius, spherical:true}, function (err, data){
			if(err || typeof(data) === 'undefined'){ Response.error.invalidFormat(res); }
			else { processRadiusResponse(res, query, data);}
		});
	} else {

		var currentTime = parseInt((new Date().getUTCHours()) + 7);
		var conditions = (query.keyword_type == 'name') ? {name:new RegExp(query.keyword + '.*','i')} : {tags:new RegExp(query.keyword + '.*','i')};
		var options = {skip:query.offset, limit: query.limit};

		Store.find(conditions,null,options).populate('category', 'name').exec(function (err, data){
			if(err) {Response.error.invalidFormat(res);}
			else {
				if(query.open_only){
					data = data.filter(function (element){
						return element.open === true;
					});
				}
				Response.success(res, data, true);
			}
		});
	}
};

function processRadiusResponse(res, query, data){
	var theData = [];
	data.forEach(function(element, index){
		theData[index] = element.obj;
	});

	if(query.open_only){
		theData = theData.filter(function (element){
			return element.open === true;
		});
	}

	if(query.keyword_type === null || query.keyword === null){
		Response.success(res,theData, true);
	} else {
		var prop = query.keyword.split(" ");
		var result = (query.keyword_type === 'tags') ? _.where(theData,{tags:prop}) : _.where(theData,{name:query.keyword});
		
		Store.populate(result, {path:'category', model:'Category', select:'name'}, function (err, result){
			Response.success(res,result, true);
		});
	}
}