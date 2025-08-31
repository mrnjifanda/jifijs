const { Router } = require('express');
const router = Router();

const indexController = require('../src/controllers/index.controller');

router.get('/', indexController.welcome);

module.exports = router;
