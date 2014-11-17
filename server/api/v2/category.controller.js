'use strict';
var Store = require('../store/store.model');
var Category = require('../category/category.model');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 3000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };

exports.index = function(req, res){
	Category.find().exec(function (err, data){
		res.json(data);
	});
};

exports.show = function(req, res){
	if(req.params.categoryId === 'undefined'){
		Response.error.invalidFormat(res);
	}
	Category.findById(req.params.cateogryId, function (err, category){
		if(err) {
			Response.nodata(res);
		} else if (category === null) {
			Response.nodata(res)	
		} else {
			Response.success(res,category);
		}
	});
}

exports.create = function(req, res){
	Category.create(req.body, function (err, category){
		(err) ? Response.error.invalidFormat(res) : Response.postSuccess(res);
	});
}

exports.getItems = function(req, res){
	Category.findById(req.params.cateogryId, function (err, categories){
		Category.populate(categories,{path:'storeMember', model:'Store'}, function (err, stores){
			Response.success(res, stores);
		});
	});
}

exports.destroy = function(req, res){
	Category.remove({_id:req.params.id}, function (err){
		if(err){ Response.error.invalidFormat(res); }
		Response.postSuccess(res);
	});
}

exports.update = function(req, res){
	Category.findById(req.params.id, function (err, category){
		if(err){ Response.error.invalidFormat(res); }
		category.name = req.body.name;
		category.save(function (err){
			if(err){ Response.error.invalidFormat(res); }
			Response.postSuccess(res);
		});
	});
}