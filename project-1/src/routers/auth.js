const { Router } = require("express");

const authController = require('../controllers/auth.controller');

const router = Router();

router.get('/users', authController.getPage);
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

module.exports = router;

