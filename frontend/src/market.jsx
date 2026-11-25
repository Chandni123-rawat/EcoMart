import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Handshake, Leaf, Recycle, Search, SlidersHorizontal, Tag, X } from 'lucide-react'
import { conditions, useData } from './api'
import { categories, ProductCard, Select, State } from './components/shared'
import { Button } from './components/ui/button'

const steps = [
  [Search, 'Find what you need', 'Browse pre-loved books, gear and more from students on campus.'],
  [Tag, 'Send a request', 'Request to buy an item or propose a swap when the seller is open to it.'],
  [Handshake, 'Meet on campus', 'Arrange the handover together and confirm it once you’ve met.']
]

export function Home() {
  const featured = useData('/listings?available=true')
  return <>
    <section className="shell hero">
      <div className="hero-copy">
        <div className="hero-kicker"><Leaf size={15} /> THE CAMPUS MARKETPLACE</div>
        <h1>Give Campus<br className="desktop-break" /> Essentials a<br className="desktop-break" /> <span>Second Life</span></h1>
        <p>Buy, sell and swap pre-loved academic essentials with students on your campus. Spend less, waste less, and pass good things on.</p>
        <div className="hero-actions">
          <Button asChild><Link to="/marketplace"><Search size={18} /> Browse Marketplace</Link></Button>
          <Button asChild variant="outline"><Link to="/sell">Sell an Item</Link></Button>
        </div>
      </div>
      <figure className="hero-image">
        <img src="/images/campus.webp" alt="A green bicycle with a wicker basket on a sunlit university campus" fetchPriority="high" />
        <figcaption><span><Recycle size={20} /></span><div><strong>Good things go full circle</strong><small>Student to student, on campus.</small></div></figcaption>
      </figure>
    </section>
    <section className="shell section categories-section">
      <div className="section-heading"><div><h2>Shop by category</h2><p>Find what you need for the semester ahead.</p></div></div>
      <div className="category-grid">
        {categories.map(({ id, name, icon: Icon, description }) => <Link key={id} className="category-card" to={'/marketplace?category=' + id}>
          <span className={'category-icon ' + id}><Icon size={23} strokeWidth={1.8} /></span>
          <span><strong>{name}</strong><small>{description}</small></span>
        </Link>)}
      </div>
    </section>
    <section className="featured-section"><div className="shell section">
      <div className="section-heading"><div><h2>Featured listings</h2><p>Fresh finds from around campus.</p></div><Button variant="outline" asChild><Link to="/marketplace">View marketplace</Link></Button></div>
      <State query={featured} empty="There are no available listings yet." />
      {featured.data?.length > 0 && <div className="product-grid">{featured.data.slice(0, 4).map(item => <ProductCard key={item.id} item={item} />)}</div>}
    </div></section>
    <section className="shell section how">
      <h2>How it works</h2>
      <div className="steps">{steps.map(([Icon, title, copy]) => <div key={title}><span className="category-icon"><Icon size={24} /></span><h3>{title}</h3><p>{copy}</p></div>)}</div>
    </section>
    <section className="shell section sustainable-wrap">
      <div className="sustainable"><span className="sustainable-icon"><Leaf size={40} /></span><div><h2>Keep good gear in use</h2><p>Passing on a textbook, calculator or bike can help another student get what they need and keep usable items out of the waste stream.</p></div><Button asChild variant="outline"><Link to="/sell">List an item</Link></Button></div>
    </section>
  </>
}

export function Marketplace() {
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(() => Object.fromEntries(params))
  const [filtersOpen, setFiltersOpen] = useState(false)
  useEffect(() => setDraft(Object.fromEntries(params)), [params])
  const listings = useData('/listings?' + params)
  const update = (field, value) => setDraft(prev => ({ ...prev, [field]: value }))
  const sort = value => {
    const next = new URLSearchParams(params)
    if (value) next.set('sort', value)
    else next.delete('sort')
    setParams(next)
  }
  const apply = event => {
    event.preventDefault()
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value))
    setParams(next)
    setFiltersOpen(false)
  }
  return <section className="shell page">
    <div className="page-heading"><h1>Marketplace</h1><p>Find pre-loved essentials from students on your campus.</p></div>
    <div className="catalog-layout">
      <form className="filters panel" onSubmit={apply}>
        <div className="search-input"><Search size={19} /><input aria-label="Search products by name" placeholder="Search products…" value={draft.search || ''} onChange={event => update('search', event.target.value)} /></div>
        <button type="button" className="mobile-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17} /> Filters</button>
        <div className={'filter-fields ' + (filtersOpen ? 'filter-open' : '')}>
          <h2><SlidersHorizontal size={17} /> Filters</h2>
          <label>Category<Select value={draft.category || ''} onChange={event => update('category', event.target.value)}><option value="">All categories</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
          <label>Condition<Select value={draft.condition || ''} onChange={event => update('condition', event.target.value)}><option value="">Any condition</option>{Object.entries(conditions).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select></label>
          <div className="price-fields"><label>Min price (₹)<input type="number" min="0" step=".01" placeholder="0" value={draft.minPrice || ''} onChange={event => update('minPrice', event.target.value)} /></label><label>Max price (₹)<input type="number" min="0" step=".01" placeholder="Any" value={draft.maxPrice || ''} onChange={event => update('maxPrice', event.target.value)} /></label></div>
          <label>Brand<input placeholder="Any brand" value={draft.brand || ''} onChange={event => update('brand', event.target.value)} /></label>
          <label>Max age (years)<input type="number" min="0" max="100" placeholder="Any age" value={draft.maxAge || ''} onChange={event => update('maxAge', event.target.value)} /></label>
          <label className="checkbox"><input type="checkbox" checked={draft.available === 'true'} onChange={event => update('available', event.target.checked ? 'true' : '')} /> Only available</label>
        </div>
        <Button type="submit">Apply filters</Button>
        {([...params].some(([key]) => key !== 'sort') || Object.entries(draft).some(([key, value]) => key !== 'sort' && value)) && <Button type="button" variant="ghost" onClick={() => { setDraft({}); setParams({}) }}><X size={15} /> Clear filters</Button>}
      </form>
      <div className="results">
        <div className="result-toolbar"><span aria-live="polite">{listings.data ? `${listings.data.length} ${listings.data.length === 1 ? 'listing' : 'listings'}` : 'Listings'}</span><Select aria-label="Sort listings" value={params.get('sort') || ''} onChange={event => sort(event.target.value)}><option value="">Newest first</option><option value="price-asc">Price low to high</option><option value="price-desc">Price high to low</option></Select></div>
        <State query={listings} empty="No listings match your filters." />
        {listings.data?.length > 0 && <div className="product-grid catalog-grid">{listings.data.map(item => <ProductCard key={item.id} item={item} />)}</div>}
      </div>
    </div>
  </section>
}
