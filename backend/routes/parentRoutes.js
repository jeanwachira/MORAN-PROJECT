const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

router.post('/', parentController.createParent);
router.put('/:id', parentController.editParent);
router.get('/', parentController.getAllParents);
router.get('/:id', parentController.getParentById);
router.delete('/:id', parentController.deleteParent);

module.exports = router;
