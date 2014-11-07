'use strict';

var express = require('express');
var controller = require('./comment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/:store', controller.index);
router.get('/:store/:comment', controller.show);
router.post('/:store', auth.hasRole('admin'), controller.create);
router.put('/:store/:comment', auth.hasRole('admin'), controller.approve);
router.delete('/:store/:comment', auth.hasRole('admin'), controller.destroy);

module.exports = router;