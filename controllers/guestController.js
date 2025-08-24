const supabase = require('../utils/supabase');

exports.getProduk = async (req, res) => {
  const { search = '', highlight, best_seller, kategori } = req.query;

  let query = supabase
    .from('produk')
    .select('*')
    .ilike('nama', `%${search}%`);

  if (highlight === 'true') query = query.eq('is_highlight', true);
  if (best_seller === 'true') query = query.eq('is_best_seller', true);
  if (kategori && kategori !== 'all') query = query.eq('kategori', kategori);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error });
  res.json(data);
};

exports.getProdukById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('produk')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(data);
};
