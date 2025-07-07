const supabase = require('../utils/supabase');
const multer = require('multer');
const path = require('path');

// Konfigurasi Multer untuk menyimpan file di memori (buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Batasan ukuran file 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Jenis file tidak didukung. Hanya JPG, PNG, JPEG yang diizinkan.'), false);
        }
    }
});

// Fungsi pembantu untuk mengunggah gambar ke Supabase Storage
async function uploadImageToSupabase(file) {
    if (!file) return null;

    try {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = `product_images/${fileName}`;

        console.log('Uploading file to Supabase:', filePath);
        console.log('File size:', file.size);
        console.log('File type:', file.mimetype);

        // Use the service role client for storage operations to bypass RLS
        const { data, error } = await supabase.storage
            .from('produk')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
                // Add metadata to identify the file
                metadata: {
                    uploaded_by: 'admin',
                    upload_date: new Date().toISOString()
                }
            });

        if (error) {
            console.error("Supabase storage error:", error);
            throw new Error(`Gagal mengunggah gambar: ${error.message}`);
        }

        console.log('Upload successful:', data);

        // Mendapatkan URL publik dari file yang diunggah
        const { data: publicUrlData } = supabase.storage
            .from('produk')
            .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Gagal mendapatkan URL publik gambar.');
        }

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error in uploadImageToSupabase:', error);
        throw error;
    }
}

// Fungsi untuk menghapus gambar dari Supabase Storage
async function deleteImageFromSupabase(imageUrl) {
    if (!imageUrl) return;

    try {
        // Extract file path from the public URL
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.indexOf('produk');
        
        if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            
            const { error } = await supabase.storage
                .from('produk')
                .remove([filePath]);

            if (error) {
                console.error("Error deleting image from Supabase Storage:", error);
            } else {
                console.log('Image deleted successfully:', filePath);
            }
        }
    } catch (error) {
        console.error("Error parsing image URL for deletion:", error);
    }
}

exports.createProduk = async (req, res) => {
    try {
        console.log('Creating product with data:', req.body);
        console.log('File received:', req.file ? 'Yes' : 'No');

        const { nama, deskripsi, harga, kategori, is_highlight, is_best_seller } = req.body;
        const imageFile = req.file;

        if (!nama || !harga) {
            return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });
        }

        let gambarUrl = null;
        if (imageFile) {
            try {
                gambarUrl = await uploadImageToSupabase(imageFile);
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(500).json({ error: `Gagal mengunggah gambar: ${uploadError.message}` });
            }
        }

        const productData = {
            nama,
            deskripsi: deskripsi || null,
            harga: parseFloat(harga),
            gambar: gambarUrl,
            kategori: kategori || 'Regular',
            is_highlight: is_highlight === 'true' || is_highlight === true,
            is_best_seller: is_best_seller === 'true' || is_best_seller === true
        };

        const { data, error } = await supabase
            .from('produk')
            .insert([productData])
            .select();

        if (error) {
            console.error("Supabase insert error:", error);
            // If database insert fails, delete the uploaded image
            if (gambarUrl) {
                await deleteImageFromSupabase(gambarUrl);
            }
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Create Produk error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduk = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const imageFile = req.file;

        console.log('Updating product with ID:', id);
        console.log('Update data:', updateData);
        console.log('New file received:', imageFile ? 'Yes' : 'No');

        // Get existing product data
        const { data: existingProduct, error: fetchError } = await supabase
            .from('produk')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error("Error fetching existing product:", fetchError);
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        let gambarUrl = existingProduct.gambar; // Keep existing image by default

        // Handle image upload/deletion logic
        if (imageFile) {
            // Upload new image
            try {
                gambarUrl = await uploadImageToSupabase(imageFile);
                
                // Delete old image if it exists
                if (existingProduct.gambar) {
                    await deleteImageFromSupabase(existingProduct.gambar);
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                return res.status(500).json({ error: `Gagal mengunggah gambar: ${uploadError.message}` });
            }
        } else if (updateData.gambar_deleted === 'true') {
            // Delete existing image
            if (existingProduct.gambar) {
                await deleteImageFromSupabase(existingProduct.gambar);
            }
            gambarUrl = null;
        }

        // Clean up the update data
        const cleanUpdateData = { ...updateData };
        delete cleanUpdateData.gambar;
        delete cleanUpdateData.gambar_deleted;

        // Convert string booleans to actual booleans
        if (typeof cleanUpdateData.is_highlight === 'string') {
            cleanUpdateData.is_highlight = cleanUpdateData.is_highlight === 'true';
        }
        if (typeof cleanUpdateData.is_best_seller === 'string') {
            cleanUpdateData.is_best_seller = cleanUpdateData.is_best_seller === 'true';
        }

        // Ensure price is a number
        if (cleanUpdateData.harga) {
            cleanUpdateData.harga = parseFloat(cleanUpdateData.harga);
        }

        // Add the image URL to the update data
        cleanUpdateData.gambar = gambarUrl;

        const { data, error } = await supabase
            .from('produk')
            .update(cleanUpdateData)
            .eq('id', id)
            .select();

        if (error) {
            console.error("Supabase update error:", error);
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        res.json(data[0]);
    } catch (err) {
        console.error("Update Produk error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduk = async (req, res) => {
    try {
        const { id } = req.params;

        // Get product data to retrieve image URL
        const { data: productData, error: fetchError } = await supabase
            .from('produk')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error("Supabase fetch error for delete:", fetchError);
            return res.status(404).json({ error: 'Produk tidak ditemukan.' });
        }

        // Delete product from database
        const { error } = await supabase
            .from('produk')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Supabase delete error:", error);
            return res.status(500).json({ error: error.message });
        }

        // Delete image from storage if it exists
        if (productData && productData.gambar) {
            await deleteImageFromSupabase(productData.gambar);
        }

        res.json({ message: 'Produk berhasil dihapus' });
    } catch (err) {
        console.error("Delete Produk error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Export upload middleware
exports.upload = upload;