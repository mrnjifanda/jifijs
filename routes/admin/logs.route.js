const { Router } = require('express');
const router = Router();

const logsController = require('../../src/controllers/admin/logs.controller');

router.get('/filters', logsController.all);
router.get('/filters/:id', logsController.findById);
router.get('/filters/user/:id', logsController.findByUser);

module.exports = router;
