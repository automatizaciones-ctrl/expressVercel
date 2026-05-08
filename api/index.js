// trigger redeploy after Git connect
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida');
  }

  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(process.env.MONGODB_URI);
};

const ReviewSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, index: true },
  reviewer_name: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, {
  versionKey: false,
  collection: 'reviews' // <-- AGREGA ESTA LÍNEA AQUÍ
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

app.get('/api/reviews/:sku', async (req, res) => {
  try {
    await connectDB();
        const reviews = await Review.find({ sku: req.params.sku, rating: { $gte: 4 } }).sort({ created_at: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reseñas' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    await connectDB();

    const { sku, reviewer_name, rating, title, body } = req.body;

    const newReview = new Review({
      sku,
      reviewer_name,
      rating,
      title,
      body
    });

    await newReview.save();

    res.status(201).json(newReview);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.message
      });
    }

    res.status(500).json({ error: 'Error al guardar la reseña' });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    res.status(200).json({ message: 'Test exitoso' });
  } catch (error) {
    res.status(500).json({ error: 'Error test' });
  }
});

app.get('/api/testdb', async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({ 
      message: 'Test exitoso', 
      database_name: mongoose.connection.name // Te dirá 'carters' o 'test'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error test' });
  }
});


module.exports = app;
