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
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  HypeShelf
                </h1>
              </div>
              <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 ml-2">
                Collect and share the stuff you&apos;re hyped about.
              </p>
            </div>
            <div suppressHydrationWarning>
              <Authenticated>
                <UserButton />
              </Authenticated>
            </div>
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
          Latest Recommendations
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Discover what others are hyped about and join the community
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-6">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No recommendations yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Be the first to share something you&apos;re hyped about!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <RecommendationCard 
              key={rec._id} 
              recommendation={rec}
              index={index}
            />
          ))}
        </div>
      )}

      <div className="text-center pt-8">
        <SignInButton mode="modal">
          <button className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:from-purple-700 hover:to-pink-700">
            <span className="mr-2">✨</span>
            Sign in to add yours
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </SignInButton>
      </div>
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading recommendations...</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            All Recommendations
          </h2>
          {isAdmin && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">👑 Admin Mode</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
        >
          <span className="text-xl">{showAddForm ? "✕" : "+"}</span>
          <span>{showAddForm ? "Cancel" : "Add Recommendation"}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Add New Recommendation</h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter the title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                placeholder="e.g., horror, action, comedy, drama..."
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Link (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Short Blurb
              </label>
              <textarea
                placeholder="Tell us why you&apos;re hyped about this..."
                value={formData.blurb}
                onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[120px] resize-y"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
            >
              Submit Recommendation
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {allGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
              selectedGenre === genre
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
            }`}
          >
            {genre === "all" ? "✨ All" : genre}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-6">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {selectedGenre === "all" ? "No recommendations yet" : `No ${selectedGenre} recommendations`}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {selectedGenre === "all" 
              ? "Be the first to share something you&apos;re hyped about!"
              : `Try a different genre or add the first ${selectedGenre} recommendation!`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
  index = 0,
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
  index?: number;
}) {
  const genreColors: Record<string, string> = {
    horror: "from-red-500 to-rose-600",
    action: "from-orange-500 to-amber-600",
    comedy: "from-yellow-500 to-orange-500",
    drama: "from-blue-500 to-indigo-600",
    thriller: "from-purple-500 to-pink-600",
    "sci-fi": "from-cyan-500 to-blue-600",
    "sci fi": "from-cyan-500 to-blue-600",
    romance: "from-pink-500 to-rose-500",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "from-slate-500 to-slate-600";

  return (
    <div 
      className="group relative bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-700/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {recommendation.isStaffPick && (
        <div className="absolute -top-3 -right-3">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-2"
            >
              {recommendation.title}
              <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          </h3>
        </div>
        
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
            {recommendation.authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            by <span className="font-medium">{recommendation.authorName}</span>
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
    horror: "from-red-500 to-rose-600",
    action: "from-orange-500 to-amber-600",
    comedy: "from-yellow-500 to-orange-500",
    drama: "from-blue-500 to-indigo-600",
    thriller: "from-purple-500 to-pink-600",
    "sci-fi": "from-cyan-500 to-blue-600",
    "sci fi": "from-cyan-500 to-blue-600",
    romance: "from-pink-500 to-rose-500",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "from-slate-500 to-slate-600";

  return (
    <div 
      className="group relative bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-700/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {recommendation.isStaffPick && (
        <div className="absolute -top-3 -right-3 z-10">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-2"
            >
              {recommendation.title}
              <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          </h3>
        </div>
        
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
              {recommendation.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              by <span className="font-medium">{recommendation.authorName}</span>
            </span>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() =>
                  onToggleStaffPick(recommendation._id, recommendation.isStaffPick)
                }
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                title="Toggle Staff Pick"
              >
                {recommendation.isStaffPick ? "⭐" : "☆"}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(recommendation._id)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
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
