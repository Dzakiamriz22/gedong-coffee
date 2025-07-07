const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

exports.createProduk = async (req, res) => {
  const { nama, deskripsi, harga, kategori, is_highlight = false, is_best_seller = false } = req.body;
  const file = req.file;

  let gambarUrl = null;

  if (file) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('produk')
      .upload(`images/${fileName}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: publicUrlData } = supabase
      .storage
      .from('produk')
      .getPublicUrl(`images/${fileName}`);
      
    gambarUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase.from('produk').insert([
    { nama, deskripsi, harga, gambar: gambarUrl, kategori, is_highlight, is_best_seller }
  ]);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

exports.updateProduk = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const file = req.file;

  if (file) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('produk')
      .upload(`images/${fileName}`, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: publicUrlData } = supabase
      .storage
      .from('produk')
      .getPublicUrl(`images/${fileName}`);

    updateData.gambar = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('produk')
    .update(updateData)
    .eq('id', id);

  if (error) return res.status(500).json({ error });
  res.json(data);
};
