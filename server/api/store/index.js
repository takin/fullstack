'use strict';

var express = require('express');
var controller = require('./store.controller');
var auth = require('../../auth/auth.service');
var authv2 = require('../../auth/auth.service.v2');

var app = express();
var router = express.Router();

router.get('/', controller.index);
router.get('/:store', controller.show);
router.get('/tags/:tags', controller.tags);
router.post('/',auth.hasRole('admin'),controller.create);
router.post('/vote/:store', authv2.isAllowed, controller.vote);
router.put('/:store',auth.hasRole('admin'),controller.update);
router.patch('/:store', auth.hasRole('admin'), controller.update);
router.delete('/:store', auth.hasRole('admin'),controller.destroy);


module.exports = router;