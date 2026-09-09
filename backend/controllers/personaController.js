const asyncHandler = require('express-async-handler');
const Persona = require('../models/Persona');

// @desc    Get all personas
// @route   GET /api/personas
// @access  Private
const getPersonas = asyncHandler(async (req, res) => {
  const personas = await Persona.find().sort({ createdAt: 1 });
  res.status(200).json({ success: true, count: personas.length, personas });
});

// @desc    Create a new persona
// @route   POST /api/personas
// @access  Private/Admin
const createPersona = asyncHandler(async (req, res) => {
  const { name, systemPrompt, description, icon, category } = req.body;

  if (!name || !systemPrompt || !description) {
    res.status(400);
    throw new Error('name, systemPrompt, and description are required');
  }

  const persona = await Persona.create({ name, systemPrompt, description, icon, category });
  res.status(201).json({ success: true, persona });
});

// @desc    Update an existing persona
// @route   PUT /api/personas/:id
// @access  Private/Admin
const updatePersona = asyncHandler(async (req, res) => {
  const { name, systemPrompt, description, icon, category } = req.body;

  const persona = await Persona.findById(req.params.id);
  if (!persona) {
    res.status(404);
    throw new Error('Persona not found');
  }

  if (name !== undefined) persona.name = name;
  if (systemPrompt !== undefined) persona.systemPrompt = systemPrompt;
  if (description !== undefined) persona.description = description;
  if (icon !== undefined) persona.icon = icon;
  if (category !== undefined) persona.category = category;

  await persona.save();
  res.status(200).json({ success: true, persona });
});

// @desc    Delete a persona
// @route   DELETE /api/personas/:id
// @access  Private/Admin
const deletePersona = asyncHandler(async (req, res) => {
  const persona = await Persona.findById(req.params.id);
  if (!persona) {
    res.status(404);
    throw new Error('Persona not found');
  }

  await persona.deleteOne();
  res.status(200).json({ success: true, message: 'Persona deleted successfully' });
});

module.exports = { getPersonas, createPersona, updatePersona, deletePersona };
