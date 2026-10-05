import { useEffect, useState } from "react";
import { BadgeCheck, BookOpen, Bookmark, BookmarkCheck, CheckCircle2, Clock3, ExternalLink, FileText, LayoutTemplate, LoaderCircle, Play, PlayCircle, Search, Youtube } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function responseBody(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || "Unable to load resources.");
  return data;
}

const typeDetails = {
  article: [BookOpen, "Article"],
  video: [PlayCircle, "Video"],
  course: [BookOpen, "Course"],
  pdf: [FileText, "PDF"],
  template: [LayoutTemplate, "Template"],
};

export function StudentResources() {
  const current = JSON.parse(localStorage.getItem("careerforge_session") || "null");
  const [resources, setResources] = useState([]);
  const [updatingId, setUpdatingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skill, setSkill] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const playlistStatusKey = `careerforge_playlist_progress_${current?.id || "guest"}`;
  const [playlistStatus, setPlaylistStatus] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(playlistStatusKey) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  });
  const hasYouTubeFallback = Boolean(searchResults?.videos?.some((item) => item.fallback));
  const savedResources = resources.filter((resource) => resource.saved);
  const savedPlaylists = Object.values(playlistStatus)
    .filter((entry) => entry?.saved && entry.playlist)
    .map((entry) => ({ playlist: entry.playlist, status: entry }));

  useEffect(() => {
    if (!current?.id) { setError("Please sign in again."); setLoading(false); return; }
    const headers = { "X-User-Id": current.id };
    fetch(`${API_BASE_URL}/resources`, { headers }).then(responseBody)
      .then(setResources).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  async function toggle(resource, field) {
    const key = `${field}-${resource.id}`;
    setUpdatingId(key);
    try {
      const progress = await fetch(`${API_BASE_URL}/resources/${resource.id}/${field}`, {
        method: "PUT", headers: { "X-User-Id": current.id },
      }).then(responseBody);
      const applyProgress = (item) => item.id === resource.id ? { ...item, ...progress } : item;
      setResources((items) => items.map(applyProgress));
      setSearchResults((results) => results ? { ...results, suggestions: results.suggestions?.map(applyProgress) || [] } : results);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId("");
    }
  }

  async function findSkill(event, value = skill) {
    event?.preventDefault();
    const term = value.trim();
    if (!current?.id) return;
    if (!term) { setError("Type a skill first, such as React, SQL, or Figma."); setSearchResults(null); return; }
    setSkill(term); setSearching(true); setSearchResults(null); setError("");
    try { setSearchResults(await fetch(`${API_BASE_URL}/resources/search?skill=${encodeURIComponent(term)}`, { headers: { "X-User-Id": current.id } }).then(responseBody)); }
    catch (requestError) { setError(requestError.message); } finally { setSearching(false); }
  }

  function updatePlaylistStatus(playlist, action) {
    setPlaylistStatus((items) => {
      const previous = items[playlist.id] || {};
      const nextStatus = {
        ...previous,
        playlist,
        saved: Boolean(previous.saved),
        completed: Boolean(previous.completed),
      };
      if (action === "saved") nextStatus.saved = !nextStatus.saved;
      if (action === "completed") nextStatus.completed = !nextStatus.completed;
      const next = { ...items, [playlist.id]: nextStatus };
      if (!nextStatus.saved && !nextStatus.completed) delete next[playlist.id];
      try { localStorage.setItem(playlistStatusKey, JSON.stringify(next)); } catch { }
      return next;
    });
  }

  return <section className="student-resources">
    <header className="resources-hero">
      <div>
        <p className="eyebrow"><BookOpen size={14} /> LEARNING LIBRARY</p>
        <h2>Build skills for your next move.</h2>
        <p>Explore administrator-curated career guides, practical learning materials, and templates in one focused library.</p>
      </div>
      <div className="resource-total"><BookOpen size={19} /><b>{loading ? "…" : resources.length}</b><span>published resources</span></div>
    </header>

    <section className="skill-resource-finder">
      <div className="finder-header"><div><p className="eyebrow"><Youtube size={15} /> PLAYLIST DISCOVERY</p><h3>Find the right playlist for a skill.</h3><p>Search a skill for the five best matching YouTube playlists. A matching resource selected by your CareerForge administrator always appears first.</p></div><span className="finder-label"><Search size={15} /> Search playlists</span></div>
      <form onSubmit={findSkill}><label><Search size={20} /><input value={skill} onChange={(event) => setSkill(event.target.value)} placeholder="e.g. React, SQL, Figma, Python, public speaking" /></label><button disabled={searching} type="submit">Search playlists</button></form>
      {searching ? <div className="skill-searching" role="status"><LoaderCircle size={37} /><b>Finding the best YouTube playlists for {skill}...</b><span>Checking CareerForge recommendations first, then ranking the strongest matching playlists.</span></div> : !searchResults ? <div className="skill-empty"><Youtube size={27} /><b>Search the skill you want to learn</b><span>CareerForge will show matching administrator suggestions before the best YouTube playlists.</span></div> : <div className="skill-results">
        {(searchResults.suggestions?.length > 0 || searchResults.videos?.length > 0) && <><div className="skill-result-heading"><span className="skill-result-icon"><BadgeCheck size={17} /></span><div><b>{searchResults.suggestions?.length > 0 ? "CareerForge pick and top playlists" : hasYouTubeFallback ? "Open current YouTube playlists" : "Best matching YouTube playlists"}</b><span>{searchResults.suggestions?.length > 0 ? "Your administrator's matching pick is first; the strongest ranked playlists follow." : hasYouTubeFallback ? "YouTube's live ranking is temporarily unavailable; this opens its current playlist-only results." : `${searchResults.videos.length} highest-ranked playlist${searchResults.videos.length === 1 ? "" : "s"} for ${skill}`}</span></div><span className="skill-result-topic">For {skill}</span></div><div className="resource-grid skill-result-grid">{searchResults.suggestions?.map((item) => <ResourceCard key={item.id} resource={item} onToggle={toggle} updatingId={updatingId} />)}{searchResults.videos?.map((item) => <PlaylistCard key={item.id} playlist={item} status={playlistStatus[item.id]} onToggle={updatePlaylistStatus} />)}</div></>}
        {!searchResults.suggestions?.length && !searchResults.videos?.length && <div className="skill-empty"><Search size={27} /><b>{searchResults.youtubeMessage ? "YouTube results are unavailable" : "No matching result found"}</b><span>{searchResults.youtubeMessage || "Try a broader skill name."}</span></div>}
        {searchResults.youtubeMessage && searchResults.videos?.length > 0 && <p className="skill-youtube-message">{searchResults.youtubeMessage}</p>}
      </div>}
    </section>

    <section className="saved-resource-library">
      <div className="resource-section-heading"><div><p className="eyebrow"><BookmarkCheck size={14} /> YOUR COLLECTION</p><h3>Saved for later</h3><p className="resource-section-description">Your personal shortlist of resources and playlists to return to.</p></div><span>{savedResources.length + savedPlaylists.length} saved</span></div>
      {savedResources.length + savedPlaylists.length > 0 ? <div className="resource-grid saved-resource-grid">{savedResources.map((resource) => <ResourceCard key={`resource-${resource.id}`} resource={resource} onToggle={toggle} updatingId={updatingId} />)}{savedPlaylists.map(({ playlist, status }) => <PlaylistCard key={`playlist-${playlist.id}`} playlist={playlist} status={status} onToggle={updatePlaylistStatus} />)}</div> : <div className="saved-resource-empty"><Bookmark size={23} /><div><b>Save something to keep it here.</b><span>Resources and playlists you save will stay in this section for later.</span></div></div>}
    </section>

    <section className="resource-library">
      <div className="resource-section-heading"><div><p className="eyebrow"><BookOpen size={14} /> RESOURCE CATALOG</p><h3>Published library</h3><p className="resource-section-description">Browse every guide, course, template, and video shared by CareerForge.</p></div><span>{loading ? "Loading" : `${resources.length} available`}</span></div>
      {loading ? <div className="resource-loading"><i /><i /><i /></div> : resources.length ? <div className="resource-grid">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onToggle={toggle} updatingId={updatingId} />)}</div> : <div className="saved-resource-empty"><BookOpen size={23} /><div><b>No published resources yet.</b><span>Your administrator's learning resources will appear here.</span></div></div>}
    </section>

    {error && <p className="form-error">{error}</p>}
  </section>;
}

function ResourceCard({ resource, compact = false, onToggle, updatingId }) {
  const [Icon, typeLabel] = typeDetails[String(resource.type || "article").toLowerCase()] || typeDetails.article;
  const isYouTube = /youtube|youtu\.be/i.test(`${resource.providerName || ""} ${resource.resourceUrl || ""}`);
  const provider = resource.providerName || (isYouTube ? "YouTube" : "CareerForge library");
  return <article className={`resource-card${compact ? " compact" : ""}${resource.featured ? " featured" : ""}`}>
    <div className="resource-thumbnail">{resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className={`resource-thumbnail-fallback${isYouTube ? " youtube" : ""}`}><Icon size={compact ? 28 : 36} /><Play size={compact ? 16 : 20} /></div>}<span className="resource-type">{typeLabel}</span>{resource.featured ? <span className="resource-platform-badge"><BadgeCheck size={13} /> CareerForge recommends</span> : isYouTube && <span className="resource-youtube-badge"><Youtube size={13} /> YouTube</span>}</div>
    <div className="resource-card-top"><span className="resource-type-icon"><Icon size={compact ? 17 : 19} /></span><span className="resource-provider">{provider}</span></div>
    <p className="resource-category">{resource.category || "Learning"}</p>
    <h4>{resource.title}</h4>
    <p className="resource-description">{resource.description || "A curated CareerForge resource to support your next step."}</p>
    {resource.featured && <p className="resource-recommendation-note"><BadgeCheck size={14} /> {resource.recommendationNote || "Suggested by your CareerForge administrator."}</p>}
    <footer><span>{resource.estimatedMinutes ? <><Clock3 size={14} /> {resource.estimatedMinutes} min</> : "Self-paced"}</span><a className={isYouTube ? "playlist-open-link" : ""} href={resource.resourceUrl} target="_blank" rel="noreferrer">{isYouTube ? "Watch on YouTube" : "Open resource"} <ExternalLink size={14} /></a></footer>
    <div className="resource-card-actions">
      <button type="button" className={resource.saved ? "active" : ""} aria-pressed={Boolean(resource.saved)} disabled={updatingId === `saved-${resource.id}`} onClick={() => onToggle(resource, "saved")}>{resource.saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {resource.saved ? "Saved" : "Save"}</button>
      <button type="button" className={resource.completed ? "active complete" : ""} aria-pressed={Boolean(resource.completed)} disabled={updatingId === `completed-${resource.id}`} onClick={() => onToggle(resource, "completed")}><CheckCircle2 size={15} /> {resource.completed ? "Completed" : "Mark complete"}</button>
    </div>
  </article>;
}

function PlaylistCard({ playlist, status = {}, onToggle }) {
  const saved = Boolean(status.saved);
  const completed = Boolean(status.completed);
  const totalVideos = Math.max(0, Number(playlist.videoCount ?? 0));
  return <article className={`resource-card video-result${completed ? " playlist-complete" : ""}`}>
    <div className="resource-thumbnail">{playlist.thumbnailUrl ? <img src={playlist.thumbnailUrl} alt="" /> : <div className="resource-thumbnail-fallback youtube"><Youtube size={32} /></div>}<span className="resource-youtube-badge"><Youtube size={13} /> {playlist.fallback ? "Live YouTube search" : "YouTube playlist"}</span></div>
    <div className="resource-card-top"><span className="resource-provider">{playlist.providerName}</span></div>
    <h4>{playlist.title}</h4>
    <p className="resource-description">{playlist.description || "A ranked YouTube playlist for this skill."}</p>
    <footer><span>{playlist.fallback ? "Playlist search" : totalVideos ? `${totalVideos} videos` : "Playlist"}</span><a className="playlist-open-link" href={playlist.resourceUrl} target="_blank" rel="noreferrer">{playlist.fallback ? "View playlists" : "Open playlist"} <ExternalLink size={14} /></a></footer>
    <div className="resource-card-actions playlist-actions">
      <button type="button" className={saved ? "active" : ""} aria-pressed={saved} onClick={() => onToggle(playlist, "saved")}>{saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />} {saved ? "Saved" : "Save"}</button>
      <button type="button" className={completed ? "active complete" : ""} aria-pressed={completed} onClick={() => onToggle(playlist, "completed")}><CheckCircle2 size={15} /> {completed ? "Completed" : "Mark complete"}</button>
    </div>
  </article>;
}
