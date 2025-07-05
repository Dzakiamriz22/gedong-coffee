const supabase = require('../utils/supabase');

exports.getProduk = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const from = (page - 1) * limit;
  const to = from + parseInt(limit) - 1;

  const { data, error } = await supabase
    .from('produk')
    .select('*')
    .ilike('nama', `%${search}%`)
    .range(from, to);

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