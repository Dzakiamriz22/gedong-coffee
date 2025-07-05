const express = require('express');
const router = express.Router();
const { getProduk, getProdukById } = require('../controllers/guestController');
const {
  getAllBerita,
  getBeritaById
} = require('../controllers/beritaController');

// Guest: Lihat list produk dan detail
router.get('/produk', getProduk);
router.get('/produk/:id', getProdukById);

// Guest : List Berita
router.get('/berita', getAllBerita);
router.get('/berita/:id', getBeritaById);

module.exports = router;
