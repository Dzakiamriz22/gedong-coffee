const supabase = require('../utils/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { data: adminList, error } = await supabase
    .from('admin')
    .select('*')
    .eq('email', email);

  if (error) return res.status(500).json({ error: 'Supabase error', detail: error });
  if (!adminList || adminList.length === 0)
    return res.status(401).json({ error: 'Email tidak ditemukan' });

  const admin = adminList[0];

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ error: 'Password salah' });

  // Generate JWT
  const token = jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    message: 'Login berhasil',
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email
    }
  });
};
