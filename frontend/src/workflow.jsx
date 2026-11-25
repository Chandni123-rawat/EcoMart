import { useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Check, ChevronLeft, ImagePlus, Leaf, Pencil, Trash2, UserRound } from 'lucide-react'
import { api, conditions, label, money, useData } from './api'
import { ProductImage, Select, State } from './components/shared'
import { Button } from './components/ui/button'

function Back() {
  return <Link className="back" to="/marketplace"><ChevronLeft size={17} /> Marketplace</Link>
}

export function ListingDetail({ user }) {
  const { id } = useParams()
  const query = useData('/listings/' + encodeURIComponent(id))
  const requests = useData(user ? '/requests' : null, user?.id)
  const [photo, setPhoto] = useState(0)
  const [swapping, setSwapping] = useState(false)
  const [offer, setOffer] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState({})
  const item = query.data
  const previous = requests.data?.find(request => request.listingId === id && request.buyerId === user?.id)

  async function request(kind) {
    setPending(true)
    setMessage({})
    try {
      await api('/requests', { method: 'POST', user: user.id, body: { listingId: id, kind, offer } })
      setMessage({ success: 'Request sent. You can track it in My Activity.' })
      setSwapping(false)
      requests.retry()
    } catch (error) {
      setMessage({ error: error.message })
      query.retry()
    } finally {
      setPending(false)
    }
  }

  return <section className="shell page"><Back /><State query={query} />
    {item && <div className="detail-layout">
      <div className="gallery">
        <ProductImage className="detail-photo" src={item.images[photo]} alt={item.name} />
        {item.images.length > 1 && <div className="thumbnails">{item.images.map((image, index) => <button key={image + index} aria-label={'Show photo ' + (index + 1)} aria-pressed={photo === index} onClick={() => setPhoto(index)}><ProductImage src={image} alt="" /></button>)}</div>}
      </div>
      <div className="detail-copy">
        <div className="detail-meta"><span>{item.category.name}</span><span className={'pill status-' + item.status.toLowerCase()}>{label(item.status)}</span></div>
        <h1>{item.name}</h1>
        <p className="detail-price">{money(item.price)} <small>Originally {money(item.originalPrice)}</small></p>
        <p className="description">{item.description}</p>
        <dl className="detail-specs"><div><dt>Brand</dt><dd>{item.brand}</dd></div><div><dt>Model</dt><dd>{item.model}</dd></div><div><dt>Condition</dt><dd>{conditions[item.condition]}</dd></div><div><dt>Age</dt><dd>{item.age} {item.age === 1 ? 'year' : 'years'}</dd></div></dl>
        <div className="seller"><span className="category-icon"><UserRound size={20} /></span><div><strong>{item.seller.name}</strong><small>{item.seller.program}</small></div></div>
        <p className="swap-note"><ArrowLeftRight size={16} />{item.swap ? 'Open to swaps' : 'Purchase only'}</p>
        {message.error && <p role="alert" className="notice error">{message.error}</p>}
        {message.success && <p role="status" className="notice success">{message.success}</p>}
        {user?.id === item.sellerId ? <Button asChild variant="outline"><Link to="/activity?tab=listings">Manage listing</Link></Button>
          : previous || message.success ? <Button asChild variant="outline"><Link to="/activity">View request{previous ? ' · ' + label(previous.status) : ''}</Link></Button>
            : item.status === 'AVAILABLE' && <div className="actions">
              <Button disabled={!user || pending || requests.loading} onClick={() => request('PURCHASE')}>Request purchase</Button>
              {item.swap && <Button variant="outline" disabled={!user || pending || requests.loading} onClick={() => setSwapping(!swapping)}>{swapping ? 'Cancel swap proposal' : 'Propose a swap'}</Button>}
            </div>}
        {swapping && <form className="swap-form" onSubmit={event => { event.preventDefault(); request('SWAP') }}>
          <label>What would you like to offer?<textarea required maxLength="500" rows="3" value={offer} onChange={event => setOffer(event.target.value)} /></label>
          <Button disabled={pending || !offer.trim()}>Send swap proposal</Button>
        </form>}
      </div>
    </div>}
  </section>
}

function Field({ label: title, name, initial, ...props }) {
  return <label>{title}<input required name={name} defaultValue={initial?.[name]} {...props} /></label>
}

export function ListingForm({ user }) {
  const { id } = useParams()
  const initial = useData(id ? '/listings/' + encodeURIComponent(id) : null)
  const categories = useData('/categories')
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [estimatePath, setEstimatePath] = useState(null)
  const [estimateInputError, setEstimateInputError] = useState('')
  const formRef = useRef(null)
  const priceRef = useRef(null)
  const estimate = useData(estimatePath)

  function requestEstimate() {
    const fields = new FormData(formRef.current)
    const params = new URLSearchParams()
    for (const [input, query] of [['categoryId', 'category'], ['condition', 'condition'], ['age', 'age'], ['originalPrice', 'originalPrice']]) {
      const field = formRef.current.elements.namedItem(input)
      if (!field.checkValidity() || (input === 'originalPrice' && Number(field.value) <= 0)) {
        setEstimatePath(null)
        setEstimateInputError('Enter a category, condition, age and an original price above zero.')
        field.focus()
        return
      }
      params.set(query, fields.get(input))
    }
    setEstimateInputError('')
    const path = '/pricing/estimate?' + params
    if (path === estimatePath) estimate.retry()
    else setEstimatePath(path)
  }
  const item = initial.data
  const ready = categories.data && (!id || item)

  async function submit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (!files.length) data.delete('images')
    setError('')
    if (files.length > 5 || files.some(file => file.size > 5 * 1024 * 1024)) {
      setError('Choose up to five images, each 5 MB or smaller.')
      return
    }
    setPending(true)
    try {
      const saved = await api(id ? '/listings/' + id : '/listings', { method: id ? 'PUT' : 'POST', user: user.id, body: data })
      navigate('/marketplace/' + saved.id)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setPending(false)
    }
  }

  return <section className="shell page form-page">
    <Back /><div className="page-heading"><h1>{id ? 'Edit listing' : 'Sell an item'}</h1><p>Give another student a chance to use your campus essentials.</p></div>
    <State query={categories} />
    {id && <State query={initial} />}
    {ready && id && user?.id !== item.sellerId && <p className="notice">Switch to the seller’s demo profile to edit this listing.</p>}
    {ready && (!id || user?.id === item.sellerId) && <form ref={formRef} onSubmit={submit} className="sell-layout" onChange={event => {
      if (['categoryId', 'condition', 'age', 'originalPrice'].includes(event.target.name)) {
        setEstimatePath(null)
        setEstimateInputError('')
      }
    }}>
      <div className="panel form-panel">
        <h2>Item details</h2>
        <div className="field-grid">
          <Field label="Product name" name="name" initial={item} maxLength="100" placeholder="e.g. Scientific calculator" />
          <label>Category<Select name="categoryId" required defaultValue={item?.categoryId || ''}><option value="" disabled>Select a category</option>{categories.data.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></label>
          <Field label="Brand" name="brand" initial={item} maxLength="80" placeholder="e.g. Casio" />
          <Field label="Model" name="model" initial={item} maxLength="80" placeholder="e.g. fx-991ES Plus" />
          <Field label="Original purchase price (₹)" name="originalPrice" initial={item} type="number" min="0" step=".01" />
          <Field label="Age in years" name="age" initial={item} type="number" min="0" max="100" step="1" />
          <label>Condition<Select name="condition" required defaultValue={item?.condition || ''}><option value="" disabled>Select condition</option>{Object.entries(conditions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</Select></label>
          <label>Open to exchange?<Select name="swap" defaultValue={String(item?.swap ?? false)}><option value="false">No</option><option value="true">Yes</option></Select></label>
        </div>
        <label>Description<textarea name="description" required rows="4" maxLength="2000" defaultValue={item?.description} placeholder="Describe its condition and what’s included." /></label>
        <div className="upload-box"><ImagePlus size={23} /><label>Product images<input type="file" name="images" multiple required={!item} accept="image/jpeg,image/png,image/webp" onChange={event => setFiles(Array.from(event.target.files))} /></label><small>{files.length ? files.map(file => file.name).join(', ') : item ? 'Leave empty to keep your current photos.' : 'Add up to 5 JPG, PNG or WebP images. Max 5 MB each.'}</small></div>
      </div>
      <aside className="panel form-panel pricing">
        <h2>Pricing</h2>
        <Field label="Selling price (₹)" name="price" initial={item} type="number" min="0" step=".01" ref={priceRef} />
        <div className="pricing-note"><Leaf size={18} /><div><strong>Fair price recommendation</strong><p>Estimate a price from similar historical sales.</p></div></div>
        <Button type="button" variant="outline" disabled={estimate.loading} onClick={requestEstimate}>{estimate.loading ? 'Estimating…' : 'Estimate fair price'}</Button>
        {(estimateInputError || estimate.error) && <p className="notice error" role="alert">{estimateInputError || estimate.error}</p>}
        {estimate.data && (estimate.data.available
          ? <div className="notice" role="status">
            <strong>Suggested price {money(estimate.data.suggested)}</strong>
            <p>Typical range {money(estimate.data.low)}–{money(estimate.data.high)}, based on {estimate.data.sampleSize} comparable sales.</p>
            <div className="actions"><Button type="button" variant="outline" onClick={() => {
              priceRef.current.value = estimate.data.suggested
              priceRef.current.focus()
            }}>Use suggested price</Button></div>
          </div>
          : <p className="notice" role="status">There aren’t enough comparable sales. Enter your own selling price.</p>)}
        {error && <p className="notice error" role="alert">{error}</p>}
        {!user && <p className="notice">Choose a demo student to publish.</p>}
        <Button disabled={pending || !user}>{pending ? 'Saving…' : id ? 'Save changes' : 'Publish listing'}</Button>
      </aside>
    </form>}
  </section>
}

function RequestCard({ request, user, refresh }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [contact, setContact] = useState(null)
  const seller = request.listing.sellerId === user.id
  const transaction = request.transaction
  const confirmed = seller ? transaction?.sellerConfirmedAt : transaction?.buyerConfirmedAt
  const other = seller ? request.buyer : request.listing.seller

  async function action(kind) {
    setBusy(true)
    setError('')
    const path = '/requests/' + request.id
    try {
      if (kind === 'contact') setContact(await api(path + '/contact', { user: user.id }))
      else {
        await api(path + (kind === 'confirm' ? '/confirm' : '/decision'), kind === 'confirm'
          ? { user: user.id, method: 'POST' }
          : { user: user.id, method: 'PATCH', body: { decision: kind } })
        refresh()
      }
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <article className="panel activity-card">
    <div className="activity-top"><div><small>{seller ? 'Incoming' : 'Sent'} {request.kind === 'SWAP' ? 'swap' : 'purchase'} request</small><h3><Link to={'/marketplace/' + request.listing.id}>{request.listing.name}</Link></h3><p>{seller ? 'From' : 'To'} {other.name}</p></div><span className={'pill status-' + request.status.toLowerCase()}>{label(request.status)}</span></div>
    {request.offer && <p className="notice">Swap offer · {request.offer}</p>}
    {seller && request.status === 'PENDING' && <div className="actions"><Button disabled={busy} onClick={() => action('accept')}>Accept</Button><Button variant="outline" disabled={busy} onClick={() => action('reject')}>Reject</Button></div>}
    {request.status === 'ACCEPTED' && <>
      <p className="notice">{request.kind === 'PURCHASE' ? `Arrange your offline payment of ${money(transaction.agreedPrice)} and campus handover together.` : 'Arrange your campus exchange together.'} Confirm once the handover is complete.</p>
      <div className="actions">{contact ? <span className="contact">{contact.email}</span> : <Button variant="outline" disabled={busy} onClick={() => action('contact')}>Show demo contact</Button>}
        {confirmed ? <span className="confirmed"><Check size={17} /> Waiting for {other.name} to confirm</span> : <Button disabled={busy} onClick={() => action('confirm')}>Confirm handover</Button>}</div>
    </>}
    {request.status === 'COMPLETED' && <p className="confirmed"><Check size={17} /> Both students confirmed the handover.</p>}
    {error && <p role="alert" className="notice error">{error}</p>}
  </article>
}

export function MyActivity({ user }) {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'listings' ? 'listings' : 'requests'
  const setTab = value => setParams(value === 'listings' ? { tab: value } : {})
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requests = useData(user ? '/requests' : null, user?.id)
  const listings = useData(user ? '/listings?seller=me' : null, user?.id)

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await api('/listings/' + target.id, { method: 'DELETE', user: user.id })
      setTarget(null)
      listings.retry()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="shell page activity-page">
    <div className="page-heading"><h1>My Activity</h1><p>Track your requests and manage your listings.</p></div>
    {!user ? <div className="state">Choose a demo student to see their activity.</div> : <>
      <div className="tabs" aria-label="Activity sections"><Button variant={tab === 'requests' ? 'default' : 'ghost'} aria-pressed={tab === 'requests'} onClick={() => setTab('requests')}>Requests</Button><Button variant={tab === 'listings' ? 'default' : 'ghost'} aria-pressed={tab === 'listings'} onClick={() => setTab('listings')}>My listings</Button></div>
      {tab === 'requests' ? <>
        <State query={requests} empty="You have no purchase or swap requests yet."><Button asChild variant="outline"><Link to="/marketplace">Browse marketplace</Link></Button></State>
        <div className="activity-list">{requests.data?.map(item => <RequestCard key={item.id} request={item} user={user} refresh={() => { requests.retry(); listings.retry() }} />)}</div>
      </> : <>
        <State query={listings} empty="You haven’t listed anything yet."><Button asChild><Link to="/sell">Sell an item</Link></Button></State>
        <div className="activity-list">{listings.data?.map(item => {
          const pending = requests.data?.some(request => request.listingId === item.id && request.status === 'PENDING')
          return <article className="panel activity-card" key={item.id}><div className="activity-top"><div><h3><Link to={'/marketplace/' + item.id}>{item.name}</Link></h3><p>{money(item.price)}</p></div><span className={'pill status-' + item.status.toLowerCase()}>{label(item.status)}</span></div>
            {item.status === 'AVAILABLE' && (pending ? <p className="notice">Resolve pending requests before editing or deleting.</p> : <div className="actions"><Button variant="outline" asChild><Link to={'/sell/' + item.id}><Pencil size={16} /> Edit</Link></Button><Button variant="danger" onClick={() => { setTarget(item); setError('') }}><Trash2 size={16} /> Delete</Button></div>)}
            {target?.id === item.id && <div className="notice"><p>Delete this listing?</p>{error && <p role="alert" className="notice error">{error}</p>}<div className="actions"><Button variant="outline" disabled={busy} onClick={() => setTarget(null)}>Keep listing</Button><Button variant="danger" disabled={busy} onClick={remove}>Confirm deletion</Button></div></div>}
          </article>
        })}</div>
      </>}
    </>}
  </section>
}
