'use strict';

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
	author: {type: String, required: true},
	authorId:{type:String}, // id facebook
	store:{type: Schema.Types.ObjectId, ref: 'Store'},
	date: {type: Date, default: Date.now},
	message: {type: String, min: 10, max: 250, required: true},
	show: {type:Boolean, default: true}
});

module.exports = mongoose.model('Comment', CommentSchema);