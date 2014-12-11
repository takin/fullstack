'use strict';

var _ = require('lodash');
var Store = require('../store/store.model');
var Comment = require('../comment/comment.model');
var Helpers = require('../../helpers/helpers');
var Validate = Helpers.Validate;
var Response = Helpers.Response;


// Get list of comments
exports.index = function(req, res) {
  Store.findById(req.params.sid).populate({path:'comment', model:'Comment',match:{show:true}, options:{sort:{'date':1}}}).exec(function (err, comments){
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
      temp.operationTimeStart = comments.operationTimeStart;
      temp.operationTimeEnd = comments.operationTimeEnd;
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
    console.log(req.body);
    var date = new Date(req.body.date);
    req.body.date = date;
    Comment.create(req.body, function (err, comment){
      console.log(err);
      if(err){ return Response.error.notFound(res); }
      store.comment.push(comment._id);
      store.save(function (err){
        return err ? Response.error.notFound(res) : Response.success(res, comment);
      });
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}