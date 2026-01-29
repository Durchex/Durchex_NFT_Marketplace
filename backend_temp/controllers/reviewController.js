import Review from '../models/reviewModel.js';

export const getReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(),
    ]);

    res.status(200).json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { walletAddress, rating, title, body } = req.body;

    if (!walletAddress || !rating || body == null || body === '') {
      return res.status(400).json({
        error: 'walletAddress, rating, and body are required. Connect your wallet to leave a review.',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const review = new Review({
      walletAddress: walletAddress.toLowerCase().trim(),
      rating: numRating,
      title: (title || '').trim().slice(0, 200),
      body: String(body).trim().slice(0, 2000),
    });

    await review.save();

    res.status(201).json({
      success: true,
      review: {
        _id: review._id,
        walletAddress: review.walletAddress,
        rating: review.rating,
        title: review.title,
        body: review.body,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getReviewStats = async (req, res) => {
  try {
    const [total, avgRating, distribution] = await Promise.all([
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

    const avg = avgRating[0]?.avg ?? 0;
    const byStar = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      byStar[d._id] = d.count;
    });

    res.status(200).json({
      totalReviews: total,
      averageRating: Math.round(avg * 100) / 100,
      byStar,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: error.message });
  }
}
