import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { reviewsApi } from '../services/shop'
import { messageFromError } from '../services/api'

export default function ProductReviews({ productId, user }) {
  const [reviews, setReviews] = useState([])
  const [busy, setBusy] = useState(false)
  const load = () => reviewsApi.list(productId).then(({ data }) => setReviews(data.reviews || [])).catch(() => setReviews([]))
  useEffect(() => { if (user) load(); else setReviews([]) }, [productId, user])
  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await reviewsApi.save({ productId, rating: Number(form.get('rating')), comment: form.get('comment') })
      toast.success('Thanks for sharing your thoughts.')
      event.currentTarget.reset()
      await load()
    } catch (error) { toast.error(messageFromError(error, 'Your review could not be saved.')) }
    finally { setBusy(false) }
  }
  return <section className="product-reviews"><div className="review-heading"><span className="eyebrow">FROM THE COMMUNITY</span><h3>Notes from others</h3></div>{user ? <>{reviews.length ? <div className="review-list">{reviews.map((review) => <article key={review._id}><div><span className="review-stars"><Star size={13} fill="currentColor"/> {Number(review.rating).toFixed(1)}</span><small>{review.user?.name || 'ShopIT customer'}</small></div><p>{review.comment}</p></article>)}</div> : <p className="review-empty">No notes yet. You can be the first to share one.</p>}<form className="review-form" onSubmit={submit}><label>Your rating<select name="rating" defaultValue="5"><option value="5">5 · Loved it</option><option value="4">4 · Really good</option><option value="3">3 · Good</option><option value="2">2 · Could be better</option><option value="1">1 · Not for me</option></select></label><label>Your note<textarea name="comment" required minLength="2" maxLength="1000" placeholder="What did you think?"/></label><button className="button button-outline" disabled={busy}>{busy ? 'Saving…' : 'Share your note'}</button></form></> : <p className="review-empty">Sign in to see and share product reviews.</p>}</section>
}
