'use strict';
var Store = require('../store/store.model');
var User = require('../user/user.model');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;

exports.create = function(req, res){
	///////////////////////////////////////////////////////////////////////////
	//
	// Oleh karena create user langsung dikirimkan setiap user login
	// maka sebelum melakukan create, kita perlu melakukan checking
	// apakah providerId (ID Facebook) sudah ada di dalam daftar atau tidak.
	//
	// field yang wajib di kirimkan adalah:
	// 1. firstName
	// 2. lastName
	// 3. providerId
	// 4. hashedPassword
	// 
	// optional:
	// 1. email
	// 2. gender
	// 3. provider (Text nama dari provider, misalnya Facbook, twitter dll)
	//
	////////////////////////////////////////////////////////////////////////////
	if(typeof(req.body.providerId) !== 'undefined'){
		User.findOne({providerId: req.body.providerId}, function (err, data){
			// jika user tidak ada
			if(data == null){
				User.create(req.body, function (e, user){
					if(e === null){
						res.end('Insert success');
					} else {
						res.end(e.message);
					}
				});
			} else {
				res.end('User already exists');
			}
		});
	} else {
		res.end('invalid format');
	}
}