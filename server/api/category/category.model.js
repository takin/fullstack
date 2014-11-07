'use strict';

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var CategorySchema = new Schema({
	name: {type:String,required:true, index:true},
	storeMember:[{type:Schema.Types.ObjectId, ref: 'Store', index:true}]
});
module.exports = mongoose.model('Category', CategorySchema);