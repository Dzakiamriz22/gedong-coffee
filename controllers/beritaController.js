const supabase = require('../utils/supabase');

// ADMIN CREATE BERITA
exports.createBerita = async (req, res) => {
  const { judul, isi, gambar, tanggal } = req.body;
  const { data, error } = await supabase.from('berita').insert([{ judul, isi, gambar, tanggal }]);
  if (error) return res.status(500).json({ error });
  res.json(data);
};

// ADMIN UPDATE BERITA
exports.updateBerita = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { data, error } = await supabase.from('berita').update(updateData).eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json(data);
};

// ADMIN DELETE BERITA
exports.deleteBerita = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('berita').delete().eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Berita berhasil dihapus', data });
};

// GUEST & ADMIN: GET SEMUA BERITA
exports.getAllBerita = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const from = (page - 1) * limit;
  const to = from + parseInt(limit) - 1;

  const { data, error } = await supabase
    .from('berita')
    .select('*')
    .ilike('judul', `%${search}%`)
    .order('tanggal', { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

// GUEST & ADMIN: GET DETAIL BERITA
exports.getBeritaById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('berita').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Berita tidak ditemukan' });
  res.json(data);
};
