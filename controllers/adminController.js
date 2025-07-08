const supabase = require('../utils/supabase');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Jenis file tidak didukung. Hanya JPG, PNG, JPEG.'), false);
    }
});

async function uploadImageToSupabase(file) {
    if (!file) return null;
    try {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = `product_images/${fileName}`;

        const { data, error } = await supabase.storage
            .from('produk')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
                metadata: {
                    uploaded_by: 'admin',
                    upload_date: new Date().toISOString()
                }
            });

        if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);

        const { data: publicUrlData } = supabase.storage
            .from('produk')
            .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Gagal mendapatkan URL publik gambar.');
        }

        return publicUrlData.publicUrl;
    } catch (error) {
        throw error;
    }
}

async function deleteImageFromSupabase(imageUrl) {
    if (!imageUrl) return;
    try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf('produk');
        if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from('produk').remove([filePath]);
        }
    } catch (error) {
        console.error("Error delete image:", error);
    }
}

exports.createProduk = async (req, res) => {
    try {
        const { nama, deskripsi, harga, is_highlight, is_best_seller, shopee_url } = req.body;
        const imageFile = req.file;

        if (!nama || !harga) {
            return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
        }

        let gambarUrl = null;
        if (imageFile) {
            gambarUrl = await uploadImageToSupabase(imageFile);
        }

        const productData = {
            nama,
            deskripsi: deskripsi || null,
            harga: parseFloat(harga),
            gambar: gambarUrl,
            is_highlight: is_highlight === 'true' || is_highlight === true,
            is_best_seller: is_best_seller === 'true' || is_best_seller === true,
            shopee_url: shopee_url || null
        };

        const { data, error } = await supabase
            .from('produk')
            .insert([productData])
            .select();

        if (error) {
            if (gambarUrl) await deleteImageFromSupabase(gambarUrl);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduk = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const imageFile = req.file;

        const { data: existingProduct, error: fetchError } = await supabase
            .from('produk')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        let gambarUrl = existingProduct.gambar;

        if (imageFile) {
            gambarUrl = await uploadImageToSupabase(imageFile);
            if (existingProduct.gambar) await deleteImageFromSupabase(existingProduct.gambar);
        } else if (updateData.gambar_deleted === 'true') {
            if (existingProduct.gambar) await deleteImageFromSupabase(existingProduct.gambar);
            gambarUrl = null;
        }

        const cleanUpdateData = { ...updateData };
        delete cleanUpdateData.gambar;
        delete cleanUpdateData.gambar_deleted;

        if (typeof cleanUpdateData.is_highlight === 'string') {
            cleanUpdateData.is_highlight = cleanUpdateData.is_highlight === 'true';
        }
        if (typeof cleanUpdateData.is_best_seller === 'string') {
            cleanUpdateData.is_best_seller = cleanUpdateData.is_best_seller === 'true';
        }
        if (cleanUpdateData.harga) {
            cleanUpdateData.harga = parseFloat(cleanUpdateData.harga);
        }
        if (cleanUpdateData.shopee_url === '') {
            cleanUpdateData.shopee_url = null;
        }

        cleanUpdateData.gambar = gambarUrl;

        const { data, error } = await supabase
            .from('produk')
            .update(cleanUpdateData)
            .eq('id', id)
            .select();

        if (error) return res.status(500).json({ error: error.message });
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduk = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: productData, error: fetchError } = await supabase
            .from('produk')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        const { error } = await supabase
            .from('produk')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });

        if (productData && productData.gambar) {
            await deleteImageFromSupabase(productData.gambar);
        }

        res.json({ message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upload = upload;
