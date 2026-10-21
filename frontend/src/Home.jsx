import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Leaf, PackageCheck, Recycle } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from './context/AppContext'
import { productsApi } from './services/shop'
import { messageFromError } from './services/api'
import './home.css'

const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
const categories = [
  { name: 'Home', label: 'Reusable at home', detail: 'Small swaps for daily routines', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80' },
  { name: 'Outdoor', label: 'Out and about', detail: 'Keep useful things in rotation', image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=80' },
  { name: 'Accessories', label: 'Everyday carry', detail: 'Practical pieces for the week', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
]

function ProductTile({ product }) {
  const { addToCart } = useApp()
  const image = product.images?.[0]?.url
  return <article className="home-product">
    <Link className="home-product-image" to={`/product/${product._id}`}>
      {image ? <img src={image} alt={product.name} loading="lazy"/> : <span aria-hidden="true">ShopIT</span>}
      <span className="home-product-category">{product.category}</span>
    </Link>
    <div className="home-product-info">
      <div><Link to={`/product/${product._id}`} className="home-product-name">{product.name}</Link><p>{product.seller}</p></div>
      <strong>{money(product.price)}</strong>
    </div>
    <button className="home-add" disabled={product.stock < 1} onClick={() => { addToCart(product); toast.success('Added to your bag') }}>
      {product.stock < 1 ? 'Unavailable' : 'Add to bag'} <ArrowRight size={15}/>
    </button>
  </article>
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    productsApi.list({ page: 1 }).then(({ data }) => setProducts(data.products || []))
      .catch((err) => setError(messageFromError(err, 'The collection is temporarily unavailable.')))
      .finally(() => setLoading(false))
  }, [])

  return <div className="home-v2">
    <section className="home-hero">
      <div className="home-hero-copy">
        <span className="home-overline">SHOPIT · EVERYDAY GOODS</span>
        <h1>Buy less.<br/><em>Choose well.</em></h1>
        <p>A considered collection of useful goods, with a focus on reusable materials and everyday value.</p>
        <Link className="button button-dark" to="/shop">Shop the collection <ArrowRight size={17}/></Link>
        <div className="home-note"><Leaf size={16}/><span>Start with one thing you’ll use again and again.</span></div>
      </div>
      <div className="home-hero-image">
        <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85" alt="A selection of everyday clothing and goods"/>
        <div className="home-image-caption"><span>THE EVERYDAY EDIT</span><b>Useful things, chosen with care.</b></div>
      </div>
    </section>

    <section className="home-principles" aria-label="How we choose products">
      <div><Recycle size={19}/><span><b>Made to be used again</b><small>Reusable options where they make sense</small></span></div>
      <div><PackageCheck size={19}/><span><b>Clear product details</b><small>Materials and care, without inflated claims</small></span></div>
      <div><Leaf size={19}/><span><b>Practical over perfect</b><small>Small, useful changes for daily life</small></span></div>
    </section>

    <section className="home-section">
      <div className="home-section-heading"><div><span className="home-overline">SHOP BY CATEGORY</span><h2>Start with what you need.</h2></div><Link to="/shop" className="home-text-link">All products <ArrowUpRight size={16}/></Link></div>
      <div className="home-category-grid">{categories.map((item) => <Link key={item.name} className="home-category" to={`/shop?category=${item.name}`}>
        <img src={item.image} alt="" loading="lazy"/><span className="home-category-copy"><b>{item.label}</b><small>{item.detail}</small></span><ArrowUpRight size={18}/>
      </Link>)}</div>
    </section>

    <section className="home-section home-featured">
      <div className="home-section-heading"><div><span className="home-overline">THE CURRENT COLLECTION</span><h2>Useful things to keep close.</h2></div><Link to="/shop" className="home-text-link">Browse the shop <ArrowUpRight size={16}/></Link></div>
      {error ? <div className="home-message"><p>{error}</p><span>Check that the ShopIT API is running and the collection has products.</span></div> : loading ? <div className="home-product-grid">{[1,2,3,4].map((item) => <div className="home-product-skeleton" key={item}/>)}</div> : products.length ? <div className="home-product-grid">{products.map((product) => <ProductTile key={product._id} product={product}/>)}</div> : <div className="home-message"><p>The collection is being prepared.</p><span>New products will appear here when they’re added to ShopIT.</span></div>}
    </section>

    <section className="home-callout"><div><span className="home-overline">A BETTER EVERYDAY, ONE STEP AT A TIME</span><h2>Good choices should feel easy.</h2><p>Look for durable materials, straightforward care, and products you can see yourself reaching for often.</p></div><Link className="button button-outline" to="/shop">Explore all products <ArrowRight size={16}/></Link></section>
  </div>
}
