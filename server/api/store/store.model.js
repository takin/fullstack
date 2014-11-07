'use strict';

/*
jika menggunakan format GeoJSON untuk kolom 2dspherical index 
(location:{type:{type:'Point', enum:['Point','LineString','Polygon']},coordinates:[Number]})
maka urutan isi dari coordinates adalah [lattitude,longitude]
sedangkan jika menggunakan format MongoDB biasa, maka formatnya dibalik [longitude, lattitude]
*/

var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var StoreSchema = new Schema({
	name: {type:String,required:true},
	sticky: {type:Boolean, default: false},
	address: {type:String,required:true},
	telp: {type:String}, // re-check the feature!!!
	website:{type:String}, // re-check the feature!! 
	operationTimeStart:Number, // re-check again!!
	operationTimeEnd:Number,
	tags: [{type: String, index: true}],
	description: {type:String, min: 10, max: 500, required: true},
	coordinates:{type:[Number], index:'2dsphere'}, //[longitude, lattitude]
	photos: [String],
	votes: [{type:Number, min: 1, max: 5}],
	category:{type:Schema.Types.ObjectId, ref:'Category'},
	comment: [{type:Schema.Types.ObjectId, ref:'Comment'}]
});

// method untuk mengambil semua gambar dari semua store
StoreSchema.statics.getPhotos = function (callback) {
	this.find().select('name photos votes').exec(function (err, data) {
		var rd = [];
		if(data.length > 0){
			data.forEach(function (element) {
				var temp = {};
				temp._id = element._id;
				temp.name = element.name;
				temp.photos = element.photos;
				rd.push(temp);
			});
		}
		callback(err, rd);
	});
}

StoreSchema.statics.getSummryStore = function(query,callback) {
	var criteria;
	this.find().exec(function (err, data){
		var response = [];
		if(data.length > 0){
			data.forEach(function (e,i){
				var temp = {};
				temp._id = e._id;
				temp.name = e.name;
				temp.address = e.address;
				temp.photo = (e.photos.length > 0) ? e.photos[e.photos.length - 1] : null;
				temp.telp = e.telp;
				temp.location = e.location;
				temp.website = e.website;
				temp.operationTime = e.operationTime;
				temp.description = e.description;
				temp.numPhotos = e.photos.length;
				temp.rating = e.rating;
				temp.numComments = e.comment.length;
				temp.sticky = e.sticky;
				response.push(temp);
			});
		}

		// sort hasil berdasarkan sticky bernilai true
		// ini dibutuhkan untuk menempatkan sponsored store pada 
		// urutan paling atas dalam list di aplikasi
		response.sort(function(a,b){
			return (a.sticky === b.sticky) ? 0 : a.sticky ? -1 : 1;
		});
		callback(err, response);
	});
}

StoreSchema.statics.getSummryComment = function(id, callback) {
	this.findById(id).select('name photos comments votes').exec(function (err, data){
		var response = {};
		if(data){
			response._id = data._id;
			response.name = data.name;
			response.comments = data.comments;
			response.numComments = data.comment.length;
		}
		callback(err, response);
	});
}

StoreSchema.statics.getPhotoByStore = function (id, callback) {
	this.findById(id).select('name photos votes').exec(function (err, data){
		var rd = {};
		if(data){
			rd = { _id: data._id, name: data.name, photos: data.photos };
		} else {
			rd = data;
		}
		callback(err, rd);
	});
}

StoreSchema.set('toObject', {virtuals: true});
StoreSchema.set('toJSON', {virtuals: true});

StoreSchema.virtual('rating').get(function(){
	if(this.votes.length < 1){ return 0; }
	return Math.ceil(this.votes.reduce(function (a,b){
		return a + b;
	}) / this.votes.length);
});
StoreSchema.virtual('numComments').get(function(){
	return this.comment.length;
});
StoreSchema.virtual('numPhotos').get(function(){
	return this.photos.length;
});


module.exports = mongoose.model('Store', StoreSchema);