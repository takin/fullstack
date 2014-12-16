'use strict';
var _ = require('lodash');
var Store = require('../store/store.model');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;
var DISTANCE_MULTIPLIER = 6378137; //  konversi satuan meter ke dalam bentuk dari radians
var CRITERIA = { DISTANCE_DEFAULT: 30000, LOCATION_DEFAULT:null, LIMIT_DEFAULT:20, OFFSET_DEFAULT:0 };

function getRandomData(data){
	/////////////////////////////////////////////////////////////////////////////////////
	// 
	// Karena item yang akan ditampilkan di halaman depan dibatasi hanya 5 item
	// maka agar item yang di tampil tidak monoton ketika user tidak memiliki location
	// kita lakukan randomize urutan data.
	// 
	/////////////////////////////////////////////////////////////////////////////////////
	var indexesArrayOfRandomizedStore = [];
	var randomizedStore = [];
	// jumlah item dalam array
	var numOfItems = (data.length - 1); 
	var randomizedArrayIndex = 0;

	if(data.length > 0){
		while(randomizedArrayIndex < (data.length - 1)){
			var indexOfItem = Math.floor(Math.random() * numOfItems);
			//////////////////////////////////////////////////////////////////////////////////
			//
			// untuk memastikan tidak ada duplikasi item, maka setiap item yang sudah diambil
			// dikeluarkan dari list data.
			// pengecekean menggunakan fitur contain dari lodash 
			//
			////////////////////////////////////////////////////////////////////////////////////
			if(_.contains(indexesArrayOfRandomizedStore, indexOfItem) === false){
				indexesArrayOfRandomizedStore[randomizedArrayIndex] = indexOfItem;
				randomizedArrayIndex += 1;
			}
		}

		//////////////////////////////////////////////////////////////////////////////
		//
		// setelah proses pengambilan index array selesai
		// selanjutnya ambil data store berdasarkan index array yang sudah diacak tadi
		//
		///////////////////////////////////////////////////////////////////////////////
		indexesArrayOfRandomizedStore.forEach(function(element, index){
			randomizedStore[index] = data[element];
		});
	}

	return randomizedStore;
}

function saveStore(req, res, store){
  var tags = [];
    // isikan kembali dengan data yang dikirimkan oleh user
    _.forEach(req.body.tags, function (val, idx) {
      var value = val.trim() // hapus whitespace di kedua sisi string
      // buang array yang hanya berupa whitespace (string kosong)
      if(value.length <= 0){ return; }
      tags.push(value);
    });
    // ganti element tags dari request dengan yang baru, yang sudah difilter whitespace dan empty string nya
    req.body.tags = tags;
    // hapus semua isi array tags yang ada di dalam database
    store.tags.splice(0, store.tags.length);
    // isikan nilai tags dengan yang baru
    var updated = _.merge(store, req.body);
    // simpan ke dalam database
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(201, store);
    });
}

exports.vote = function (req, res){
  if(!req.body.votes) { return Response.error.invalidFormat(res); }
  Store.findById(req.params.store).exec(function (err, store){
    if(err) { return Response.error.invalidFormat(res); }
    store.votes.push(req.body.votes);
    store.save(function (err){
      if(err) {return Response.error.invalidFormat(res); }
      return res.json(200,"success");
    });
  });
}

exports.index = function(req, res){

	// Default request query value
	var criteria = {
		distance: 70000,
		location: null,
		limit: 20,
		offset: 0,
		show_all: true
	};

	if(typeof(req.query.show_all) !== 'undefined'){
		if(req.query.show_all == 'false'){
			criteria.show_all = false;
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	//
	// cek apakah query location dikirimkan atau tidak
	// cek juga apakah valid atau tidak
	//
	///////////////////////////////////////////////////////////////////////////////
	if(typeof(req.query.location) !== 'undefined'){
		var rawLocation = req.query.location.split(",");
		// pastikan format data adalah pasangan lattitude,longitude
		if(rawLocation.length > 1){
			if(Validate.number(rawLocation[0]) && Validate.number(rawLocation[1])){
				// pastikan nilai lattitude tidak lebih dari 90
				if(rawLocation[0] < 90){
					criteria.location = [parseFloat(rawLocation[1]), parseFloat(rawLocation[0])]; // [llongitude,lattitude]
				} else {
					return Response.error.invalidFormat(res);
				}
			} else {
				return Response.error.invalidFormat(res);
			}
		} else {
			return Response.error.invalidFormat(res);
		}
	}

	/////////////////////////////////////////////////////////////////////////////
	//
	// cek apakah query limit dikirimkan atau tidak
	// cek juga apakah format valid atau tidak
	//
	/////////////////////////////////////////////////////////////////////////////
	if(typeof(req.query.limit) !== 'undefined'){
		var rawLimit = req.query.limit.split(",");
		if(rawLimit.length > 1){
			if(Validate.number(rawLimit[0]) && Validate.number(rawLimit[1])){
				criteria.offset = parseInt(rawLimit[0]);
				criteria.limit = parseInt(rawLimit[1]);
			} else {
				return Response.error.invalidFormat(res);
			}
		} else if(rawLimit.length == 1){
			if(Validate.number(rawLimit[0])){
				criteria.limit = parseInt(rawLimit[0]);
			} else {
				return Response.error.invalidFormat(res);
			}
		}
	}

	// cek apakah distance ada atau tidak 
	if(typeof(req.query.radius) !== 'undefined'){
		if(Validate.number(req.query.radius)){
			criteria.radius = parseInt(req.query.radius);
		} else {
			return Response.error.invalidFormat(res);
		}
	}

	if(criteria.location !== null){
		//////////////////////////////////////////////////////////////////
		//
		// apabila client mengirimkan lokasi, maka lakukan query geoNear
		//
		///////////////////////////////////////////////////////////////////
		Store.geoNear(criteria.location,{query:{show:criteria.show_all},limit:criteria.limit,spherical:true, maxDistance: criteria.distance/DISTANCE_MULTIPLIER, distanceMultiplier: DISTANCE_MULTIPLIER}).then(function (geoNearData, stats){

			/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			//
			// Secara default, query geoNear mengurutkan item berdasarkan jarak terdekat dengan lokasi user, 
			// sementara kita butuh store yang di-flag sticky harus berada di urutan paling atas (mesikupn jaraknya paling jauh)
			// maka kita harus memisahkan store yang di-flag sticky dengan yang tidak untuk selanjutnya nantinya diurutkan ulang
			// dimana store yang di-flag sticky harus berada di paling awal.
			//
			// Selain itu, format kembalian dari hasil geo near adalah [{dis:<distance>, obj:<{store object}>}]
			// sedangkan helpers Response.success (/server/api/helpers/helpers.js) yang bertugas menangani output
			// hanya akan memproses array store, maka kita perlu membuang object 'dis' terlebih dahulu sebelum di kirimkan ke 
			// helpers Response.success
			//
			//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			if(geoNearData.length > 0){
				// array untuk menyimpan store yang bukan sticky
				var theGeoNearData = [];
				// array untuk menyimpan store yang di-flag sticky
				var stickyStore  = [];
				geoNearData.forEach(function(element, index){
					if(element.obj.sticky){
						stickyStore.push(element.obj);
					} else {
						theGeoNearData.push(element.obj);
					}
				});
				// ----------------------------------------------------------------------------------
				// selanjutnya concat kedua array, dengan sticky store sebagai referensi
				// sehingga dipastikan array sticky store berada di urutan paling depan
				// ----------------------------------------------------------------------------------
				var concatinatedData = stickyStore.concat(theGeoNearData);
				// kembalikan ke client.
				// flag true menandakan store harus diformat sebelum dikembalika
				return Response.success(res, concatinatedData, true);
			} else {
				return res.json('Tidak ada data');
			}
		});
	} else {
		/////////////////////////////////////////////////////////////////////////////
		//
		// jika tidak ada location maka lakukan query biasa dengan kriteria default
		// hanya menampilkan store yang di flag show: true
		//
		/////////////////////////////////////////////////////////////////////////////
		Store.find({show: criteria.show_all},null,{limit:criteria.limit, skip:criteria.offset}, function (err, data){

			if(data.length > 0){
				var stickyStore = [];
				var defaultStore = [];

				data.forEach(function(element, index){
					if(element.sticky){
						stickyStore.push(element);
					} else {
						defaultStore.push(element);
					}
				});
				/////////////////////////////////////////////////////////////////////////
				//
				// Setelah data store yang ber-sticky dipisah, selanjutnya adalah
				// kita random urutan data store yang tidak di sticky 
				// tujuannya adalah agar store yang ditampilkan tidak monoton.
				//
				/////////////////////////////////////////////////////////////////////////
				var randomizedStore = getRandomData(data);
				///////////////////////////////////////////////////////////////////////////
				//
				// Setelah itu, data sticky dengan yang random disatukan kembali
				// dengan acuan store yang di sticky yang ada di urutan terdepan
				//
				////////////////////////////////////////////////////////////////////////
				var concatinatedData = stickyStore.concat(randomizedStore);

				return Response.success(res, concatinatedData, true);

			} else {
				return res.json('Tidak ada data');
			}
		});
	}
};

exports.byCategory = function(req, res){
	var criteria = {
		location: null,
		show: false,
		limit:20,
		skip: 0
	};

	if(typeof(req.query.limit) !== 'undefined'){
		var rawLimit = req.query.limit.split(",");
		if(rawLimit.length > 1){
			if(Validate.number(rawLimit[0]) && Validate.number(rawLimit[1])){
				criteria.skip = parseInt(rawLimit[0]);
				criteria.limit = parseInt(rawLimit[1]);
			} else {
				return Response.error.invalidFormat(res);
			}
		} else if(rawLimit.length == 1){
			if(Validate.number(rawLimit[0])){
				criteria.limit = parseInt(rawLimit[0]);
			} else {
				return Response.error.invalidFormat(res);
			}
		}
	}

	criteria.show = !(typeof(req.query.show_all) !== 'undefined' && req.query.show_all == 'false');
	
	if(typeof(req.query.location) !== 'undefined'){
		var rawLocation = req.query.location.split(",");
		// pastikan format data adalah pasangan lattitude,longitude
		if(rawLocation.length > 1){
			if(Validate.number(rawLocation[0]) && Validate.number(rawLocation[1])){
				// pastikan nilai lattitude tidak lebih dari 90
				if(rawLocation[0] < 90){
					criteria.location = [parseFloat(rawLocation[1]), parseFloat(rawLocation[0])]; // [llongitude,lattitude]
				} else {
					return Response.error.invalidFormat(res);
				}
			} else {
				return Response.error.invalidFormat(res);
			}
		} else {
			return Response.error.invalidFormat(res);
		}
	}

	Store.find({category:req.params.categoryId, show:criteria.show}, null, {limit: criteria.limit, skip:criteria.skip}, function (err, stores){
		if(err){ return Response.error.invalidFormat(res); }
		return Response.success(res, stores, true);
	});

}

exports.show = function(req, res){
	Store.findById(req.params.storeId).exec(processResponse);
	function processResponse(err, data){
		if(typeof(data) !== 'undefined'){
			return Response.success(res, data, true);
		}
		return Response.nodata(res);
	}
};

// Creates a new store in the DB.
exports.create = function (req, res) {
  Store.create(req.body, function(err, store) {
    if(err) { return Response.error.invalidFormat(res); }
    Category.findById(store.category, function (err, category){
      if(err) { return Response.error.invalidFormat(res); }
      
      category.storeMember.push(store._id);
      category.save(function (err){
        if(err) { return Response.error.invalidFormat(res); }
        return Response.postSuccess(res);
      });

    });
  });
};

// Updates an existing store in the DB.
exports.update = function (req, res) {
  if(req.body._id) { delete req.body._id; }
  Store.findById(req.params.store, function (err, store) {
    if(err || typeof(store) === 'undefined' || store === null) { return Response.nodata(res); }
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // re-generate array tags
    // hapus semua isi masing-masing array, dan isikan kembali dengan nilai array 
    // yang dikirimkan oleh user. hal ini harus dilakukan karena jika tidak, maka proses 
    // penghapusan elemen array tertentu tidak dapat dilakukan
    //
    //////////////////////////////////////////////////////////////////////////////////////////////
      Category.findById(store.category, function (err, category){
        if(store.category.toString() !== req.body.category){
          category.storeMember.pop(store._id);
          category.save(function (err){
            if(err) { return Response.error.invalidFormat(res); }
            Category.findById(req.body.category, function (err, newCategory){
              newCategory.storeMember.push(store._id);
              
              newCategory.save(function (err){
                if(err) { return Response.error.invalidFormat(res); }
                saveStore(req, res, store);
              });

            });
          });
        } else {
          saveStore(req, res, store);
        }
      });
  });
};

// Deletes a store from the DB.
// but before deleteing the database, make sure to delete the image on disk first
exports.destroy = function (req, res) {
  if(err) { return Response.error.invalidFormat(res); }
  Store.findById(req.params.store, function (err, store) {
    if(err) { return Response.error.invalidFormat(res); }
    if(!store) { return res.send(404); }

    Category.findById(store.category, function (err, category){
      if(err) { return Response.error.invalidFormat(res); }
      
      category.storeMember.pop(store._id);
      
      category.save(function (err){
        if(err) { return Response.error.invalidFormat(res); }
        // hapus foto di disk jika ada
        if( store.photos.length > 0 ) { deletePhoto(store.photos); }
        store.remove(function(err) {
          if(err) { return Response.error.invalidFormat(res); }
          return res.send(204);
        });
      });

    });
    
  });
};