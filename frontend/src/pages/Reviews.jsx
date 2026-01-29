import React, { useState, useEffect, useContext } from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { ICOContent } from '../Context';
import { reviewsAPI } from '../services/api';
import { Star, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Reviews page – users can read reviews and leave a review when wallet is connected.
 */
const Reviews = () => {
  const { address } = useContext(ICOContent);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsAPI.getReviews(page, 20);
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      toast.error('Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await reviewsAPI.getStats();
      setStats(data);
    } catch (_) {
      setStats(null);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      toast.error('Connect your wallet to leave a review');
      return;
    }
    if (!form.body.trim()) {
      toast.error('Please write your review');
      return;
    }
    setSubmitting(true);
    try {
      await reviewsAPI.createReview({
        walletAddress: address,
        rating: form.rating,
        title: form.title.trim(),
        body: form.body.trim(),
      });
      toast.success('Review posted!');
      setForm({ rating: 5, title: '', body: '' });
      loadReviews();
      loadStats();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <MessageSquare className="text-purple-400" /> Reviews
        </h1>
        <p className="text-gray-400 mb-8">
          See what others say about Durchex. Connect your wallet to leave a review.
        </p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-2xl font-bold text-purple-400">{stats.totalReviews}</div>
              <div className="text-sm text-gray-400">Total reviews</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
                <Star size={20} fill="currentColor" /> {stats.averageRating?.toFixed(1) || '0'}
              </div>
              <div className="text-sm text-gray-400">Average rating</div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-sm text-gray-400">
              {[5, 4, 3, 2, 1].map((star) => (
                <span key={star} className="flex items-center gap-1">
                  {star}★ {stats.byStar?.[star] ?? 0}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Submit form – only when wallet connected */}
        {address ? (
          <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Leave a review</h2>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    size={28}
                    className={form.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-500'}
                  />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 mb-4"
              maxLength={200}
            />
            <textarea
              placeholder="Your review..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4 min-h-[100px]"
              required
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={submitting || !form.body.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              <Send size={18} /> {submitting ? 'Posting...' : 'Post review'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8 text-center text-gray-400">
            Connect your wallet to leave a review.
          </div>
        )}

        {/* List */}
        <h2 className="text-lg font-semibold text-white mb-4">All reviews</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No reviews yet. Be the first!</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-mono text-sm">
                      {shortAddress(r.walletAddress)}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={r.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.title && <div className="font-semibold text-white mb-1">{r.title}</div>}
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{r.body}</p>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Reviews;
