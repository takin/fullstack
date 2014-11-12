'use strict';

var _ = require('lodash');
var Store = require('./store.model');
var Category = require('../category/category.model');
var fs = require('fs');
var config = require('../../config/environment/index');
// var imagick = require('imagemagick-native');
var path = require('path');
// var gm = require('gm').subClass({imageMagick:true});

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

exports.vote = function (req, res){
  if(!req.body.votes) { return handleError(res, "Invalid Format!"); }
  Store.findById(req.params.store).exec(function (err, store){
    if(err) { return handleError(res, err); }
    store.votes.push(req.body.votes);
    store.save(function (err, data){
      if(err) { return handleError(res, err); }
      return res.json(data);
    });
  });
}

// Get list of stores
exports.index = function (req, res, next) {
  Store.getSummryStore(req.query, function (err, stores) {
    if(err) { return handleError(res, err); }
    return res.json(200, stores);
  });
};

// Get a single store -> GET /api/stores/:store
exports.show = function (req, res) {
  Store.findById(req.params.store).exec(function (err, data){
    if(err) { return handleError(err, res) };
    return res.json(data);
  });
};

// get stores based on tags
exports.tags = function (req, res) {
  Store.find({tags: req.params.tags}).select('name comments photos votes').exec(function (err, data){
    if(err) { return handleError(err, res) };
    if(!data){ return res.send(304, 'Tidak ada data'); }
    var response = [];
    data.forEach(function (e,i){
      var temp = {
        _id: e._id,
        name: e.name.length > 26 ? e.name.split('', 26).join('') : e.name,
        numComments: e.numComments,
        numPhotos: e.numPhotos,
        rating: e.rating,
        photo: (e.photos.length > 0) ? e.photos[e.photos.length - 1] : '/assets/images/no-photo.jpg'
      };
      response.push(temp);
    });
    return res.json(response);
  });
};

// Creates a new store in the DB.
exports.create = function (req, res) {
  Store.create(req.body, function(err, store) {
    if(err) { return handleError(res, err); }
    Category.findById(store.category, function (err, category){
      if(err) { return handleError(res, err); }
      category.storeMember.push(store._id);
      category.save(function (err){
        if(err) { return handleError(res, err); }
        return res.json(200, store);
      });
    });
  });
};

// Updates an existing store in the DB.
exports.update = function (req, res) {
  if(req.body._id) { delete req.body._id; }
  Store.findById(req.params.store, function (err, store) {
    if (err) { return handleError(res, err); }
    if(!store) { return res.send(404); }
    /**
     * re-generate array tags
     * hapus semua isi masing-masing array, dan isikan kembali dengan nilai array 
     * yang dikirimkan oleh user. hal ini harus dilakukan karena jika tidak, maka proses 
     * penghapusan elemen array tertentu tidak dapat dilakukan
     * 
     */
      Category.findById(store.category, function (err, category){
        if(store.category.toString() !== req.body.category){
          category.storeMember.pop(store._id);
          category.save(function (err){
            if (err) { return handleError(res, err); }
            Category.findById(req.body.category, function (err, newCategory){
              newCategory.storeMember.push(store._id);
              newCategory.save(function (err){
                if (err) { return handleError(res, err); }
                saveStore(req, res, store);
              })
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
  if( req.err ) { return handleError(res, req.err); }
  Store.findById(req.params.store, function (err, store) {
    if(err) { return handleError(res, err); }
    if(!store) { return res.send(404); }

    Category.findById(store.category, function (err, category){
      if(err) { return handleError(res, err); }
      
      category.storeMember.pop(store._id);
      
      category.save(function (err){
        if(err) { return handleError(res, err); }
        // hapus foto di disk jika ada
        if( store.photos.length > 0 ) { deletePhoto(store.photos); }
        store.remove(function(err) {
          if(err) { return handleError(res, err); }
          return res.send(204);
        });
      });

    });
    
  });
};

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

function handleError (res, err) {
  return res.send(500, err);
}