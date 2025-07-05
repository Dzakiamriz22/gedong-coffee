const supabase = require('../utils/supabase');

// GUEST: GET About Us
exports.getAbout = async (req, res) => {
  const { data, error } = await supabase
    .from('about_us')
    .select('*')
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: 'Gagal mengambil About Us' });
  res.json(data);
};

// ADMIN: UPDATE About Us
exports.updateAbout = async (req, res) => {
  const updateData = req.body;

  const { data: existing, error: getErr } = await supabase
    .from('about_us')
    .select('id')
    .limit(1)
    .single();

  if (getErr) return res.status(500).json({ error: 'About Us belum ada' });

  const { data, error } = await supabase
    .from('about_us')
    .update({ ...updateData, updated_at: new Date() })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Gagal update About Us' });
  res.json(data);
};
