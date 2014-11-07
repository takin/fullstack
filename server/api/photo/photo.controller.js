'use strict';

var _ = require('lodash');
var Store = require('../store/store.model');
var _ = require('lodash');
var Busboy = require('busboy');
var fs = require('fs');
var config = require('../../config/environment/index');
// var imagick = require('imagemagick-native');
var path = require('path');
// var gm = require('gm').subClass({imageMagick:true});

// Get list of photos -> GET /api/photos
exports.index = function(req, res) {
  Store.getPhotos(function(err, data){
    if( err ) { return handleError(res, err); }
    if(data.length <= 0) { return res.send(404); }
    res.json(data);
  });
};

// Get all photo per store -> GET /api/photos/:store
exports.show = function(req, res) {
  Store.getPhotoByStore(req.params.store, function (err, data){
    if( err ) { return handleError(res, err); }
    if(!data) { return res.send(404); }
    res.json(data);
  });
};
/**
 * method untuk melakukan proses manipulasi gambar
 * @param  {[type]} location [description]
 * @return {[type]}          [description]
 */
 /*
function imageMagick(location){
  gm(location)
    .resize(200,200)
    .write(location, function(err){

    });
    return;
}
*/
// Creates a new photo in the DB -> POST /api/photos/:store
exports.insert = function(req, res) {
  Store.findById(req.params.store, function (err, store){
    if(err) { return handleError(res, err); }
    if(!store) { return res.send(404); }

    var busboy = new Busboy({ headers: req.headers});
    var validType = ['image/jpeg','image/jpg','image/png'];

    busboy.on('file', function (fieldname, file, filename, encoding, mime){
      // cek apakah tipe file yang diupload valid (hanya dizinikan jpeg dan png)
      if( validType.indexOf(mime) === -1) { 
        file.resume(); 
        return;
      }
      // cek jumlah foto di dalam array untuk menentukan ekstensi nama foto terakhir
      var numberOfPhotos = store.photos.length;
      // ambil extensi dari file
      var imgExt = path.extname(filename);
      // ganti nama file menjadi nama store dan ditambahkan dengan index array
      var imageName = store.name.replace(/\W+/g, '-').toLowerCase() + '-' + (numberOfPhotos + 1) + imgExt;
      // tentukan lokasi foto
      // mode development dengan mode prodction sedikit berbeda, sehingga perlu dicek
      var imageBasePath = (process.env.NODE_ENV === 'development') ? '/client' : '/public';
      // buat lokasi inal file untuk proses penyimpanan
      var imageLocation = config.root + imageBasePath + '/assets/images/' + imageName;
      // simpan file ke dalam disk sesuai dengan lokasi yang sudah ditentukan
      file.pipe(fs.createWriteStream(imageLocation));
      // tambahkan watermark pada gambar
      // masukkan nama foto ke dalam array produk
      store.photos.push('/assets/images/' + imageName);
    });
    busboy.on('finish', function (){
      // masukkan data hasil upload ke dalam database
      store.save(function (err){
        if(err) { return handleError(res, err); }
        res.json(store);
      });
    });
    req.pipe(busboy);
  });
};

// Updates an existing photo in the DB.
// sementara tidak ada fitur update
/*
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  res.end(200);
};
*/

function deletePhoto(photos, callback){
  var err = false;
  var imageBasePath = (process.env.NODE_ENV === 'development') ? '/client' : '/public';
  photos.forEach(function (e, i, a) {
    fs.unlink(config.root + imageBasePath + e, function(r){
      err = r;
    });
  });

  if( typeof(callback) === 'function' ){
    callback(err);
  }
}

// Deletes a photo from the DB. -> DELETE /api/photos/:store OPTIONAL req.query.photo=<path to photo>
exports.destroy = function(req, res) {
  Store.findById(req.params.store, function (err, store){
    if(err) { return handleError(res, err); }
    if(!store) { return res.send(404); }
    var photoToDelete = [];
    var delStart = 0;
    var numOfDelete = 1;
    // cek apakah nama foto yang dikirimkan melalui req.params.photo ada di dalam database
    if(req.query.hasOwnProperty('photo')) {
      if(store.photos.indexOf(req.query.photo) === -1 ) { return res.json(404, 'Photo tidak ditemukan!'); }
      photoToDelete.push(req.query.photo);
      delStart = store.photos.indexOf(req.query.photo);
    } else {
      photoToDelete = store.photos;
      numOfDelete = store.photos.length;
    }
    // jika tidak ada foto di dalam array photoToDelete
    // maka stop eksekusi sampai di sini, dan kembalikan kode 304
    // if(photoToDelete.length <= 0){ return res.send(304); }

    deletePhoto(photoToDelete, function (err){
      if(err) { return handleError(res, err); }
      store.photos.splice(delStart, numOfDelete);
      store.save(function (err){
        if(err) { return handleError(res, err); }
        res.json(store);
      });
    });
  });
}

function handleError(res, err) {
  return res.send(500, err);
}