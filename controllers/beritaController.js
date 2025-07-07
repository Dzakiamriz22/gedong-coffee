const supabase = require('../utils/supabase');
const path = require('path');

async function uploadBeritaImageToSupabase(file) {
    if (!file) return null;

    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    const filePath = `berita_images/${fileName}`;

    const { data, error } = await supabase.storage
        .from('berita')
        .upload(filePath, file.buffer, {
            contentType: file.mimetype
        });

    if (error) throw new Error(`Upload gagal: ${error.message}`);

    const { data: publicData } = supabase
        .storage
        .from('berita')
        .getPublicUrl(filePath);

    return publicData.publicUrl;
}

async function deleteBeritaImageFromSupabase(imageUrl) {
    if (!imageUrl) return;
    try {
        const url = new URL(imageUrl);
        const parts = url.pathname.split('/'); // ['storage', 'v1', 'object', 'public', 'berita', 'berita_images/...']
        const index = parts.indexOf('berita');
        if (index !== -1) {
            const path = parts.slice(index + 1).join('/');
            await supabase.storage.from('berita').remove([path]);
        }
    } catch (e) {
        console.error('Gagal hapus gambar:', e.message);
    }
}

// ADMIN CREATE BERITA
exports.createBerita = async (req, res) => {
    try {
        const { judul, isi, tanggal } = req.body;
        const imageFile = req.file;

        let gambar = null;
        if (imageFile) {
            gambar = await uploadBeritaImageToSupabase(imageFile);
        }

        const { data, error } = await supabase.from('berita').insert([
            { judul, isi, gambar, tanggal }
        ]).select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN UPDATE BERITA
exports.updateBerita = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const imageFile = req.file;

        const { data: existing, error: fetchError } = await supabase
            .from('berita')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) return res.status(404).json({ error: 'Berita tidak ditemukan' });

        let gambar = existing.gambar;

        if (imageFile) {
            gambar = await uploadBeritaImageToSupabase(imageFile);
            if (existing.gambar) await deleteBeritaImageFromSupabase(existing.gambar);
        } else if (updateData.gambar_deleted === 'true') {
            if (existing.gambar) await deleteBeritaImageFromSupabase(existing.gambar);
            gambar = null;
        }

        delete updateData.gambar;
        delete updateData.gambar_deleted;

        const { data, error } = await supabase
            .from('berita')
            .update({ ...updateData, gambar })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN DELETE BERITA
exports.deleteBerita = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: berita, error: fetchError } = await supabase
            .from('berita')
            .select('gambar')
            .eq('id', id)
            .single();

        if (fetchError) return res.status(404).json({ error: 'Berita tidak ditemukan' });

        const { error } = await supabase.from('berita').delete().eq('id', id);
        if (error) throw error;

        if (berita.gambar) await deleteBeritaImageFromSupabase(berita.gambar);

        res.json({ message: 'Berita berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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


