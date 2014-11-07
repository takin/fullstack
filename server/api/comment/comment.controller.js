'use strict';

var _ = require('lodash');
var Store = require('../store/store.model');
var Comment = require('../comment/comment.model');
var helpers = require('../../helpers/helpers');
var Validate = helpers.Validate();
var Response = helpers.Response();

// update show/hide komentar
exports.approve = function(req, res){
  Comment.findById(rew.params.commentId, function (err, comment){
    if(err){ res.end(304); }
    comment.show = true;
    comment.save(function (err){
      err ? res.end(304) : Response.success(res, comment);
    });
  });
}

// Get list of comments
exports.index = function(req, res) {
  Store.findById(req.params.store).populate({path:'comment', model:'Comment'}).exec(function (err, comments){
    err ? Response.error.invalidFormat(res) : comments.length > 0 ? Response.nodata(res) : Response.success(res, comments);
  });
};

// Get a single comment
exports.show = function(req, res) {
  Comment.findById(req.params.comment, function (err, comment){
    if(err){ res.end(304); }
    res.json(comment);
  });
};

// Creates a new comment in the DB.-> POST /api/comments/:store
exports.create = function(req, res) {
  Store.findById(req.params.store, function (err, store){
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

// Deletes a comment from the DB.
exports.destroy = function(req, res) {
  Store.findById(req.params.store).exec(function (err, store) {
    if(err || store == null){ Response.error.notFound(res); }
    Comment.remove({_id:req.body.comment}, function (err){
      if(err){ Response.error.notFound(res); }
      store.comment.pull(req.body.comment);
      store.save(function (err){
        err ? Response.error.notFound(res) : Response.success(res, store);
      });
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}