import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import { getApiUrl } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Image as ImageIcon,
  Video,
  X,
  Trash2,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import Head from "next/head";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PostComment {
  _id: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: string;
  user: string;
}

interface Post {
  _id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  likes: string[];
  likeUids: string[];
  comments: PostComment[];
  shareCount: number;
  createdAt: string;
}

interface Friend {
  friendshipId: string;
  uid: string;
  name: string;
  photo: string;
  since: string;
}

interface FriendRequest {
  friendshipId: string;
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  createdAt: string;
}

interface SearchUser {
  uid: string;
  name: string;
  email: string;
  photo: string;
  friendshipStatus: string | null;
  friendshipId: string | null;
}

interface PostingInfo {
  friendCount: number;
  postingLimit: number | "unlimited";
  todayCount: number;
  canPost: boolean;
}

// ─── API Base ────────────────────────────────────────────────────────────────
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Main Page Component ─────────────────────────────────────────────────────
const PublicSpacePage = () => {
  const user = useSelector(selectuser);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Create post
  const [newContent, setNewContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Posting info
  const [postingInfo, setPostingInfo] = useState<PostingInfo | null>(null);

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Search users
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Comment states (per-post)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<{ [postId: string]: string }>({});

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoadingPosts(true);
      const res = await axios.get(getApiUrl(`/public-space/posts?page=${pageNum}&limit=20`));
      if (res.data.success) {
        if (append) {
          setPosts((prev) => [...prev, ...res.data.posts]);
        } else {
          setPosts(res.data.posts);
        }
        setHasMore(pageNum < res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchPostingInfo = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await axios.get(getApiUrl(`/public-space/posting-info/${user.uid}`));
      if (res.data.success) setPostingInfo(res.data);
    } catch (err) {
      console.error("Posting info error:", err);
    }
  }, [user?.uid]);

  const fetchFriends = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await axios.get(getApiUrl(`/friends/list/${user.uid}`));
      if (res.data.success) setFriends(res.data.friends);
    } catch (err) {
      console.error("Friends error:", err);
    }
  }, [user?.uid]);

  const fetchFriendRequests = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await axios.get(getApiUrl(`/friends/requests/${user.uid}`));
      if (res.data.success) setFriendRequests(res.data.requests);
    } catch (err) {
      console.error("Friend requests error:", err);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    if (user?.uid) {
      fetchPostingInfo();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user?.uid, fetchPostingInfo, fetchFriends, fetchFriendRequests]);

  // ─── Search users (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(
          getApiUrl(`/friends/search?q=${encodeURIComponent(searchQuery)}&currentUid=${user?.uid || ""}`)
        );
        if (res.data.success) setSearchResults(res.data.users);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, user?.uid]);

  // ─── File selection ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Create post ──────────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!user?.uid) {
      toast.error("Please log in to post.");
      return;
    }
    if (!newContent.trim() && !selectedFile) {
      toast.error("Write something or upload media.");
      return;
    }

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("authorUid", user.uid);
      if (newContent.trim()) formData.append("content", newContent.trim());
      if (selectedFile) formData.append("media", selectedFile);

      const res = await axios.post(getApiUrl("/public-space/posts"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });

      if (res.data.success) {
        toast.success("Post created successfully!");
        setNewContent("");
        clearFile();
        fetchPosts(1);
        fetchPostingInfo();
      } else {
        toast.error(res.data.message || "Failed to create post.");
      }
    } catch (err: any) {
      console.error("Create post error:", err);
      toast.error(err.response?.data?.message || "Failed to create post.");
    } finally {
      setIsPosting(false);
    }
  };

  // ─── Like ──────────────────────────────────────────────────────────────────
  const handleLike = async (postId: string) => {
    if (!user?.uid) return toast.error("Please log in.");
    try {
      const res = await axios.post(
        getApiUrl(`/public-space/posts/${postId}/like`),
        { userUid: user.uid },
        { validateStatus: () => true }
      );
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              const liked = res.data.liked;
              return {
                ...p,
                likeUids: liked
                  ? [...p.likeUids, user.uid]
                  : p.likeUids.filter((u) => u !== user.uid),
                likes: liked ? [...p.likes, "temp"] : p.likes.slice(0, -1),
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // ─── Comment ───────────────────────────────────────────────────────────────
  const handleComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !user?.uid) return;

    try {
      const res = await axios.post(
        getApiUrl(`/public-space/posts/${postId}/comment`),
        { userUid: user.uid, text },
        { validateStatus: () => true }
      );
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return { ...p, comments: [...p.comments, res.data.comment] };
            }
            return p;
          })
        );
        setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  // ─── Delete post ───────────────────────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    if (!user?.uid) return;
    try {
      const res = await axios.delete(getApiUrl(`/public-space/posts/${postId}`), {
        data: { userUid: user.uid },
        validateStatus: () => true,
      });
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        toast.success("Post deleted.");
        fetchPostingInfo();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ─── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async (postId: string) => {
    try {
      await axios.post(getApiUrl(`/public-space/posts/${postId}/share`));
      const shareUrl = `${window.location.origin}/public-space?post=${postId}`;
      await navigator.clipboard.writeText(shareUrl);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, shareCount: p.shareCount + 1 } : p))
      );
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to share.");
    }
  };

  // ─── Friend actions ────────────────────────────────────────────────────────
  const sendFriendRequest = async (recipientUid: string) => {
    if (!user?.uid) return;
    try {
      const res = await axios.post(
        getApiUrl("/friends/request"),
        { requesterUid: user.uid, recipientUid },
        { validateStatus: () => true }
      );
      if (res.data.success) {
        toast.success("Friend request sent!");
        setSearchResults((prev) =>
          prev.map((u) =>
            u.uid === recipientUid ? { ...u, friendshipStatus: "pending", friendshipId: res.data.friendship._id } : u
          )
        );
      } else {
        toast.info(res.data.message);
      }
    } catch (err) {
      console.error("Send request error:", err);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user?.uid) return;
    try {
      const res = await axios.post(
        getApiUrl("/friends/accept"),
        { friendshipId, recipientUid: user.uid },
        { validateStatus: () => true }
      );
      if (res.data.success) {
        toast.success("Friend request accepted!");
        fetchFriends();
        fetchFriendRequests();
        fetchPostingInfo();
      }
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    if (!user?.uid) return;
    try {
      const res = await axios.post(
        getApiUrl("/friends/reject"),
        { friendshipId, recipientUid: user.uid },
        { validateStatus: () => true }
      );
      if (res.data.success) {
        toast.info("Friend request removed.");
        fetchFriendRequests();
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Public Space – Community | Internship Portal</title>
        <meta name="description" content="Connect with fellow students, share photos and videos, and engage with the community in the Public Space." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full mb-3">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Community</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Public Space
            </h1>
            <p className="text-gray-500 mt-1 text-sm max-w-md mx-auto">
              Share moments, connect with friends, and engage with the community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── LEFT SIDEBAR ─────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-4">
              {/* User Profile Card */}
              {user ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <div className="px-4 pb-4 -mt-8">
                    <img
                      src={user.photo || "/default-avatar.png"}
                      alt={user.name}
                      className="w-14 h-14 rounded-full border-3 border-white shadow-md object-cover bg-white"
                    />
                    <h3 className="font-bold text-gray-900 mt-2 text-sm">{user.name || "Student"}</h3>
                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                  </div>
                  {/* Stats */}
                  <div className="border-t border-gray-50 px-4 py-3 grid grid-cols-2 gap-2 text-center">
                    <div>
                      <span className="text-lg font-bold text-blue-600">{postingInfo?.friendCount || 0}</span>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Friends</p>
                    </div>
                    <div>
                      <span className="text-lg font-bold text-indigo-600">
                        {postingInfo?.postingLimit === "unlimited" ? "∞" : postingInfo?.postingLimit || 0}
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">Posts/Day</p>
                    </div>
                  </div>
                  {/* Posting limit bar */}
                  {postingInfo && postingInfo.postingLimit !== "unlimited" && (
                    <div className="px-4 pb-3">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Today&apos;s posts</span>
                        <span>{postingInfo.todayCount}/{postingInfo.postingLimit}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ((postingInfo.todayCount) / (Number(postingInfo.postingLimit) || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <Users className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 text-sm font-medium">Log in to join the community</p>
                </div>
              )}

              {/* Friend Requests */}
              {user && friendRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus size={15} className="text-orange-500" />
                      <span className="text-sm font-semibold text-gray-800">Friend Requests</span>
                      <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {friendRequests.length}
                      </span>
                    </div>
                    {showFriendRequests ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showFriendRequests && (
                    <div className="border-t border-gray-50 max-h-60 overflow-y-auto">
                      {friendRequests.map((req) => (
                        <div key={req.friendshipId} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0">
                          <img src={req.fromPhoto || "/default-avatar.png"} alt={req.fromName} className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{req.fromName}</p>
                            <p className="text-[10px] text-gray-400">{timeAgo(req.createdAt)}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => acceptFriendRequest(req.friendshipId)}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              <UserCheck size={12} />
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(req.friendshipId)}
                              className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Friends List */}
              {user && friends.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Users size={14} className="text-blue-500" />
                      My Friends ({friends.length})
                    </h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {friends.map((f) => (
                      <div key={f.friendshipId} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <img src={f.photo || "/default-avatar.png"} alt={f.name} className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                          <p className="text-[10px] text-gray-400">Friends since {new Date(f.since).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── CENTER FEED ──────────────────────────────────────────── */}
            <div className="lg:col-span-6 space-y-5">
              {/* Create Post */}
              {user && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex gap-3">
                    <img
                      src={user.photo || "/default-avatar.png"}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder={
                          !postingInfo?.canPost && postingInfo?.friendCount === 0
                            ? "Add friends to start posting..."
                            : "What's on your mind?"
                        }
                        disabled={!postingInfo?.canPost}
                        className="w-full resize-none border-0 bg-gray-50 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]"
                        maxLength={2000}
                      />

                      {/* File Preview */}
                      {filePreview && selectedFile && (
                        <div className="relative mt-3 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                          {selectedFile.type.startsWith("video/") ? (
                            <video src={filePreview} controls className="w-full max-h-64 object-contain" />
                          ) : (
                            <img src={filePreview} alt="Preview" className="w-full max-h-64 object-contain" />
                          )}
                          <button
                            onClick={clearFile}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="post-media-upload"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!postingInfo?.canPost}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ImageIcon size={14} />
                            Photo
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!postingInfo?.canPost}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Video size={14} />
                            Video
                          </button>
                        </div>
                        <button
                          onClick={handleCreatePost}
                          disabled={isPosting || !postingInfo?.canPost || (!newContent.trim() && !selectedFile)}
                          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer"
                        >
                          {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          {isPosting ? "Posting..." : "Post"}
                        </button>
                      </div>

                      {/* Posting limit warning */}
                      {postingInfo && !postingInfo.canPost && (
                        <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-xs text-amber-700 font-medium">
                            {postingInfo.friendCount === 0
                              ? "🤝 You need at least 1 friend to post. Find and add friends using the search panel!"
                              : `📊 You've used all ${postingInfo.postingLimit} post(s) today. Add more friends to increase your daily limit!`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Posts Feed */}
              {loadingPosts && posts.length === 0 ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <Sparkles className="mx-auto text-gray-200 mb-3" size={48} />
                  <h3 className="text-lg font-bold text-gray-600">No posts yet</h3>
                  <p className="text-gray-400 text-sm mt-1">Be the first to share something with the community!</p>
                </div>
              ) : (
                <>
                  {posts.map((post) => {
                    const isLiked = user?.uid && post.likeUids.includes(user.uid);
                    const isOwner = user?.uid === post.authorUid;
                    const commentsOpen = expandedComments.has(post._id);

                    return (
                      <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                        {/* Post Header */}
                        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.authorPhoto?.startsWith("http") ? post.authorPhoto : (BACKEND_BASE + (post.authorPhoto || "/default-avatar.png"))}
                              alt={post.authorName}
                              className="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-gray-50"
                              onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                            />
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{post.authorName}</h4>
                              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock size={10} />
                                <span>{timeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete post"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Content */}
                        {post.content && (
                          <div className="px-5 pb-3">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          </div>
                        )}

                        {/* Media */}
                        {post.mediaUrl && (
                          <div className="bg-gray-50">
                            {post.mediaType === "video" ? (
                              <video
                                src={BACKEND_BASE + post.mediaUrl}
                                controls
                                className="w-full max-h-[500px] object-contain"
                              />
                            ) : (
                              <img
                                src={BACKEND_BASE + post.mediaUrl}
                                alt="Post media"
                                className="w-full max-h-[500px] object-contain"
                                loading="lazy"
                              />
                            )}
                          </div>
                        )}

                        {/* Engagement Stats */}
                        <div className="px-5 py-2 flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {post.likes.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center">
                                  <Heart size={8} className="text-white fill-white" />
                                </span>
                                {post.likes.length}
                              </span>
                            )}
                          </span>
                          <div className="flex gap-3">
                            {post.comments.length > 0 && <span>{post.comments.length} comment{post.comments.length > 1 ? "s" : ""}</span>}
                            {post.shareCount > 0 && <span>{post.shareCount} share{post.shareCount > 1 ? "s" : ""}</span>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-3 py-1 border-t border-gray-50 flex">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isLiked
                                ? "text-red-500 bg-red-50/50 hover:bg-red-50"
                                : "text-gray-500 hover:bg-gray-50 hover:text-red-500"
                            }`}
                          >
                            <Heart size={16} className={isLiked ? "fill-red-500" : ""} />
                            Like
                          </button>
                          <button
                            onClick={() => {
                              setExpandedComments((prev) => {
                                const next = new Set(prev);
                                if (next.has(post._id)) next.delete(post._id);
                                else next.add(post._id);
                                return next;
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-all cursor-pointer"
                          >
                            <MessageCircle size={16} />
                            Comment
                          </button>
                          <button
                            onClick={() => handleShare(post._id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-green-500 transition-all cursor-pointer"
                          >
                            <Share2 size={16} />
                            Share
                          </button>
                        </div>

                        {/* Comments Section */}
                        {commentsOpen && (
                          <div className="border-t border-gray-50 bg-gray-50/50">
                            {/* Existing comments */}
                            {post.comments.length > 0 && (
                              <div className="px-5 py-3 space-y-3 max-h-60 overflow-y-auto">
                                {post.comments.map((c) => (
                                  <div key={c._id} className="flex gap-2.5">
                                    <img
                                      src={c.userPhoto || "/default-avatar.png"}
                                      alt={c.userName}
                                      className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0 mt-0.5"
                                      onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                                    />
                                    <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-800">{c.userName}</span>
                                        <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Add comment input */}
                            {user && (
                              <div className="px-5 py-3 flex gap-2 border-t border-gray-100/50">
                                <img
                                  src={user.photo || "/default-avatar.png"}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0"
                                />
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={commentTexts[post._id] || ""}
                                    onChange={(e) =>
                                      setCommentTexts((prev) => ({ ...prev, [post._id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleComment(post._id);
                                      }
                                    }}
                                    placeholder="Write a comment..."
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 pr-10 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                                    maxLength={500}
                                  />
                                  <button
                                    onClick={() => handleComment(post._id)}
                                    disabled={!commentTexts[post._id]?.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-300 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Send size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMore}
                        disabled={loadingPosts}
                        className="px-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {loadingPosts ? (
                          <Loader2 size={16} className="animate-spin inline mr-2" />
                        ) : null}
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── RIGHT SIDEBAR ────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search Users */}
              {user && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Search size={14} className="text-blue-500" />
                      Find People
                    </h4>
                  </div>
                  <div className="p-4">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                    </div>

                    {isSearching && (
                      <div className="flex justify-center py-4">
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                        {searchResults.map((u) => (
                          <div key={u.uid} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <img
                              src={u.photo || "/default-avatar.png"}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover bg-gray-100"
                              onError={(e) => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                            </div>
                            {u.friendshipStatus === "accepted" ? (
                              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <UserCheck size={10} /> Friends
                              </span>
                            ) : u.friendshipStatus === "pending" ? (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                                <Clock size={10} /> Pending
                              </span>
                            ) : (
                              <button
                                onClick={() => sendFriendRequest(u.uid)}
                                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                title="Send friend request"
                              >
                                <UserPlus size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No users found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Posting Rules */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-500" />
                  Community Rules
                </h4>
                <div className="space-y-2">
                  {[
                    { friends: "0 friends", posts: "Cannot post", color: "text-red-500 bg-red-50" },
                    { friends: "1 friend", posts: "1 post/day", color: "text-amber-600 bg-amber-50" },
                    { friends: "2 friends", posts: "2 posts/day", color: "text-blue-600 bg-blue-50" },
                    { friends: "10+ friends", posts: "Unlimited", color: "text-green-600 bg-green-50" },
                  ].map((rule) => (
                    <div key={rule.friends} className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">{rule.friends}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rule.color}`}>
                        {rule.posts}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                  Add friends to unlock more posting slots. This encourages meaningful connections!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicSpacePage;
