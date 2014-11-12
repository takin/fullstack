'use strict';

var _ = require('lodash');
var Store = require('../store/store.model');
var Comment = require('../comment/comment.model');
var helpers = require('../../helpers/helpers');
var Validate = helpers.Validate();
var Response = helpers.Response();


// Get list of comments
exports.index = function(req, res) {
  Store.findById(req.params.sid).populate({path:'comment', model:'Comment'}).exec(function (err, comments){
    console.log(comments);
    if(err){
      Response.error.invalidFormat(res);
    } else if (comments === null || (typeof(comments) !== 'undefined' && comments.length > 0)) {
      Response.nodata(res);
    } else {
      var temp = {};
      temp._id = comments._id;
      temp.category = comments.category;
      temp.coordinates = comments.coordinates;
      temp.name = comments.name;
      temp.address = comments.address;
      temp.photo = comments.photo;
      temp.telp = comments.telp;
      temp.website = comments.website;
      temp.operationTime = comments.operationTime;
      temp.description = comments.description;
      temp.numPhotos = comments.photos.length;
      temp.rating = comments.rating;
      temp.comment = comments.comment;
      temp.sticky = comments.sticky;
      temp.tags = comments.tags;
      Response.success(res, temp);
    }
  });
};


// Creates a new comment in the DB.-> POST /api/v2/comments
exports.create = function(req, res) {
  Store.findById(req.body.store, function (err, store){
    if(err || store == null){ Response.error.notFound(res); }
    Comment.create(req.body, function (err, comment){
      if(err){ Response.error.notFound(res); }
      store.comment.push(comment._id);
      store.save(function (err){
        err ? Response.error.notFound(res) : Response.success(res, comment);
      });
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}