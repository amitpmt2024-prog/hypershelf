"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-purple-200/60 dark:border-purple-800/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400 tracking-tight">
                  HypeShelf
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
                  Collect and share the stuff you&apos;re hyped about
                </p>
              </div>
            </div>
            <div suppressHydrationWarning className="flex items-center gap-3">
              <Unauthenticated>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-2 border-purple-300 dark:border-purple-700 rounded-lg shadow-sm hover:shadow-md transition-all">
                    <span>Sign in</span>
                    <span className="text-purple-600 dark:text-purple-400">→</span>
                  </button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <UserButton />
              </Authenticated>
            </div>
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Authenticated>
            <AuthenticatedContent />
          </Authenticated>
          <Unauthenticated>
            <PublicContent />
          </Unauthenticated>
        </div>
      </main>
    </>
  );
}

function PublicContent() {
  const recommendations = useQuery(api.myFunctions.listPublicRecommendations, {
    count: 5,
  });

  if (recommendations === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-200 border-t-purple-600"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Latest Recommendations
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Discover what others are hyped about
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-5">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No recommendations yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Be the first to share something you&apos;re hyped about!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec._id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuthenticatedContent() {
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    link: "",
    blurb: "",
  });

  const data = useQuery(api.myFunctions.listAllRecommendations, {
    genre: selectedGenre === "all" ? undefined : selectedGenre,
  });
  const genres = useQuery(api.myFunctions.getGenres);
  const createRec = useMutation(api.myFunctions.createRecommendation);
  const deleteRec = useMutation(api.myFunctions.deleteRecommendation);
  const toggleStaffPick = useMutation(api.myFunctions.toggleStaffPick);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.genre || !formData.link || !formData.blurb) {
      return;
    }
    try {
      await createRec(formData);
      setFormData({ title: "", genre: "", link: "", blurb: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      alert("Failed to create recommendation. Please try again.");
    }
  };

  const handleDelete = async (id: Id<"recommendations">) => {
    if (confirm("Are you sure you want to delete this recommendation?")) {
      try {
        await deleteRec({ recommendationId: id });
      } catch (error) {
        const err = error as { message?: string };
        console.error("Error deleting recommendation:", error);
        alert(err?.message || "You can only delete your own recommendations");
      }
    }
  };

  const handleToggleStaffPick = async (
    id: Id<"recommendations">,
    currentValue: boolean
  ) => {
    try {
      await toggleStaffPick({
        recommendationId: id,
        isStaffPick: !currentValue,
      });
    } catch (error) {
      const err = error as { message?: string };
      console.error("Error toggling staff pick:", error);
      alert(err?.message || "Only admins can mark recommendations as Staff Pick");
    }
  };

  if (data === undefined || genres === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-200 border-t-purple-600"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  const recommendations = data.recommendations || [];
  const currentUserId = data.currentUserId || "";
  const userRole = data.userRole || "user";
  const isAdmin = userRole === "admin";
  const allGenres = ["all", ...genres].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
            All Recommendations
          </h2>
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">👑 Admin</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all"
        >
          <span className="text-base">{showAddForm ? "✕" : "+"}</span>
          <span>{showAddForm ? "Cancel" : "Add Recommendation"}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 p-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-50">Add New Recommendation</h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter the title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                placeholder="e.g., horror, action, comedy, drama..."
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Link (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Short Blurb
              </label>
              <textarea
                placeholder="Tell us why you&apos;re hyped about this..."
                value={formData.blurb}
                onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none min-h-[120px] resize-y"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all mt-2"
            >
              Submit Recommendation
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2.5">
        {allGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedGenre === genre
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 dark:bg-purple-500"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            }`}
          >
            {genre === "all" ? "All" : genre}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-5">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {selectedGenre === "all" ? "No recommendations yet" : `No ${selectedGenre} recommendations`}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedGenre === "all" 
              ? "Be the first to share something you&apos;re hyped about!"
              : `Try a different genre or add the first ${selectedGenre} recommendation!`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec: typeof recommendations[0]) => (
            <AuthenticatedRecommendationCard
              key={rec._id}
              recommendation={rec}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onToggleStaffPick={handleToggleStaffPick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: {
    _id: Id<"recommendations">;
    title: string;
    genre: string;
    link: string;
    blurb: string;
    authorName: string;
    isStaffPick: boolean;
  };
}) {
  const genreColors: Record<string, string> = {
    horror: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    action: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    comedy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    drama: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    thriller: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    "sci-fi": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    "sci fi": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    romance: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
      {recommendation.isStaffPick && (
        <div className="absolute -top-2.5 -right-2.5">
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border-2 border-amber-600">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {recommendation.title}
            </a>
          </h3>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center gap-2.5 pt-3 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {recommendation.authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            by <span className="font-semibold text-slate-700 dark:text-slate-300">{recommendation.authorName}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function AuthenticatedRecommendationCard({
  recommendation,
  isAdmin,
  currentUserId,
  onDelete,
  onToggleStaffPick,
}: {
  recommendation: {
    _id: Id<"recommendations">;
    title: string;
    genre: string;
    link: string;
    blurb: string;
    authorId: string;
    authorName: string;
    isStaffPick: boolean;
  };
  isAdmin: boolean;
  currentUserId: string;
  onDelete: (id: Id<"recommendations">) => void;
  onToggleStaffPick: (id: Id<"recommendations">, currentValue: boolean) => void;
}) {
  const canDelete = isAdmin || recommendation.authorId === currentUserId;
  
  const genreColors: Record<string, string> = {
    horror: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    action: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    comedy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    drama: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    thriller: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    "sci-fi": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    "sci fi": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    romance: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
      {recommendation.isStaffPick && (
        <div className="absolute -top-2.5 -right-2.5 z-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border-2 border-amber-600">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {recommendation.title}
            </a>
          </h3>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {recommendation.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              by <span className="font-semibold text-slate-700 dark:text-slate-300">{recommendation.authorName}</span>
            </span>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() =>
                  onToggleStaffPick(recommendation._id, recommendation.isStaffPick)
                }
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all border-2 border-transparent hover:border-amber-300 dark:hover:border-amber-700"
                title="Toggle Staff Pick"
              >
                {recommendation.isStaffPick ? "⭐" : "☆"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(recommendation._id)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
                title={isAdmin ? "Delete (Admin)" : "Delete Your Recommendation"}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
