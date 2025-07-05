const express = require('express');
const router = express.Router();
const isAdmin = require('../middlewares/auth');
const {
  createProduk,
  updateProduk,
  deleteProduk
} = require('../controllers/adminController');
const {
  createBerita,
  updateBerita,
  deleteBerita
} = require('../controllers/beritaController');
const { login } = require('../controllers/authController');
const { updateAbout } = require('../controllers/aboutController');
const {
  getKontak,
  deleteKontak
} = require('../controllers/contactController');
const {
  getSubscriber,
  deleteSubscriber
} = require('../controllers/subscriberController');


// Admin: CRUD produk
router.post('/produk', isAdmin, createProduk);
router.put('/produk/:id', isAdmin, updateProduk);
router.delete('/produk/:id', isAdmin, deleteProduk);

// Admin login
router.post('/login', login);

// Admin Berita
router.post('/berita', isAdmin, createBerita);
router.put('/berita/:id', isAdmin, updateBerita);
router.delete('/berita/:id', isAdmin, deleteBerita);

// Update About Us
router.put('/about', isAdmin, updateAbout);

// Subscribe & Message
router.get('/kontak', isAdmin, getKontak);
router.delete('/kontak/:id', isAdmin, deleteKontak);
router.get('/subscriber', isAdmin, getSubscriber);
router.delete('/subscriber/:id', isAdmin, deleteSubscriber);


module.exports = router;
