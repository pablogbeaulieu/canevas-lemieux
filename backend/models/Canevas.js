const mongoose = require('mongoose');

const CanevasSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Catégorie (ex: BEMO, INFO, ASIN)
  subCategory: { type: String, required: true }, // Sous-catégorie
  title: { type: String, required: true }, // Titre du canevas
  content: { type: String, required: true }, // Contenu du canevas
});

module.exports = mongoose.model('Canevas', CanevasSchema);
