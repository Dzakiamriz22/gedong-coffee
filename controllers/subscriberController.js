const supabase = require('../utils/supabase');

// GUEST: Subscribe
exports.createSubscriber = async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase.from('subscriber').insert([{ email }]);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Berhasil subscribe', data });
};

// ADMIN: Lihat semua subscriber
exports.getSubscriber = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const from = (page - 1) * limit;
  const to = from + parseInt(limit) - 1;

  const { data, error } = await supabase
    .from('subscriber')
    .select('*')
    .ilike('email', `%${search}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error });
  res.json(data);
};

// ADMIN: Hapus subscriber
exports.deleteSubscriber = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('subscriber').delete().eq('id', id);
  if (error) return res.status(500).json({ error });
  res.json({ message: 'Subscriber berhasil dihapus', data });
};