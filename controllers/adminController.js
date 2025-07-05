const supabase = require('../utils/supabase');

exports.createProduk = async (req, res) => {
  const { nama, deskripsi, harga, gambar, kategori, is_highlight = false, is_best_seller = false } = req.body;

  const { data, error } = await supabase.from('produk').insert([
    { nama, deskripsi, harga, gambar, kategori, is_highlight, is_best_seller }
  ]);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

exports.updateProduk = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('produk')
    .update(updateData)
    .eq('id', id);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

exports.deleteProduk = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('produk')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error });
  res.json({ message: 'Deleted', data });
};
