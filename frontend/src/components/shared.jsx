import { Link } from 'react-router-dom'
import { ArrowLeftRight, Bike, BookOpen, Calculator, ChevronDown, CircleAlert, DraftingCompass, Leaf, LoaderCircle, PackageSearch } from 'lucide-react'
import { Button } from './ui/button'
import { conditions, imageUrl, label, money } from '../api'

export const categories = [
  { id: 'books', name: 'Books', icon: BookOpen, description: 'Textbooks & study guides' },
  { id: 'calculators', name: 'Calculators', icon: Calculator, description: 'Scientific & graphing' },
  { id: 'bicycles', name: 'Bicycles', icon: Bike, description: 'Get around campus' },
  { id: 'equipment', name: 'Academic Equipment', icon: DraftingCompass, description: 'Tools for hands-on learning' }
]

export function Logo() {
  return <Link to="/" className="wordmark"><span className="logo-icon"><Leaf size={20} /></span><strong>GREEN</strong><span className="brand-dot">·</span><span>Second Life</span></Link>
}

export function Select({ children, className = '', ...props }) {
  return <span className={'select-wrap ' + className}><select {...props}>{children}</select><ChevronDown size={15} aria-hidden="true" /></span>
}

export function State({ query, empty = 'Nothing to show yet.', children }) {
  if (query.loading) return <div className="state" role="status"><LoaderCircle className="animate-spin" />Loading…</div>
  if (query.error) return <div className="state" role="alert"><CircleAlert /><p>{query.error}</p><Button variant="outline" onClick={query.retry}>Try again</Button></div>
  if (!query.data || (Array.isArray(query.data) && !query.data.length)) return <div className="state"><PackageSearch /><p>{empty}</p>{children}</div>
  return null
}

export function ProductImage({ src, alt, className }) {
  return <img className={className} src={imageUrl(src) || '/favicon.svg'} alt={alt} onError={event => {
    if (!event.currentTarget.src.endsWith('/favicon.svg')) event.currentTarget.src = '/favicon.svg'
  }} />
}

export function ProductCard({ item }) {
  return <Link className="product-card" to={'/marketplace/' + item.id}>
    <div className="product-photo">
      <ProductImage src={item.images[0]} alt={item.name} />
      <span className={'badge ' + (item.status === 'AVAILABLE' ? '' : 'status-' + item.status.toLowerCase())}>{item.status === 'AVAILABLE' ? conditions[item.condition] : label(item.status)}</span>
    </div>
    <div className="product-copy">
      <p className="product-category">{item.category.name}</p>
      <h3>{item.name}</h3>
      <div className="product-bottom"><strong>{money(item.price)}</strong>{item.swap && <span><ArrowLeftRight size={14} /> Swap</span>}</div>
    </div>
  </Link>
}
