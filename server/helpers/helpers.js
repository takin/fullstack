'use strict';

var helpers = {
	Validate: function(){
		return {
			number: function(num){
				return (!isNaN(parseInt(num)));
			},
			integer: function(num){
				return (!isNaN(parseInt(num)));
			},
			float: function(num){
				return (!isNaN(parseFloat(num)));
			},
			string: function(str){
				return (typeof(str) !== 'undefined') ? true : false;
			}
		};
	},
	Response: function(){
		return {
			filterOutput:function(data){
				
			var response = [];
			data.forEach(function (e,i){
				var temp = {};
				temp._id = e._id;
				temp.category = e.category;
				temp.coordinates = e.coordinates;
				temp.name = e.name;
				temp.address = e.address;
				temp.photos = e.photos;
				temp.telp = e.telp;
				temp.website = e.website;
				temp.operationTimeStart = e.operationTimeStart;
				temp.operationTimeEnd = e.operationTimeEnd;
				temp.description = e.description;
				temp.numPhotos = e.photos.length;
				temp.rating = e.rating;
				temp.numComments = e.comment.length;
				temp.sticky = e.sticky;
				temp.tags = e.tags;
				temp.open = e.open;
				response.push(temp);
			});
			return response;
		},
			error: {
				invalidFormat: function(res){
					return res.json(403,{message: "Invalid format!"});
				},
				invalidToken: function(res){
					return res.json(403,{message: "Access Denied!"});
				},
				notFound: function(res){
					return res.json(403,{message: "Data not found!"});
				}
			}, 
			nodata: function(res){
				return res.json(200,{message:"Tidak ada data"});
			},
			success: function(res, data, filter, openOnly){
				if(typeof(filter) === 'undefined'){
					return res.json(data)
				} else {
					var output = this.filterOutput(data);
					return res.json(output);
				}
			},
			postSuccess: function(res){
				return res.json(200,{message:"Action Success"});
			}
		};
	}
};

module.exports = helpers;