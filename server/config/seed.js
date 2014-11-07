/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

 'use strict';

 var Thing = require('../api/thing/thing.model');
 var User = require('../api/user/user.model');
 var Comment = require('../api/comment/comment.model');
 var Store = require('../api/store/store.model');
 var Category = require('../api/category/category.model');

 var categories = [new Category({name:'Lesehan'}),new Category({name:'Restaurant'}),new Category({name:'Bakmi'})];

 var stores = [new Store({
  category: categories[0]._id,
  website: 'www.mang-engking.com',
  operationTime: '13.00;23.00',
  name: 'Mang Engking',
  telp: '081803663156',
  address: 'Jl. Godean no 10',
  tags: ['lesehan','lesehan ikan bakar','udang bakar madu'],
  description: 'Lesehan dengan citarasa udang bakar madu yang menggugah selera',
  coordinates:[110.3729718,-7.789182],
  votes: [1,5,4,3,4,3,3,2,5]}),
 new Store({
  category:categories[0]._id,
  name: 'Extra Hot Babarsari',
  telp: '02741234',
  operationTime: '7.00;17.00',
  address: 'Jl. Babarsari (depan sambel layah)',
  tags: ['lesehan','lesehan pedas','ayam bakar pedas'],
  description: 'Jika anda ingin makanan serba pedas, di sini lah tempatnya\n\nBeragam menu extra pedasnya siap memuaskan selera pedas anda',
  coordinates:[110.4132978,-7.7735438],
  votes: [3,2,2,3,5,2,1]
}),
 new Store({
  category:categories[0]._id,
  name: 'Lesehan Mbak Yanti',
  telp: '027422345',
  operationTime: '20.00;2.00',
  address: 'Jl. Janti no 30',
  tags: ['lesehan','lesehan pedas','ayam bakar pedas'],
  description: 'Lesehan dengan menu khas ikan bakar dengan bumbu rahasia',
  coordinates:[110.3826707,-7.7780418],
  votes: [3,2,2,3,5,2,1,2,5]
}),
 new Store({
  category:categories[1]._id,
  name: 'Sambel Layah',
  telp: '02741234',
  operationTime: '8.00,12.00',
  address: 'Jl. Babarsari (samping pom bensin)',
  tags: ['lesehan','lesehan pedas','ayam bakar pedas'],
  description: 'Lesehan dengan menu ayam dijadikan sebagai menu khasnya.\n\nSelain itu, sambal khas lamongan nya yang menggungah selera',
  coordinates:[110.4133729,-7.773953],
  votes: [3,2,2,3,5,2,1]
})];

var comments = [new Comment({
    author: 'Syamsul',
    store: stores[0]._id,
    title: 'testing',
    message: 'ini adalah komentar saya yang pertama',
    show: false
  }), 
new Comment({
    store:stores[1]._id,
    author: 'Ahmad',
    title: 'Maknyus',
    message: 'Mang engking memang maknyusss...'
  })];

Store.find({}).remove(function(){
  console.log('store removed');
  Category.find({}).remove(function(err){
    console.log('category removed');
    Comment.find().remove(function(){
      console.log('comments removed');
      saveCategory();
      saveStore();
      saveComment();
    });
  });
});

function saveStore(callback){
  var n = 1;
  for(var i = 0; i < stores.length; i++){
    stores[i].save();
    console.log("save store success");
  }
  if(n === stores.length){
    return true;
  }
}

function saveCategory(callback){
  var n = 1;
  for (var i = 0; i < categories.length; i++) {
    categories[i].save();
    console.log("save category success");
  };
  if(n === categories.length){
    return true;
  }
}

function saveComment(){
  var n = 1;
  for (var i = 0; i < comments.length; i++) {
    comments[i].save();
    n++;
  };
  if (n === comments.length) {return true;};
}

 Thing.find({}).remove(function() {
  Thing.create({
    name : 'Development Tools',
    info : 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
  }, {
    name : 'Server and Client integration',
    info : 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
  }, {
    name : 'Smart Build System',
    info : 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
  },  {
    name : 'Modular Structure',
    info : 'Best practice client and server structures allow for more code reusability and maximum scalability'
  },  {
    name : 'Optimized Build',
    info : 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
  },{
    name : 'Deployment Ready',
    info : 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
  });
});

User.find({}).remove(function() {
  User.create({
    provider: 'local',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com',
    username:'test',
    password: 'test'
  }, {
    provider: 'local',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'admin',
    email: 'admin@admin.com',
    username: 'admin',
    password: 'admin'
  });
});