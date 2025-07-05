const supabase = require('../utils/supabase');

exports.getProduk = async (req, res) => {
  const { page = 1, limit = 10, search = '', highlight, best_seller } = req.query;
  const from = (page - 1) * limit;
  const to = from + parseInt(limit) - 1;

  let query = supabase.from('produk').select('*').ilike('nama', `%${search}%`);

  if (highlight === 'true') query = query.eq('is_highlight', true);
  if (best_seller === 'true') query = query.eq('is_best_seller', true);

  const { data, error } = await query.range(from, to);

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