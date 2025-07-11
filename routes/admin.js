const express = require('express');
const router = express.Router();
const isAdmin = require('../middlewares/auth');
const {
    createProduk,
    updateProduk,
    deleteProduk,
    upload // Impor objek upload
} = require('../controllers/adminController');
const {
    createBerita,
    updateBerita,
    deleteBerita
} = require('../controllers/beritaController');
const { login } = require('../controllers/authController');
const { updateAbout } = require('../controllers/aboutController');
const {
    getSubscriber,
    deleteSubscriber
} = require('../controllers/subscriberController');
const {
    getKontak,
    getKontakById,
    updateKontakStatus,
    deleteKontak
} = require('../controllers/contactController');


// Admin: CRUD produk
router.post('/produk', isAdmin, upload.single('gambar'), createProduk);
router.put('/produk/:id', isAdmin, upload.single('gambar'), updateProduk);
router.delete('/produk/:id', isAdmin, deleteProduk); 

// Admin login
router.post('/login', login);

// Admin Berita
router.post('/berita', isAdmin, upload.single('gambar'), createBerita);
router.put('/berita/:id', isAdmin, upload.single('gambar'), updateBerita);
router.delete('/berita/:id', isAdmin, deleteBerita);

// Update About Us
router.put('/about', isAdmin, updateAbout);

// Subscribe & Message
router.get('/kontak', isAdmin, getKontak);
router.delete('/kontak/:id', isAdmin, deleteKontak);
router.put('/kontak/:id', isAdmin, updateKontakStatus);
router.get('/kontak/:id', isAdmin, getKontakById);
router.get('/subscriber', isAdmin, getSubscriber);
router.delete('/subscriber/:id', isAdmin, deleteSubscriber);


module.exports = router;