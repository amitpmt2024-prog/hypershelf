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

// Predefined movie types
const MOVIE_TYPES = ["Action", "Adventure", "Comedy", "Drama", "Horror", "Romance", "Documentary"] as const;

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-blue-200/60 dark:border-blue-800/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">
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
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all">
                    <span>Sign in</span>
                    <span className="text-blue-600 dark:text-blue-400">→</span>
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
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400 mb-4 shadow-lg shadow-blue-500/20">
          <span className="text-3xl">📚</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Welcome to HypeShelf
        </h2>
        <p className="text-lg sm:text-xl text-blue-600 dark:text-blue-400 font-medium max-w-2xl mx-auto">
          Collect and share the stuff you&apos;re hyped about
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-5">
            <span className="text-4xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No recommendations yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Be the first to share something you&apos;re hyped about!
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all">
              <span>Get Started</span>
              <span>→</span>
            </button>
          </SignInButton>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec._id} recommendation={rec} />
            ))}
          </div>
        </>
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recommendationToDelete, setRecommendationToDelete] = useState<Id<"recommendations"> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [staffPickModalOpen, setStaffPickModalOpen] = useState(false);
  const [recommendationForStaffPick, setRecommendationForStaffPick] = useState<{
    id: Id<"recommendations">;
    currentValue: boolean;
    title: string;
  } | null>(null);
  const [togglingStaffPick, setTogglingStaffPick] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState<Id<"recommendations"> | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    genre: "",
    link: "",
    blurb: "",
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    genre?: string;
    link?: string;
    blurb?: string;
  }>({});
  const [editFormErrors, setEditFormErrors] = useState<{
    title?: string;
    genre?: string;
    link?: string;
    blurb?: string;
  }>({});

  const data = useQuery(api.myFunctions.listAllRecommendations, {
    genre: selectedGenre === "all" ? undefined : selectedGenre,
  });
  const genres = useQuery(api.myFunctions.getGenres);
  const generateUploadUrl = useMutation(api.myFunctions.generateUploadUrl);
  const createRec = useMutation(api.myFunctions.createRecommendation);
  const updateRec = useMutation(api.myFunctions.updateRecommendation);
  const deleteRec = useMutation(api.myFunctions.deleteRecommendation);
  const toggleStaffPick = useMutation(api.myFunctions.toggleStaffPick);
  
  // Get editing recommendation and its image URL
  const recommendations = data?.recommendations || [];
  const editingRec = editingRecommendation 
    ? recommendations.find((r) => r._id === editingRecommendation)
    : null;
  const editImageUrl = useQuery(
    api.myFunctions.getImageUrl,
    editingRec?.imageId ? { imageId: editingRec.imageId } : "skip"
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setImageError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        e.target.value = ""; // Clear the input
        return;
      }
      
      // Validate file size (max 2MB for better performance)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setImageError(`Image size is ${fileSizeMB}MB. Maximum allowed size is 2MB. Please choose a smaller image.`);
        e.target.value = ""; // Clear the input
        return;
      }
      
      // Validate image dimensions
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 2000;
          const maxHeight = 2000;
          
          if (img.width > maxWidth || img.height > maxHeight) {
            setImageError(`Image dimensions are ${img.width}x${img.height}px. Maximum allowed dimensions are ${maxWidth}x${maxHeight}px. Please choose a smaller image.`);
            e.target.value = ""; // Clear the input
            setSelectedImage(null);
            setImagePreview(null);
            return;
          }
          
          // All validations passed
          setSelectedImage(file);
          setImagePreview(reader.result as string);
          setImageError(null);
        };
        img.onerror = () => {
          setImageError("Invalid image file. Please choose a valid image.");
          e.target.value = ""; // Clear the input
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (data: { title: string; genre: string; link: string; blurb: string }) => {
    const errors: { title?: string; genre?: string; link?: string; blurb?: string } = {};

    // Title validation
    if (!data.title.trim()) {
      errors.title = "Title is required";
    } else if (data.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (data.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    // Genre validation
    if (!data.genre) {
      errors.genre = "Please select a genre";
    }

    // Link validation
    if (!data.link.trim()) {
      errors.link = "Link is required";
    } else {
      try {
        const url = new URL(data.link);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.link = "Link must start with http:// or https://";
        }
      } catch {
        errors.link = "Please enter a valid URL";
      }
    }

    // Blurb validation
    if (!data.blurb.trim()) {
      errors.blurb = "Blurb is required";
    } else if (data.blurb.trim().length < 10) {
      errors.blurb = "Blurb must be at least 10 characters";
    } else if (data.blurb.trim().length > 1000) {
      errors.blurb = "Blurb must be less than 1000 characters";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setUploading(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;

      // Upload image if selected
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const response = await result.json();
        imageId = response.storageId as Id<"_storage">;
      }

      // Create recommendation with image
      await createRec({
        ...formData,
        imageId,
      });

      // Reset form
      setFormData({ title: "", genre: "", link: "", blurb: "" });
      setFormErrors({});
      setSelectedImage(null);
      setImagePreview(null);
      setImageError(null);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      alert("Failed to create recommendation. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (id: Id<"recommendations">) => {
    setRecommendationToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recommendationToDelete) return;
    
    setDeleting(true);
    try {
      await deleteRec({ recommendationId: recommendationToDelete });
      setDeleteModalOpen(false);
      setRecommendationToDelete(null);
    } catch (error) {
      const err = error as { message?: string };
      console.error("Error deleting recommendation:", error);
      alert(err?.message || "You can only delete your own recommendations");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setRecommendationToDelete(null);
  };

  const handleEditClick = (rec: {
    _id: Id<"recommendations">;
    title: string;
    genre: string;
    link: string;
    blurb: string;
    authorId: string;
    authorName: string;
    isStaffPick: boolean;
    imageId?: Id<"_storage">;
    _creationTime?: number;
  }) => {
    setEditingRecommendation(rec._id);
    setEditFormData({
      title: rec.title,
      genre: rec.genre,
      link: rec.link,
      blurb: rec.blurb,
    });
    setEditSelectedImage(null);
    setEditImagePreview(null);
    setEditImageError(null);
  };

  const handleEditCancel = () => {
    setEditingRecommendation(null);
    setEditFormData({ title: "", genre: "", link: "", blurb: "" });
    setEditFormErrors({});
    setEditSelectedImage(null);
    setEditImagePreview(null);
    setEditImageError(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setEditImageError(null);
    
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setEditImageError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        e.target.value = "";
        return;
      }
      
      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setEditImageError(`Image size is ${fileSizeMB}MB. Maximum allowed size is 2MB. Please choose a smaller image.`);
        e.target.value = "";
        return;
      }
      
      // Validate image dimensions
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 2000;
          const maxHeight = 2000;
          
          if (img.width > maxWidth || img.height > maxHeight) {
            setEditImageError(`Image dimensions are ${img.width}x${img.height}px. Maximum allowed dimensions are ${maxWidth}x${maxHeight}px. Please choose a smaller image.`);
            e.target.value = "";
            setEditSelectedImage(null);
            setEditImagePreview(null);
            return;
          }
          
          setEditSelectedImage(file);
          setEditImagePreview(reader.result as string);
          setEditImageError(null);
        };
        img.onerror = () => {
          setEditImageError("Invalid image file. Please choose a valid image.");
          e.target.value = "";
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRecommendation) {
      return;
    }

    const errors = validateForm(editFormData);
    setEditFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setUpdating(true);
    try {
      let imageId: Id<"_storage"> | undefined = undefined;
      const currentRec = recommendations.find((r) => r._id === editingRecommendation);

      // Upload new image if selected
      if (editSelectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": editSelectedImage.type },
          body: editSelectedImage,
        });
        const response = await result.json();
        imageId = response.storageId as Id<"_storage">;
      } else if (currentRec?.imageId) {
        // Keep existing image if no new image selected
        imageId = currentRec.imageId;
      }

      // Update recommendation
      await updateRec({
        recommendationId: editingRecommendation,
        ...editFormData,
        imageId,
      });

      // Reset form and redirect back to list
      setEditFormErrors({});
      handleEditCancel();
    } catch (error) {
      const err = error as { message?: string };
      console.error("Error updating recommendation:", error);
      alert(err?.message || "Failed to update recommendation. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStaffPickClick = (
    id: Id<"recommendations">,
    currentValue: boolean,
    title: string
  ) => {
    setRecommendationForStaffPick({ id, currentValue, title });
    setStaffPickModalOpen(true);
  };

  const handleToggleStaffPickConfirm = async () => {
    if (!recommendationForStaffPick) return;
    
    setTogglingStaffPick(true);
    try {
      await toggleStaffPick({
        recommendationId: recommendationForStaffPick.id,
        isStaffPick: !recommendationForStaffPick.currentValue,
      });
      setStaffPickModalOpen(false);
      setRecommendationForStaffPick(null);
    } catch (error) {
      const err = error as { message?: string };
      console.error("Error toggling staff pick:", error);
      alert(err?.message || "Only admins can mark recommendations as Staff Pick");
    } finally {
      setTogglingStaffPick(false);
    }
  };

  const handleToggleStaffPickCancel = () => {
    setStaffPickModalOpen(false);
    setRecommendationForStaffPick(null);
  };

  if (data === undefined || genres === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600"></div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  const currentUserId = data.currentUserId || "";
  const userRole = data.userRole || "user";
  const isAdmin = userRole === "admin";
  const allGenres = ["all", ...MOVIE_TYPES];

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDeleteCancel}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Delete Recommendation
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isAdmin ? "Admin: Delete any recommendation" : "This action cannot be undone"}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Are you sure you want to delete this recommendation? This will permanently remove it from HypeShelf.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Pick Confirmation Modal */}
      {staffPickModalOpen && recommendationForStaffPick && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleToggleStaffPickCancel}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {recommendationForStaffPick.currentValue ? "Remove Staff Pick" : "Mark as Staff Pick"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Admin Action
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {recommendationForStaffPick.currentValue 
                ? `Are you sure you want to remove the Staff Pick status from "${recommendationForStaffPick.title}"?`
                : `Are you sure you want to mark "${recommendationForStaffPick.title}" as a Staff Pick? This will highlight it as a featured recommendation.`}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleToggleStaffPickCancel}
                disabled={togglingStaffPick}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStaffPickConfirm}
                disabled={togglingStaffPick}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-lg transition-all shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {togglingStaffPick 
                  ? (recommendationForStaffPick.currentValue ? "Removing..." : "Marking...") 
                  : (recommendationForStaffPick.currentValue ? "Remove Staff Pick" : "Mark as Staff Pick")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode - Show only edit form */}
      {editingRecommendation && editingRec ? (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
                Edit Recommendation
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Update your recommendation details
              </p>
            </div>
            <button
              type="button"
              onClick={handleEditCancel}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to List</span>
            </button>
          </div>

          {/* Edit Form */}
          <form
            onSubmit={handleEditSubmit}
            className="bg-white dark:bg-slate-800 p-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter the title..."
                value={editFormData.title}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, title: e.target.value });
                  if (editFormErrors.title) {
                    setEditFormErrors({ ...editFormErrors, title: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  editFormErrors.title
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {editFormErrors.title && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{editFormErrors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                value={editFormData.genre}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, genre: e.target.value });
                  if (editFormErrors.genre) {
                    setEditFormErrors({ ...editFormErrors, genre: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  editFormErrors.genre
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              >
                <option value="">Select a genre...</option>
                {MOVIE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {editFormErrors.genre && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{editFormErrors.genre}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Link (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={editFormData.link}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, link: e.target.value });
                  if (editFormErrors.link) {
                    setEditFormErrors({ ...editFormErrors, link: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  editFormErrors.link
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {editFormErrors.link && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{editFormErrors.link}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Short Blurb <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Tell us why you&apos;re hyped about this..."
                value={editFormData.blurb}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, blurb: e.target.value });
                  if (editFormErrors.blurb) {
                    setEditFormErrors({ ...editFormErrors, blurb: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[120px] resize-y ${
                  editFormErrors.blurb
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {editFormErrors.blurb && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{editFormErrors.blurb}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Movie Picture (Optional)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Max size: 2MB | Max dimensions: 2000x2000px | Formats: JPEG, PNG, WebP, GIF
              </p>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleEditImageChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
                {editImageError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{editImageError}</p>
                  </div>
                )}
                {(editImagePreview || (editImageUrl && !editSelectedImage)) && !editImageError && (
                  <div className="relative group">
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900">
                      <img
                        src={editImagePreview || editImageUrl || ""}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditSelectedImage(null);
                        setEditImagePreview(null);
                        setEditImageError(null);
                        const fileInput = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md border-2 border-red-600"
                    >
                      Remove
                    </button>
                    {editSelectedImage && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded backdrop-blur-sm">
                        {(editSelectedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    )}
                    {!editSelectedImage && editImageUrl && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded backdrop-blur-sm">
                        Current Image
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={updating}
                  className="flex-1 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? "Updating..." : "Update Recommendation"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* List Mode - Show header, filters, and movie list */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
                  Your HypeShelf
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Manage your recommendations and discover new favorites
                </p>
                {isAdmin && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">👑 Admin</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (showAddForm) {
                    setFormErrors({});
                    setFormData({ title: "", genre: "", link: "", blurb: "" });
                    setSelectedImage(null);
                    setImagePreview(null);
                    setImageError(null);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all"
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
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter the title..."
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) {
                    setFormErrors({ ...formErrors, title: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  formErrors.title
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {formErrors.title && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{formErrors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.genre}
                onChange={(e) => {
                  setFormData({ ...formData, genre: e.target.value });
                  if (formErrors.genre) {
                    setFormErrors({ ...formErrors, genre: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  formErrors.genre
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              >
                <option value="">Select a genre...</option>
                {MOVIE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {formErrors.genre && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{formErrors.genre}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Link (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => {
                  setFormData({ ...formData, link: e.target.value });
                  if (formErrors.link) {
                    setFormErrors({ ...formErrors, link: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none ${
                  formErrors.link
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {formErrors.link && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{formErrors.link}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Short Blurb <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Tell us why you&apos;re hyped about this..."
                value={formData.blurb}
                onChange={(e) => {
                  setFormData({ ...formData, blurb: e.target.value });
                  if (formErrors.blurb) {
                    setFormErrors({ ...formErrors, blurb: undefined });
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[120px] resize-y ${
                  formErrors.blurb
                    ? "border-red-500 dark:border-red-500 focus:border-red-500"
                    : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                }`}
                required
              />
              {formErrors.blurb && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{formErrors.blurb}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Movie Picture (Optional)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Max size: 2MB | Max dimensions: 2000x2000px | Formats: JPEG, PNG, WebP, GIF
              </p>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
                {imageError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{imageError}</p>
                  </div>
                )}
                {imagePreview && !imageError && (
                  <div className="relative group">
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setImageError(null);
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors shadow-md border-2 border-red-600"
                    >
                      Remove
                    </button>
                    {selectedImage && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded backdrop-blur-sm">
                        {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Submit Recommendation"}
            </button>
            </div>
          </form>
            )}

            <div className="flex flex-wrap gap-2.5">
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    selectedGenre === genre
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 dark:bg-blue-500"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {genre === "all" ? "All" : genre}
                </button>
              ))}
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900/40 mb-5">
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
                    onDelete={handleDeleteClick}
                    onEdit={handleEditClick}
                    onToggleStaffPick={handleToggleStaffPickClick}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
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
    imageId?: Id<"_storage">;
  };
}) {
  const imageUrl = useQuery(
    api.myFunctions.getImageUrl,
    recommendation.imageId ? { imageId: recommendation.imageId } : "skip"
  );

  const genreColors: Record<string, string> = {
    action: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    adventure: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    comedy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    drama: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    horror: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    romance: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    documentary: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
      {recommendation.isStaffPick && (
        <div className="absolute -top-2.5 -right-2.5">
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border-2 border-amber-600">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        {imageUrl && (
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900">
            <img
              src={imageUrl}
              alt={recommendation.title}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        )}
        <div>
          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
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
  onEdit,
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
    imageId?: Id<"_storage">;
  };
  isAdmin: boolean;
  currentUserId: string;
  onDelete: (id: Id<"recommendations">) => void;
  onEdit: (rec: {
    _id: Id<"recommendations">;
    title: string;
    genre: string;
    link: string;
    blurb: string;
    authorId: string;
    authorName: string;
    isStaffPick: boolean;
    imageId?: Id<"_storage">;
    _creationTime?: number;
  }) => void;
  onToggleStaffPick: (id: Id<"recommendations">, currentValue: boolean, title: string) => void;
}) {
  const canDelete = isAdmin || recommendation.authorId === currentUserId;
  const canEdit = isAdmin || recommendation.authorId === currentUserId;
  const imageUrl = useQuery(
    api.myFunctions.getImageUrl,
    recommendation.imageId ? { imageId: recommendation.imageId } : "skip"
  );
  
  const genreColors: Record<string, string> = {
    action: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    adventure: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    comedy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    drama: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    horror: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    romance: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
    documentary: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
      {recommendation.isStaffPick && (
        <div className="absolute -top-2.5 -right-2.5 z-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border-2 border-amber-600">
            <span>⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        {imageUrl && (
          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-900">
            <img
              src={imageUrl}
              alt={recommendation.title}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        )}
        <div>
          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${genreColor} mb-3`}>
            {recommendation.genre}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {recommendation.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              by <span className="font-semibold text-slate-700 dark:text-slate-300">{recommendation.authorName}</span>
            </span>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleStaffPick(recommendation._id, recommendation.isStaffPick, recommendation.title);
                }}
                className={`p-2 rounded-lg transition-all border-2 ${
                  recommendation.isStaffPick
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                    : "bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border-transparent hover:border-amber-300 dark:hover:border-amber-700"
                }`}
                title={recommendation.isStaffPick ? "Remove Staff Pick" : "Mark as Staff Pick"}
              >
                <svg
                  className="w-5 h-5"
                  fill={recommendation.isStaffPick ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(recommendation);
                }}
                className="group p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                title={isAdmin ? "Edit (Admin)" : "Edit Your Recommendation"}
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(recommendation._id);
                }}
                className="group p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all border-2 border-transparent hover:border-red-300 dark:hover:border-red-700"
                title={isAdmin ? "Delete (Admin)" : "Delete Your Recommendation"}
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
