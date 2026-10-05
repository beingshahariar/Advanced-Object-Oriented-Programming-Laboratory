import { useEffect, useState } from "react";
import { Plus, RefreshCw, Users } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const currentSession = () => {
  try { return JSON.parse(localStorage.getItem("careerforge_session")) || null; } catch { return null; }
};

const headers = () => ({ "Content-Type": "application/json", "X-User-Id": currentSession()?.id || "" });

async function body(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || "Unable to complete that request.");
  return data;
}

const ActionButton = ({ children, className = "", ...props }) => <button className={`button ${className}`} {...props}>{children}</button>;
const Status = ({ value }) => <span className={`status ${value || ""}`}>{String(value || "unknown").replaceAll("_", " ")}</span>;
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

export function AdminCommunity() {
  const [overview, setOverview] = useState(null);
  const [posts, setPosts] = useState([]);
  const [announcement, setAnnouncement] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [topicTags, setTopicTags] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showFeedback = false) {
    setRefreshing(true);
    try {
      const [summary, postItems] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/community/overview`, { headers: headers() }).then(body),
        fetch(`${API_BASE_URL}/admin/community/posts`, { headers: headers() }).then(body),
      ]);
      setOverview(summary);
      setPosts(postItems);
      if (showFeedback) setNotice("Community moderation data refreshed.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function setPostStatus(post, status) {
    const action = status === "removed" ? "hide" : "approve";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} this community post?`)) return;
    setWorking(`post-${post.id}-${status}`);
    try {
      await body(await fetch(`${API_BASE_URL}/admin/community/posts/${post.id}/status?status=${status}`, { method: "PUT", headers: headers() }));
      await load();
      setNotice(status === "removed" ? "Post hidden from the student community." : "Post approved for the student community.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setWorking("");
    }
  }

  async function rescan(post) {
    setWorking(`post-${post.id}-rescan`);
    try {
      const updated = await body(await fetch(`${API_BASE_URL}/admin/community/posts/${post.id}/rescan`, { method: "PUT", headers: headers() }));
      await load();
      setNotice(`Post rescanned. It is now ${updated.status.replaceAll("_", " ")}.`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setWorking("");
    }
  }

  async function publish(event) {
    event.preventDefault();
    if (!announcement.trim()) return;
    setPublishing(true);
    try {
      const created = await body(await fetch(`${API_BASE_URL}/admin/community/posts`, {
        method: "POST", headers: headers(), body: JSON.stringify({ content: announcement, mediaUrl: mediaUrl.trim(), topicTags: topicTags.trim() }),
      }));
      setPosts((items) => [created, ...items]);
      setAnnouncement("");
      setMediaUrl("");
      setTopicTags("");
      setNotice("Your administrator announcement is now visible in the community.");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPublishing(false);
    }
  }

  const cards = [["Visible posts", overview?.visiblePosts], ["Pending review", overview?.pendingPosts], ["Removed posts", overview?.removedPosts], ["Open reports", overview?.openReports]];
  const pendingPosts = posts.filter((post) => post.status === "pending_review" || post.reportCount > 0);
  const otherPosts = posts.filter((post) => !pendingPosts.some((pending) => pending.id === post.id));
  const canPublish = Boolean(announcement.trim());

  function postRows(items) {
    if (!items.length) return <p className="muted">Nothing is waiting in this section.</p>;
    return <div className="admin-table community-admin-table">{items.map((post) => {
      const postWorking = working.startsWith(`post-${post.id}-`);
      return <article key={post.id} className={`moderation-row ${post.status}`}>
        <div><b>{post.authorName}</b><small>{formatDate(post.createdAt)} · {post.likeCount} likes · {post.commentCount} comments · {post.reportCount} open reports</small></div>
        <p>{post.content}</p>
        <div><Status value={post.status} /><small className="risk-detail">{post.riskLabel} · risk {post.riskScore}/100<br />{post.riskReasons || "No risk signals"}</small></div>
        <div className="table-actions">
          <button className="approve-action" disabled={postWorking} onClick={() => setPostStatus(post, "visible")}>{working === `post-${post.id}-visible` ? "Approving..." : "Approve"}</button>
          <button className="danger-action" disabled={postWorking} onClick={() => setPostStatus(post, "removed")}>{working === `post-${post.id}-removed` ? "Removing..." : "Remove"}</button>
          <button className="rescan-action" disabled={postWorking} onClick={() => rescan(post)}>{working === `post-${post.id}-rescan` ? "Rescanning..." : "Rescan"}</button>
        </div>
      </article>;
    })}</div>;
  }

  const completedNotice = /(approved|hidden|rescanned|visible|removed|refreshed)/i.test(notice);
  return <section className="admin-page admin-community-page">
    <div className="content-intro compact">
      <div><p className="eyebrow"><Users size={14} /> Community administration</p><h2>Moderate posts and share official updates.</h2><p>Pending cases are kept separate. You can publish announcements, advice, opportunities, and other community updates without student point limits.</p></div>
      <ActionButton className="quiet community-refresh-button" type="button" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "action-spinner" : ""} size={15} /> {refreshing ? "Refreshing..." : "Refresh"}</ActionButton>
    </div>
    {notice && <p className={completedNotice ? "form-success" : "form-error"}>{notice}</p>}
    <section className="metric-grid admin-metrics community-metrics">{cards.map(([label, value]) => <article key={label}><p>{label}</p><strong>{overview ? value : "..."}</strong></article>)}</section>
    <form className="data-form admin-announcement" onSubmit={publish}>
      <div className="form-row-title"><div><p className="eyebrow">Administrator post</p><h3>Share an official update</h3></div><span className="status visible">No point limit</span></div>
      <textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} maxLength="5000" placeholder="Write an announcement, advice, opportunity, or community update..." required />
      <div className="community-post-options admin-announcement-options"><label>Link <span>(optional)</span><input type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} maxLength="500" placeholder="https://example.com" /></label><label>Topics <span>(optional)</span><input value={topicTags} onChange={(event) => setTopicTags(event.target.value)} maxLength="500" placeholder="e.g. Java, internships" /></label></div>
      <div className="announcement-publish-controls"><p aria-live="polite">{publishing ? "Publishing your update to the community..." : canPublish ? "Ready to publish this official update." : "Write an update to enable publishing."}</p><ActionButton className="publish-community-button" type="submit" disabled={publishing || !canPublish}>{publishing ? <RefreshCw className="action-spinner" size={15} /> : <Plus size={15} />}{publishing ? "Publishing..." : "Publish to community"}</ActionButton></div>
    </form>
    <section className="content-card moderation-section pending-section"><div className="list-heading"><div><h3>Pending cases</h3><small>Posts awaiting review or with open reports.</small></div><span>{pendingPosts.length} pending</span></div>{postRows(pendingPosts)}</section>
    <section className="content-card moderation-section"><div className="list-heading"><div><h3>Published and removed posts</h3><small>Review all other community activity separately from the pending queue.</small></div><span>{otherPosts.length} posts</span></div>{postRows(otherPosts)}</section>
  </section>;
}
