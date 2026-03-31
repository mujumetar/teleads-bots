const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const Category = require('../models/Category');
const CategoryRequest = require('../models/CategoryRequest');

const router = express.Router();

// PUBLIC/AUTH: GET /api/categories - List active categories for dropdowns
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// USER: POST /api/categories/request - Request new niche
router.post('/request', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const request = await CategoryRequest.create({
      name,
      description,
      requestedBy: req.user.id
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: GET /api/categories/admin/requests - List all requests
router.get('/admin/requests', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const requests = await CategoryRequest.find().populate('requestedBy', 'email').sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADMIN: POST /api/categories/admin/approve/:id - Approve and add category
router.post('/admin/approve/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const request = await CategoryRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // 1. Create the actual category
    const slug = request.name.toLowerCase().replace(/ /g, '-');
    await Category.create({
      name: request.name,
      slug,
      description: request.description,
      createdBy: req.user.id
    });

    // 2. Update request status
    request.status = 'approved';
    await request.save();

    res.json({ message: 'Category approved and added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
