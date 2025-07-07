const supabase = require('../utils/supabase');

// GUEST: Create Kontak
exports.createKontak = async (req, res) => {
  const { nama, email, pesan } = req.body;
  const { data, error } = await supabase.from('kontak').insert([{ nama, email, pesan }]);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Pesan berhasil dikirim', data });
};

// ADMIN: Lihat semua pesan (dengan pagination)
exports.getKontak = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const from = (page - 1) * limit;
  const to = from + parseInt(limit) - 1;

  const { data, error } = await supabase
    .from('kontak')
    .select('*')
    .or(`nama.ilike.%${search}%,email.ilike.%${search}%,pesan.ilike.%${search}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

// ADMIN: Hapus kontak
exports.deleteKontak = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('kontak').delete().eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Pesan kontak berhasil dihapus', data });
};

// ADMIN: Tandai sebagai dibaca / bintang
exports.updateKontakStatus = async (req, res) => {
  const { id } = req.params;
  const { is_read, is_starred } = req.body;

  const { data, error } = await supabase
    .from('kontak')
    .update({
      ...(is_read !== undefined && { is_read }),
      ...(is_starred !== undefined && { is_starred }),
      updated_at: new Date()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error });
  res.json({ message: 'Status pesan diperbarui', data });
};

// ADMIN: Ambil detail satu pesan
exports.getKontakById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('kontak')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error });
  if (!data) return res.status(404).json({ message: 'Pesan tidak ditemukan' });

  res.json(data);
};
