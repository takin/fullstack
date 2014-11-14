'use strict';

var express = require('express');
var store = require('./store.controller');
var search = require('./search.controller');
var photo = require('./photo.controller');
var comment = require('./comment.controller');
var category = require('./category.controller');
var authV2 = require('../../auth/auth.service.v2');
var auth = require('../../auth/auth.service');

var app = express();
var router = express.Router();

router.get('/stores', authV2.isAllowed, store.index);
router.get('/stores/category/:categoryId', authV2.isAllowed, store.byCategory);
router.get('/stores/:storeId', authV2.isAllowed, store.show);
router.post('/stores',auth.hasRole('admin'),store.create);
router.post('/stores/vote/:store', authV2.isAllowed, store.vote);
router.put('/stores/:store',auth.hasRole('admin'),store.update);
router.patch('/stores/:store', auth.hasRole('admin'), store.update);
router.delete('/stores/:store', auth.hasRole('admin'),store.destroy);

router.get('/search', search.index);
router.get('/categories', category.index);
router.get('/categories/:cateogryId', category.show);
router.get('/categories/items/:cateogryId', category.getItems);
router.get('/photos', authV2.isValidSearch, photo.index);
router.get('/photos/:storeId', authV2.isAllowed, photo.show);
router.get('/comments/:sid', comment.index);

router.post('/comments', authV2.isAllowed, comment.create);
router.post('/categories', auth.hasRole('admin'), category.create);

router.put('/categories/:id', auth.hasRole('admin'), category.update);
router.delete('/categories/:id', auth.hasRole('admin'), category.destroy);

module.exports = router;