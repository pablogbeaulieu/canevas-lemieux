const express = require('express');
const Canevas = require('../models/Canevas');

const router = express.Router();

// Récupérer tous les canevas
router.get('/', async (req, res) => {
  try {
    const canevas = await Canevas.find();
    res.json(canevas);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Ajouter un nouveau canevas
router.post('/', async (req, res) => {
  try {
    const newCanevas = new Canevas(req.body);
    await newCanevas.save();
    res.status(201).json(newCanevas);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de l'ajout", error });
  }
});

// Modifier un canevas
router.put('/:id', async (req, res) => {
  try {
    const updatedCanevas = await Canevas.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCanevas);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error });
  }
});

// Supprimer un canevas
router.delete('/:id', async (req, res) => {
  try {
    await Canevas.findByIdAndDelete(req.params.id);
    res.json({ message: "Canevas supprimé avec succès" });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la suppression", error });
  }
});

module.exports = router;
