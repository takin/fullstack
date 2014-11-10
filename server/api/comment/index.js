'use strict';

var express = require('express');
var controller = require('./comment.controller');
var auth = require('../../auth/auth.service');
var authv2 = require('../../auth/auth.service.v2');

var router = express.Router();

router.get('/:sid', controller.index);
router.get('/:cid', controller.show);
router.put('/', auth.hasRole('admin'), controller.approve);
router.post('/', authv2.isAllowed, controller.create);
router.delete('/:store/:comment', auth.hasRole('admin'), controller.destroy);

module.exports = router;