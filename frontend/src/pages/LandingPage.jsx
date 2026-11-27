import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ListingCard from '../components/listings/ListingCard';
import { LISTING_KINDS, getAreas, searchListings } from '../services/listingService';
import heroHouse from '../assets/images/hero-house.jpg';
import heroBedroom from '../assets/images/hero-bedroom.jpg';
import heroLounge from '../assets/images/hero-lounge.jpg';

// Screen 01 - marketplace-style home (dense search, category tiles, live rails of listings),
// built on the refined Kasi24 design: same palette, copy and journey (Search, Discover, Compare, Connect).
const KIND_BLURBS = {
  backyard_room: 'Private rooms in a yard',
  shack: 'Affordable standalone homes',
  room_in_house: 'Share a home with a host',
  other: 'Other places to stay',
};

const KIND_ICONS = {
  backyard_room: <path d="M3 11.5 12 4l9 7.5V20h-6v-5H9v5H3v-8.5Z" />,
  shack: <path d="M4 20V10l8-5 8 5v10H4Zm5-6h6" />,
  room_in_house: <path d="M4 20V8h16v12M4 12h16M9 8V4h6v4" />,
  other: <path d="M12 5v14M5 12h14" />,
};

const RENT_CHIPS = [1500, 2500, 3500];
const STEPS = [
  { title: 'Search', text: 'Pick an area and the kind of place you need.' },
  { title: 'Discover', text: 'Browse real listings with photos, rent and what is included.' },
  { title: 'Compare', text: 'Shortlist your favourites and compare them side by side.' },
  { title: 'Connect', text: 'Send an enquiry and speak to the provider directly.' },
];
const SAFETY = [
  'See the place before you pay anything.',
  'Kasi24 never takes bookings or payments. Agree terms with the provider directly.',
  'Exact addresses are shared by the provider, not shown publicly.',
  'Report anything that looks wrong to us.',
];

function Rail({ title, to, listings, id }) {
  const track = useRef(null);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  return (
    <section className="section wrap" aria-labelledby={id}>
      <div className="section__head">
        <h2 id={id}>{title}</h2>
        <div className="rail__controls">
          <button type="button" className="rail__btn" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}>&lsaquo;</button>
          <button type="button" className="rail__btn" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}>&rsaquo;</button>
          <Link to={to} className="section__link">See all &rarr;</Link>
        </div>
      </div>
      <div className="rail" ref={track}>
        {listings.map((l) => <div key={l.id} className="rail__item"><ListingCard listing={l} /></div>)}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [areas, setAreas] = useState([]);
  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [data, setData] = useState({ status: 'loading', rows: [] });

  useEffect(() => {
    let cancelled = false;
    getAreas().then((a) => !cancelled && setAreas(a)).catch(() => {});
    searchListings({ limit: 100 })
      .then((rows) => !cancelled && setData({ status: 'ready', rows }))
      .catch(() => !cancelled && setData({ status: 'error', rows: [] }));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const counts = useMemo(() => {
    const c = {};
    data.rows.forEach((l) => { c[l.kind] = (c[l.kind] ?? 0) + 1; });
    return c;
  }, [data.rows]);

  const latest = data.rows.slice(0, 12);
  // Rails for the named neighbourhoods that actually have stays (live data, not hard-coded).
  const areaRails = useMemo(() => areas
    .filter((a) => a.parent_area_id)
    .map((a) => ({ area: a, rows: data.rows.filter((l) => l.area?.id === a.id).slice(0, 12) }))
    .filter((r) => r.rows.length > 0), [areas, data.rows]);

  function go({ q: query = q, area: areaName = area, rent = maxRent, kind } = {}) {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (areaName) params.set('area', areaName);
    if (kind) params.set('kind', kind);
    if (rent) params.set('maxRent', String(rent));
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : '/search');
  }

  return (
    <div className="landing">
      <nav className="catbar" aria-label="Stay types">
        <div className="wrap catbar__inner">
          <Link to="/search">All stays</Link>
          {LISTING_KINDS.map((k) => <Link key={k.value} to={`/search?kind=${k.value}`}>{k.label}</Link>)}
          <Link to="/services" className="catbar__soon">Services <span className="soon-tag">COMING SOON</span></Link>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <span className="eyebrow">Accommodation &middot; Khayelitsha</span>
            <h1>Find a place to stay, <em>close to home.</em></h1>
            <p className="hero__lead">
              Search local accommodation, compare your favourites and contact providers directly. Real places, real people.
            </p>
            <form className="search-panel" role="search" onSubmit={(e) => { e.preventDefault(); go(); }} aria-label="Search stays">
              <label className="search-panel__q">What are you looking for?
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Backyard room, shack, own entrance..." />
              </label>
              <label>Location
                <select value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="">All areas</option>
                  {areas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </label>
              <label>Max rent (R / month)
                <input type="number" min="0" step="50" inputMode="numeric" placeholder="Any" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} />
              </label>
              <button type="submit" className="btn btn--primary">Search stays</button>
            </form>
            <div className="chips-row" aria-label="Quick searches">
              {RENT_CHIPS.map((r) => (
                <button key={r} type="button" className="chip" onClick={() => go({ rent: r })}>Under R{r.toLocaleString('en-ZA')}</button>
              ))}
              {areas.filter((a) => a.parent_area_id).map((a) => (
                <button key={a.id} type="button" className="chip" onClick={() => go({ area: a.name })}>{a.name}</button>
              ))}
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <img className="hero__photo hero__photo--main" src={heroHouse} alt="" />
            <img className="hero__photo hero__photo--one" src={heroBedroom} alt="" />
            <img className="hero__photo hero__photo--two" src={heroLounge} alt="" />
            <div className="hero__note"><strong>Community first</strong><span>Local hosts, local stays</span></div>
            <div className="hero__caption"><strong>Backyard rooms</strong><span>From private rooms to shared homes</span></div>
          </div>
        </div>
      </section>

      <section className="section wrap" aria-labelledby="browse-title">
        <div className="section__head">
          <h2 id="browse-title">Browse by type</h2>
          <Link to="/search" className="section__link">See all stays &rarr;</Link>
        </div>
        <div className="category-grid">
          {LISTING_KINDS.map((k) => (
            <Link key={k.value} to={`/search?kind=${k.value}`} className="category-card">
              <span className="category-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">{KIND_ICONS[k.value]}</svg>
              </span>
              <strong>{k.label}</strong>
              <span>{KIND_BLURBS[k.value]}</span>
              {data.status === 'ready' && <span className="category-card__count">{counts[k.value] ?? 0} {(counts[k.value] ?? 0) === 1 ? 'stay' : 'stays'}</span>}
            </Link>
          ))}
        </div>
      </section>

      {data.status === 'loading' && <p role="status" className="wrap muted section">Loading stays...</p>}
      {data.status === 'error' && (
        <p className="wrap muted section">We could not load stays right now. <Link to="/search">Try the search page</Link>.</p>
      )}
      {data.status === 'ready' && latest.length === 0 && (
        <p className="wrap muted section">New stays are being reviewed and will appear here soon.</p>
      )}
      {latest.length > 0 && <Rail id="latest-title" title="Latest stays" to="/search" listings={latest} />}
      {areaRails.map(({ area: a, rows }) => (
        <Rail key={a.id} id={`area-${a.id}`} title={`Stays in ${a.name}`} to={`/search?area=${encodeURIComponent(a.name)}`} listings={rows} />
      ))}

      <section className="wrap">
        <div className="safety">
          <div>
            <h2>Stay safe when you search</h2>
            <p>Enquiries only: Kasi24 connects you with providers, you stay in control.</p>
          </div>
          <ul>{SAFETY.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </section>

      <section className="section wrap" id="how-it-works" aria-labelledby="how-title">
        <div className="section__head"><h2 id="how-title">How Kasi24 works</h2></div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="steps__num">{i + 1}</span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section wrap about" id="about" aria-labelledby="about-title">
        <div className="section__head"><h2 id="about-title">About Kasi24</h2></div>
        <div className="about__grid">
          <div className="about__story">
            <span className="eyebrow">Built by G-Labs</span>
            <h3>A local way to find a place to stay</h3>
            <p>
              Finding a room or a place to rent in the township often means word of mouth, notice boards and a lot of walking.
              Kasi24 brings local accommodation into one place, starting with Khayelitsha Site B and Site C, so you can search,
              compare and contact the person offering it.
            </p>
            <p>Kasi24 is built by G-Labs for the community it serves. We are starting with accommodation, and local services are coming next.</p>
          </div>
          <ul className="about__points">
            <li><strong>We connect, we don&apos;t book</strong><span>Kasi24 takes no bookings or payments. You send an enquiry and agree everything directly with the provider.</span></li>
            <li><strong>Checked before it goes live</strong><span>Providers are verified and every listing is reviewed by our team before customers can see it.</span></li>
            <li><strong>Private by default</strong><span>Exact addresses are not shown publicly. You only see the area until you are in touch.</span></li>
          </ul>
        </div>
        <div className="about__audience">
          <div className="about__card">
            <h3>If you are looking for a place</h3>
            <p>Search by area, type and rent, shortlist your favourites and send an enquiry. It is free.</p>
            <Link to="/search" className="btn btn--primary btn--sm">Browse stays</Link>
          </div>
          <div className="about__card">
            <h3>If you have a place to let</h3>
            <p>Create a provider profile, add your listing and reach people looking in your community.</p>
            <Link to="/provider" className="btn btn--dark btn--sm">List your stay</Link>
          </div>
        </div>
        <p className="about__contact">
          Questions or feedback? Email us at <a href="mailto:dakalo.madavha@icloud.com">dakalo.madavha@icloud.com</a>.
        </p>
      </section>

      <section className="wrap">
        <div className="cta">

          <div>
            <h2>Have a room to let?</h2>
            <p>List your accommodation for free and reach people looking in your community.</p>
          </div>
          <Link to="/provider" className="btn btn--dark">List your stay</Link>
        </div>
        <div className="service-band">
          <div>
            <span className="soon-tag">COMING SOON</span>
            <h2>Local services, next.</h2>
            <p>Plumbers, movers, cleaners and more from trusted people in your area. We are starting with accommodation.</p>
          </div>
          <Link to="/services" className="btn btn--gold">Learn more</Link>
        </div>
      </section>
    </div>
  );
}
