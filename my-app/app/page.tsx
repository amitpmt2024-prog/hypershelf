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
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">HypeShelf</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Collect and share the stuff you're hyped about.
          </p>
        </div>
        <div suppressHydrationWarning>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </header>
      <main className="p-8 flex flex-col gap-8 max-w-4xl mx-auto">
        <Authenticated>
          <AuthenticatedContent />
        </Authenticated>
        <Unauthenticated>
          <PublicContent />
        </Unauthenticated>
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
      <div className="mx-auto">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Latest Recommendations</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Discover what others are hyped about
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          <p>No recommendations yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec._id} recommendation={rec} />
          ))}
        </div>
      )}

      <div className="text-center pt-8">
        <SignInButton mode="modal">
          <button className="bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity">
            Sign in to add yours
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

  const recommendations = useQuery(api.myFunctions.listAllRecommendations, {
    genre: selectedGenre === "all" ? undefined : selectedGenre,
  });
  const genres = useQuery(api.myFunctions.getGenres);
  const userRole = useQuery(api.myFunctions.getUserRoleQuery);
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
    }
  };

  const handleDelete = async (id: Id<"recommendations">) => {
    if (confirm("Are you sure you want to delete this recommendation?")) {
      try {
        await deleteRec({ recommendationId: id });
      } catch (error) {
        console.error("Error deleting recommendation:", error);
        alert("You can only delete your own recommendations");
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
      console.error("Error toggling staff pick:", error);
      alert("Only admins can mark recommendations as Staff Pick");
    }
  };

  const isAdmin = userRole?.role === "admin";

  if (recommendations === undefined || genres === undefined || userRole === undefined) {
    return (
      <div className="mx-auto">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  const allGenres = ["all", ...genres].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">All Recommendations</h2>
          <p className="text-slate-600 dark:text-slate-400">
            {isAdmin && <span className="text-amber-600 dark:text-amber-400">Admin Mode</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-foreground text-background px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          {showAddForm ? "Cancel" : "+ Add Recommendation"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <h3 className="text-xl font-bold mb-4">Add New Recommendation</h3>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-background"
              required
            />
            <input
              type="text"
              placeholder="Genre (e.g., horror, action, comedy)"
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-background"
              required
            />
            <input
              type="url"
              placeholder="Link (URL)"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-background"
              required
            />
            <textarea
              placeholder="Short blurb"
              value={formData.blurb}
              onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
              className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-background min-h-[100px]"
              required
            />
            <button
              type="submit"
              className="bg-foreground text-background px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {allGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedGenre === genre
                ? "bg-foreground text-background"
                : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {genre === "all" ? "All" : genre}
          </button>
        ))}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          <p>
            {selectedGenre === "all"
              ? "No recommendations yet. Add one above!"
              : `No recommendations in "${selectedGenre}" genre.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec) => (
              <AuthenticatedRecommendationCard
              key={rec._id}
              recommendation={rec}
              isAdmin={isAdmin}
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
  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      {recommendation.isStaffPick && (
        <div className="mb-2">
          <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
            ⭐ Staff Pick
          </span>
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">
        <a
          href={recommendation.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {recommendation.title}
        </a>
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
        <span className="font-medium">{recommendation.genre}</span> • by{" "}
        {recommendation.authorName}
      </p>
      <p className="text-slate-700 dark:text-slate-300">{recommendation.blurb}</p>
    </div>
  );
}

function AuthenticatedRecommendationCard({
  recommendation,
  isAdmin,
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
  onDelete: (id: Id<"recommendations">) => void;
  onToggleStaffPick: (id: Id<"recommendations">, currentValue: boolean) => void;
}) {
  // Show delete button for all users - authorization is handled in the mutation
  // Users can delete their own, admins can delete any

  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {recommendation.isStaffPick && (
            <div className="mb-2">
              <span className="inline-block bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                ⭐ Staff Pick
              </span>
            </div>
          )}
          <h3 className="text-xl font-bold mb-2">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {recommendation.title}
            </a>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span className="font-medium">{recommendation.genre}</span> • by{" "}
            {recommendation.authorName}
          </p>
          <p className="text-slate-700 dark:text-slate-300">{recommendation.blurb}</p>
        </div>
        <div className="flex gap-2 ml-4">
          {isAdmin && (
            <button
              onClick={() =>
                onToggleStaffPick(recommendation._id, recommendation.isStaffPick)
              }
              className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
              title="Toggle Staff Pick"
            >
              {recommendation.isStaffPick ? "⭐" : "☆"}
            </button>
          )}
          <button
            onClick={() => onDelete(recommendation._id)}
            className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300"
            title="Delete (your own only, or any if admin)"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
