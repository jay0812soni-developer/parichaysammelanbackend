import { Router } from 'express';
import multer from 'multer';
import { query, queryResult } from '../db.js';
import { uploadBuffer } from '../cloudinary.js';
import {
  entryBodySchema,
  ownerParamsSchema,
  publicEntry,
} from '../validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /image\/(jpeg|jpg|png|gif|webp)/i.test(file.mimetype);
    cb(ok ? null : new Error('Only image uploads are allowed'), ok);
  },
});

export const entriesRouter = Router();

const INSERT_SQL = `INSERT INTO entries
  (email, photo_url, cloudinary_public_id, name, age, whatsapp, gender, height_cm, manglik,
   marital_status, study, yearly_income, aadhaar, father_name, father_gautra, mother_name,
   mother_father_name, mother_gautra, mother_parents_address, present_address, permanent_address)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  RETURNING id`;

const UPDATE_SQL = `UPDATE entries SET
  email=?, photo_url=?, cloudinary_public_id=?, name=?, age=?, whatsapp=?, gender=?, height_cm=?,
  manglik=?, marital_status=?, study=?, yearly_income=?, aadhaar=?, father_name=?, father_gautra=?,
  mother_name=?, mother_father_name=?, mother_gautra=?, mother_parents_address=?, present_address=?,
  permanent_address=?, updated_at=NOW()
  WHERE id=? AND email=?`;

function rowValues(data, photoUrl, publicId) {
  return [
    data.email,
    photoUrl,
    publicId || null,
    data.name,
    data.age,
    data.whatsapp,
    data.gender,
    data.height_cm,
    data.manglik,
    data.marital_status,
    data.study,
    data.yearly_income,
    data.aadhaar,
    data.father_name,
    data.father_gautra,
    data.mother_name,
    data.mother_father_name,
    data.mother_gautra,
    data.mother_parents_address,
    data.present_address,
    data.permanent_address,
  ];
}

entriesRouter.post('/', upload.single('photo'), async (req, res) => {
  try {
    const parsed = entryBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const data = parsed.data;
    let photoUrl = data.photo_url;
    let publicId = data.cloudinary_public_id || null;

    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, req.file.originalname);
      photoUrl = result.secure_url;
      publicId = result.public_id;
    }

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Photo is required (upload file or provide photo_url)',
      });
    }

    const result = await queryResult(INSERT_SQL, rowValues(data, photoUrl, publicId));
    const insertedId = result.rows[0].id;
    return res.status(201).json({
      success: true,
      unique_id: insertedId,
      photo_url: photoUrl,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create entry' });
  }
});

entriesRouter.get('/:id', async (req, res) => {
  try {
    const parsed = ownerParamsSchema.safeParse({
      id: req.params.id,
      email: req.query.email,
    });
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Valid id and email are required' });
    }
    const { id, email } = parsed.data;
    const rows = await query(
      'SELECT * FROM entries WHERE id = ? AND email = ? LIMIT 1',
      [id, email]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    return res.json({
      success: true,
      data: publicEntry(rows[0], { fullAadhaar: true }),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch entry' });
  }
});

entriesRouter.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const parsed = entryBodySchema.safeParse(req.body);
    if (!parsed.success || !Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        error: parsed.success
          ? 'Invalid id'
          : parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const data = parsed.data;
    const existing = await query(
      'SELECT * FROM entries WHERE id = ? AND email = ? LIMIT 1',
      [id, data.email]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    let photoUrl = data.photo_url || existing[0].photo_url;
    let publicId = data.cloudinary_public_id ?? existing[0].cloudinary_public_id;

    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, req.file.originalname);
      photoUrl = result.secure_url;
      publicId = result.public_id;
    }

    await query(UPDATE_SQL, [
      ...rowValues(data, photoUrl, publicId),
      id,
      data.email,
    ]);

    return res.json({ success: true, unique_id: id, photo_url: photoUrl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to update entry' });
  }
});
