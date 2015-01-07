'use strict';
var Store = require('../store/store.model');
var Comment = require('../comment/comment.model');
var Category = require('../category/category.model');
var _ = require('lodash');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 3000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };
var GIMMICK_WORDS = ["terserah","apa aja"];
var GIMMICK_RESPONSE = ["kalau cuma terserah mah cari pacar aja!!", "kamu pikir aku itu pacarmu ??"];
exports.index = function(req, res){
	
	var query = {
		limit: 20,
		offset: 0,
		open_only: false,
		keyword: null,
		keyword_type: null,
		getGimmick: function(){
			var indexOfGimmick = _.indexOf(GIMMICK_WORDS, this.keyword);
			return (indexOfGimmick !== -1) ? GIMMICK_RESPONSE[indexOfGimmick] : null;
		}
	};

	var SEARCH_RESULT;

	if((typeof(req.query.radius) === 'undefined' && typeof(req.query.keyword) === 'undefined') || (typeof(req.query.location) === 'undefined' && typeof(req.query.radius) !== 'undefined')){
		Response.error.invalidFormat(res);
	}

	// if(typeof(req.query.keyword) === 'undefined' && typeof(req.query.keyword_type) !== 'undefined' || typeof(req.query.keyword_type) === 'undefined' && typeof(req.query.keyword) !== 'undefined'){
	// 	Response.error.invalidFormat(res);
	// }
	if(typeof(req.query.keyword) === 'undefined'){
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

	// if(typeof(req.query.keyword_type) !== 'undefined'){
	// 	if(req.query.keyword_type === 'tags' || req.query.keyword_type === 'name'){
	// 		query.keyword_type = req.query.keyword_type;
	// 	} else {
	// 		Response.error.invalidFormat(res);
	// 	}
	// }

	if(typeof(req.query.location) !== 'undefined'){
		var rawLocation = req.query.location.split(",");
		// pastikan format data adalah pasangan lattitude,longitude
		if(rawLocation.length > 1){
			if(Validate.number(rawLocation[0]) && Validate.number(rawLocation[1])){
				// pastikan nilai lattitude tidak lebih dari 90
				if(rawLocation[0] < 90){
					query.location = [parseFloat(rawLocation[1]), parseFloat(rawLocation[0])]; // [llongitude,lattitude]
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

	// pattern untuk query pencarian
	// baik dalam mode radius maupun pencarian biasa dengan keyword dan keywrd_type
	var searchPattern = new RegExp(query.keyword + '.*','i');

	if(query.getGimmick() !== null){
		return res.json({code:200, isGimmick:true, message:query.getGimmick()});
	}

	if(query.radius){
		///////////////////////////////////////////////////////////////////////////////////
		//
		// cek field keyword_type untuk membedakan 
		// apakah yang akan diquery adalah field name atau field tags
		// query menggunakan regex sehingga nama ataupun tags tidak harus persis sama
		//
		//////////////////////////////////////////////////////////////////////////////////
		var searchQuery = {
			// hanya kembalikan store yang di-flag show: true
			show: true,
			//////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// secara defaut, query akan mengembalikan semua store yang memenuhi kriteria
			// baik yang masih tutup ataupun yang sudah buka (pada jam dilakukannya qyery)
			// jika user melewatkan query open_only, maka tambahkan kriteria pencarian pada field open_only
			// dari aplikasi, user hanya dimungkingkan untuk melewatkan value true
			//
			///////////////////////////////////////////////////////////////////////////////////////////////////
			open_only: query.open_only
		};
		// construct query berdasarkan field keyword_type
		var geoNear = {
			query: {
				tags: {$in:[searchPattern]},
				show: true
			},
			// flag ini wajib disertakan (mandatory from mongodb) untuk query berdasaran geonear
			spherical: true,
			// hanya kembalikan store yang berada dalam radius sesuai dengan nilai yang dikirimkan 
			// oleh user
			maxDistance: query.radius,
			skip:query.offset, 
			limit: query.limit
		};

		// jika keyword_type = tags
		// maka tabahkan query untuk mencari tags yang mirip dengan yang dikirimkan oleh user
		// if(query.keyword_type === 'tags'){
			// geoNear.query.tags = {$in:[searchPattern]};
		// }
		// if(query.keyword_type === 'name'){
		// 	geoNear.query.name = searchPattern;
		// }

		Store.geoNear(query.location, {query:{tags:{$in:[searchPattern]}}}, function (err, data){
			if(err || typeof(data) === 'undefined'){ Response.error.invalidFormat(res); }
			else {
				if(data.length > 0){
					/////////////////////////////////////////////////////////////////////////////////////
					//
					// oleh karena format kembalian dari hasil query menggunakan geoNear adalah:
					// [
					//		dis:<estimasi jarak store dengan lokasi user>,
					//		obj:<store object>
					// ]
					// sedangkan helper Response hanya akan memformat (melajkukan iterasi filtering)
					// hanya pada store object (array store object). maka kita perlu membuang object 
					// dis terlebih dahulu, sehingga yang dikirimkan ke helpers Response.success adalah
					// hanya array object.
					// 
					// selain itu, apabila user melewatkan parameter open_only dimana user hanya ingin 
					// menapilkan store yang berstatus buka. maka perlu dilakukan filtering untuk mengambil
					// hanya store yang memiliki field open: true.
					// field 'open' merupakan field virtual (tidak ada dalam skema real di database, hanya skema buatan mongoosejs)
					// sehingga kita tidak bisa memasukkan kriteria query show:true
					// untuk itu, filtering dilakukan pada saat proses iterasi pembuangan object 'dis'
					//
					//////////////////////////////////////////////////////////////////////////////////////
					
					// inisialisasi array object yang akan dikirimkan 
					var theObjects  = [];
					//................................................................................
					// iterasi jika user tidak melewatkan parameter
					// ...............................................................................
				
					data.forEach(function(element, index){
						theObjects[index] = element.obj;
					});

					// jika user melewatkan openOnly = true
					if(query.open_only){
						theObjects = theObjects.filter(function (element){
							return element.open === true;
						});
					}

					// tambahkan nama kategori pada setiap store object 
					Store.populate(theObjects, {path:'category', model:'Category', select:'name'}, function (err, result){
						/////////////////////////////////////////////////////////////////////////////////////////////////
						//
						// kirimkan ke helpers response untuk dilakukan filtering terhadap data yang akan 
						// dikembalikan ke requester
						// flag true untuk menandakan output yang akan dikembalikan harus di filter terlebih dahulu
						//
						/////////////////////////////////////////////////////////////////////////////////////////////////
						return Response.success(res, result, true);
					});
				} else {
					// jika hasil pencarian kosong
					return res.end();
				}
			}
		});
	} else {

		////////////////////////////////////////////////////////////////////////////////////////
		//
		// jika user tidak melewatkan parameter location dan radius
		// artinya pencarian hanya dilakukan berdasarkan tags atau nama store
		// sehingga tidak perlu menggunakan query geoNear
		// 
		///////////////////////////////////////////////////////////////////////////////////////////
		var currentTime = parseInt((new Date().getUTCHours()) + 7);
		// var conditions = (query.keyword_type == 'name') ? {name:searchPattern} : {tags:{$in:[searchPattern]}};
		var options = {skip:query.offset, limit: query.limit};
		// flag untuk menampilan hanya yang di flag show saja.
		// conditions.show = true;

		Store.find({tags:{$in:[searchPattern]}, show:true},null,options).populate('category', 'name').exec(function (err, data){
			if(err) {res.end('error occurs')}
			else {
				if(data.length > 0){
					// jika nilai query.open_only = true
					if(query.open_only){
						data = data.filter(function (element){
							return element.open === true;
						});
					}
					Response.success(res, data, true);
				} else {
					return res.end();
				}
			}
		});
	}
};