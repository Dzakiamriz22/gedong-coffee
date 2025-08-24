const express = require('express');
const router = express.Router();
const { getProduk, getProdukById } = require('../controllers/guestController');
const {
  getAllBerita,
  getBeritaById
} = require('../controllers/beritaController');
const { getAbout } = require('../controllers/aboutController');
const { createKontak } = require('../controllers/contactController');
const { createSubscriber } = require('../controllers/subscriberController');

// Guest: Lihat list produk dan detail
router.get('/produk', getProduk);
router.get('/produk/:id', getProdukById);

// Guest : List Berita
router.get('/berita', getAllBerita);
router.get('/berita/:id', getBeritaById);

// Get About Us
router.get('/about', getAbout);

// Subscribe & Contact
router.post('/kontak', createKontak);
router.post('/subscribe', createSubscriber);

module.exports = router;
