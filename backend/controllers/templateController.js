const asyncHandler = require('express-async-handler');
const Template = require('../models/Template');

// @desc    Get all templates (optionally filtered by category or search query)
// @route   GET /api/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const templates = await Template.find(filter).sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: templates.length, templates });
});

// @desc    Create a new template
// @route   POST /api/templates
// @access  Private/Admin
const createTemplate = asyncHandler(async (req, res) => {
  const { title, category, promptText, description, icon } = req.body;

  if (!title || !promptText || !description) {
    res.status(400);
    throw new Error('title, promptText, and description are required');
  }

  const template = await Template.create({ title, category, promptText, description, icon });
  res.status(201).json({ success: true, template });
});

// @desc    Update an existing template
// @route   PUT /api/templates/:id
// @access  Private/Admin
const updateTemplate = asyncHandler(async (req, res) => {
  const { title, category, promptText, description, icon } = req.body;

  const template = await Template.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  if (title !== undefined) template.title = title;
  if (category !== undefined) template.category = category;
  if (promptText !== undefined) template.promptText = promptText;
  if (description !== undefined) template.description = description;
  if (icon !== undefined) template.icon = icon;

  await template.save();
  res.status(200).json({ success: true, template });
});

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Private/Admin
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  await template.deleteOne();
  res.status(200).json({ success: true, message: 'Template deleted successfully' });
});

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
