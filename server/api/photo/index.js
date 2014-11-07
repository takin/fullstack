'use strict';

var express = require('express');
var controller = require('./photo.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/:store', controller.show);
router.post('/:store', controller.insert);
router.delete('/:store', controller.destroy);

module.exports = router;