/**
 * HypeShelf Main Page
 * 
 * This is the main application page that displays recommendations
 * and allows authenticated users to create, edit, and delete recommendations.
 * 
 * Features:
 * - Public view for unauthenticated users
 * - Full CRUD operations for authenticated users
 * - Genre filtering
 * - Image uploads
 * - Staff pick management (admin only)
 */

"use client";

import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import { MOVIE_TYPES, VALIDATION_LIMITS, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { getErrorMessage, isAuthError, isAuthorizationError } from "@/lib/error-handling";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center border-2 border-blue-500/30 dark:border-blue-400/30">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 dark:from-blue-400 dark:via-blue-300 dark:to-blue-500 bg-clip-text text-transparent tracking-tight">
                  HypeShelf
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 hidden sm:block font-medium">
                  Collect and share the stuff you&apos;re hyped about
                </p>
              </div>
            </div>
            <div suppressHydrationWarning className="flex items-center gap-3">
              <Unauthenticated>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 hover:from-blue-700 hover:via-blue-700 hover:to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-600 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer">
                    <span>Sign in</span>
                    <span className="text-lg">→</span>
                  </button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <UserProfileDisplay />
              </Authenticated>
            </div>
          </div>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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

function UserProfileDisplay() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <UserButton />
      </div>
    );
  }
  
  if (!user) return null;
  
  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "User";
  
  return (
    <div className="flex items-center gap-3">
      <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Welcome back, <span className="font-bold">{displayName}</span>
        </span>
      </div>
      <UserButton />
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
      >
        Previous
      </button>
      
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-500 dark:text-slate-400">
                ...
              </span>
            );
          }
          
          const pageNum = page as number;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                currentPage === pageNum
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-500"
                  : "text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
      >
        Next
      </button>
    </div>
  );
}

function PublicContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const allRecommendations = useQuery(api.myFunctions.listPublicRecommendations, {
    count: 1000, // Get a large number for pagination
  });

  if (allRecommendations === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-blue-200/50 border-t-blue-600 dark:border-blue-800/50 dark:border-t-blue-400"></div>
        </div>
        <p className="mt-6 text-base font-semibold text-slate-600 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(allRecommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecommendations = allRecommendations.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-500 to-blue-500 dark:from-blue-400 dark:via-blue-400 dark:to-blue-400 mb-2 ring-4 ring-blue-500/10">
          <span className="text-4xl">📚</span>
        </div>
        <h2 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-blue-900 dark:from-slate-50 dark:via-blue-50 dark:to-blue-50 bg-clip-text text-transparent tracking-tight">
          Welcome to HypeShelf
        </h2>
        <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-semibold max-w-2xl mx-auto">
          Collect and share the stuff you&apos;re hyped about
        </p>
      </div>

      {allRecommendations.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 via-blue-100 to-blue-100 dark:from-blue-900/50 dark:via-blue-900/50 dark:to-blue-900/50 mb-6 ring-4 ring-blue-200/30 dark:ring-blue-800/30">
            <span className="text-5xl">📚</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
            No recommendations yet
          </h3>
          <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-8">
            Be the first to share something you&apos;re hyped about!
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 hover:from-blue-700 hover:via-blue-700 hover:to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-600 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer">
              <span>Get Started</span>
              <span className="text-lg">→</span>
            </button>
          </SignInButton>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedRecommendations.map((rec) => (
              <RecommendationCard key={rec._id} recommendation={rec} />
            ))}
          </div>
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function AuthenticatedContent() {
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
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
  const [editImageRemoved, setEditImageRemoved] = useState(false);
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
  
  const allRecommendations = data?.recommendations || [];
  
  // Calculate pagination
  const totalPages = Math.ceil(allRecommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const recommendations = allRecommendations.slice(startIndex, endIndex);
  
  // Reset to page 1 when genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre]);
  
  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  const editingRec = editingRecommendation 
    ? allRecommendations.find((r) => r._id === editingRecommendation)
    : null;
  const editImageUrl = useQuery(
    api.myFunctions.getImageUrl,
    editingRec?.imageId ? { imageId: editingRec.imageId } : "skip"
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (file) {
      // Validate file type using constants
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        setImageError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        e.target.value = "";
        return;
      }
      
      // Validate file size using constants
      if (file.size > VALIDATION_LIMITS.IMAGE_MAX_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (VALIDATION_LIMITS.IMAGE_MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        setImageError(`Image size is ${fileSizeMB}MB. Maximum allowed size is ${maxSizeMB}MB. Please choose a smaller image.`);
        e.target.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Validate dimensions using constants
          if (img.width > VALIDATION_LIMITS.IMAGE_MAX_WIDTH || img.height > VALIDATION_LIMITS.IMAGE_MAX_HEIGHT) {
            setImageError(
              `Image dimensions are ${img.width}x${img.height}px. ` +
              `Maximum allowed dimensions are ${VALIDATION_LIMITS.IMAGE_MAX_WIDTH}x${VALIDATION_LIMITS.IMAGE_MAX_HEIGHT}px. ` +
              `Please choose a smaller image.`
            );
            e.target.value = "";
            setSelectedImage(null);
            setImagePreview(null);
            return;
          }
          
          setSelectedImage(file);
          setImagePreview(reader.result as string);
          setImageError(null);
        };
        img.onerror = () => {
          setImageError("Invalid image file. Please choose a valid image.");
          e.target.value = "";
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (data: { title: string; genre: string; link: string; blurb: string }) => {
    const errors: { title?: string; genre?: string; link?: string; blurb?: string } = {};

    if (!data.title.trim()) {
      errors.title = "Title is required";
    } else if (data.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters";
    } else if (data.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    if (!data.genre) {
      errors.genre = "Please select a genre";
    }

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

      await createRec({
        ...formData,
        imageId,
      });

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
      console.error("Error deleting recommendation:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to delete recommendation. Please try again."
      );
      
      if (isAuthError(error)) {
        alert("Please sign in to delete recommendations.");
      } else if (isAuthorizationError(error)) {
        alert("You can only delete your own recommendations.");
      } else {
        alert(errorMessage);
      }
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
    setEditImageRemoved(false);
  };

  const handleEditCancel = () => {
    setEditingRecommendation(null);
    setEditFormData({ title: "", genre: "", link: "", blurb: "" });
    setEditFormErrors({});
    setEditSelectedImage(null);
    setEditImagePreview(null);
    setEditImageError(null);
    setEditImageRemoved(false);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setEditImageError(null);
    
    if (file) {
      // Validate file type using constants
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        setEditImageError("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        e.target.value = "";
        return;
      }
      
      // Validate file size using constants
      if (file.size > VALIDATION_LIMITS.IMAGE_MAX_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (VALIDATION_LIMITS.IMAGE_MAX_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        setEditImageError(`Image size is ${fileSizeMB}MB. Maximum allowed size is ${maxSizeMB}MB. Please choose a smaller image.`);
        e.target.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Validate dimensions using constants
          if (img.width > VALIDATION_LIMITS.IMAGE_MAX_WIDTH || img.height > VALIDATION_LIMITS.IMAGE_MAX_HEIGHT) {
            setEditImageError(
              `Image dimensions are ${img.width}x${img.height}px. ` +
              `Maximum allowed dimensions are ${VALIDATION_LIMITS.IMAGE_MAX_WIDTH}x${VALIDATION_LIMITS.IMAGE_MAX_HEIGHT}px. ` +
              `Please choose a smaller image.`
            );
            e.target.value = "";
            setEditSelectedImage(null);
            setEditImagePreview(null);
            return;
          }
          
          setEditSelectedImage(file);
          setEditImagePreview(reader.result as string);
          setEditImageError(null);
          setEditImageRemoved(false);
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

      if (editSelectedImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": editSelectedImage.type },
          body: editSelectedImage,
        });
        const response = await result.json();
        imageId = response.storageId as Id<"_storage">;
      } else if (!editImageRemoved && currentRec?.imageId) {
        imageId = currentRec.imageId;
      }

      await updateRec({
        recommendationId: editingRecommendation,
        ...editFormData,
        imageId,
      });

      setEditFormErrors({});
      handleEditCancel();
    } catch (error) {
      console.error("Error updating recommendation:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to update recommendation. Please try again."
      );
      
      if (isAuthError(error)) {
        alert("Please sign in to update recommendations.");
      } else if (isAuthorizationError(error)) {
        alert("You can only update your own recommendations.");
      } else {
        alert(errorMessage);
      }
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
      console.error("Error toggling staff pick:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to update staff pick status. Please try again."
      );
      
      if (isAuthError(error)) {
        alert("Please sign in to manage staff picks.");
      } else if (isAuthorizationError(error)) {
        alert("Only admins can mark recommendations as staff picks.");
      } else {
        alert(errorMessage);
      }
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
      <div className="flex flex-col items-center justify-center py-32">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-blue-200/50 border-t-blue-600 dark:border-blue-800/50 dark:border-t-blue-400"></div>
        </div>
        <p className="mt-6 text-base font-semibold text-slate-600 dark:text-slate-400">Loading recommendations...</p>
      </div>
    );
  }

  const currentUserId = data.currentUserId || "";
  const userRole = data.userRole || "user";
  const isAdmin = userRole === "admin";
  const allGenres = ["all", ...MOVIE_TYPES];

  return (
    <>
      {deleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleDeleteCancel}
        >
          <div 
            className="bg-white dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60  max-w-md w-full p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 flex items-center justify-center  ring-4 ring-red-200/30 dark:ring-red-800/30">
                <svg
                  className="w-7 h-7 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                  Delete Recommendation
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to delete this recommendation? This will permanently remove it from HypeShelf.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/90 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {staffPickModalOpen && recommendationForStaffPick && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleToggleStaffPickCancel}
        >
          <div 
            className="bg-white dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60  max-w-md w-full p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 flex items-center justify-center  ring-4 ring-amber-200/30 dark:ring-amber-800/30">
                <span className="text-3xl">⭐</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                  {recommendationForStaffPick.currentValue ? "Remove Staff Pick" : "Mark as Staff Pick"}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                  Featured content management
                </p>
              </div>
            </div>
            <p className="text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {recommendationForStaffPick.currentValue 
                ? `Are you sure you want to remove the Staff Pick status from "${recommendationForStaffPick.title}"?`
                : `Are you sure you want to mark "${recommendationForStaffPick.title}" as a Staff Pick? This will highlight it as a featured recommendation.`}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleToggleStaffPickCancel}
                disabled={togglingStaffPick}
                className="flex-1 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/90 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStaffPickConfirm}
                disabled={togglingStaffPick}
                className="flex-1 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 dark:hover:from-amber-500 dark:hover:via-yellow-500 dark:hover:to-amber-600 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                {togglingStaffPick 
                  ? (recommendationForStaffPick.currentValue ? "Removing..." : "Marking...") 
                  : (recommendationForStaffPick.currentValue ? "Remove Staff Pick" : "Mark as Staff Pick")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRecommendation && editingRec ? (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200/60 dark:border-slate-800/60">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 dark:from-blue-400 dark:via-blue-400 dark:to-blue-400 bg-clip-text text-transparent tracking-tight mb-2">
                Edit Recommendation
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Update your recommendation details
              </p>
            </div>
            <button
              type="button"
              onClick={handleEditCancel}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/90 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer"
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
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to List</span>
            </button>
          </div>

          <form
            onSubmit={handleEditSubmit}
            className="bg-white dark:bg-slate-800/95 backdrop-blur-xl p-8 rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60   dark:0"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 dark:from-blue-400 dark:via-blue-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
                Edit Recommendation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Update your recommendation details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                  className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                    editFormErrors.title
                      ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                  }`}
                  required
                />
                {editFormErrors.title && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFormErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                  className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                    editFormErrors.genre
                      ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
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
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFormErrors.genre}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                  className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                    editFormErrors.link
                      ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                  }`}
                  required
                />
                {editFormErrors.link && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFormErrors.link}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Short Blurb <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Tell us why you're hyped about this..."
                  value={editFormData.blurb}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, blurb: e.target.value });
                    if (editFormErrors.blurb) {
                      setEditFormErrors({ ...editFormErrors, blurb: undefined });
                    }
                  }}
                  className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium min-h-[80px] resize-y ${
                    editFormErrors.blurb
                      ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                  }`}
                  required
                />
                {editFormErrors.blurb && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{editFormErrors.blurb}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Movie Picture <span className="text-xs font-normal text-slate-500">(Optional, max 2MB)</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleEditImageChange}
                  className="w-full px-4 py-3 text-sm rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
                {editImageError && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-700 dark:text-red-400">{editImageError}</p>
                  </div>
                )}
                {(editImagePreview || (editImageUrl && !editSelectedImage && !editImageRemoved)) && !editImageError && (
                  <div className="relative group mt-2">
                    <div className="w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700  bg-slate-100 dark:bg-slate-900">
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
                        setEditImageRemoved(true);
                        const fileInput = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                    {editSelectedImage && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded backdrop-blur-sm">
                        {(editSelectedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    )}
                    {!editSelectedImage && editImageUrl && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded backdrop-blur-sm">
                        Current
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={updating}
                  className="flex-1 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/90 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 hover:from-blue-700 hover:via-blue-700 hover:to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-600 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {updating ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            <div className="flex justify-end">
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
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 hover:from-blue-700 hover:via-blue-700 hover:to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-600 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <span className="text-base">{showAddForm ? "✕" : "+"}</span>
                <span>{showAddForm ? "Cancel" : "Add Recommendation"}</span>
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-800/95 backdrop-blur-xl p-8 rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60   dark:0"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 dark:from-blue-400 dark:via-blue-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
                    Add New Recommendation
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Share something amazing with the community</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                      className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                        formErrors.title
                          ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      }`}
                      required
                    />
                    {formErrors.title && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                      className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                        formErrors.genre
                          ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
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
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.genre}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                      className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium ${
                        formErrors.link
                          ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      }`}
                      required
                    />
                    {formErrors.link && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.link}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Short Blurb <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Tell us why you're hyped about this..."
                      value={formData.blurb}
                      onChange={(e) => {
                        setFormData({ ...formData, blurb: e.target.value });
                        if (formErrors.blurb) {
                          setFormErrors({ ...formErrors, blurb: undefined });
                        }
                      }}
                      className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none font-medium min-h-[80px] resize-y ${
                        formErrors.blurb
                          ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                      }`}
                      required
                    />
                    {formErrors.blurb && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.blurb}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Movie Picture <span className="text-xs font-normal text-slate-500">(Optional, max 2MB)</span>
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="w-full px-4 py-3 text-sm rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                    />
                    {imageError && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-700 dark:text-red-400">{imageError}</p>
                      </div>
                    )}
                    {imagePreview && !imageError && (
                      <div className="relative group mt-2">
                        <div className="w-full max-w-xs aspect-[4/3] rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700  bg-slate-100 dark:bg-slate-900">
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
                          className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                        {selectedImage && (
                          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded backdrop-blur-sm">
                            {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 hover:from-blue-700 hover:via-blue-700 hover:to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-blue-600 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {uploading ? "Uploading..." : "Submit Recommendation"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {!showAddForm && (
              <>
                <div className="flex flex-wrap gap-2.5">
                  {allGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                        selectedGenre === genre
                          ? "bg-gradient-to-r from-blue-600 via-blue-600 to-blue-600 text-white   dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 ring-2 ring-blue-400/30 transform scale-105"
                          : "bg-white dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 hover:to-blue-50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20 dark:hover:to-blue-900/20"
                      }`}
                    >
                      {genre === "all" ? "All" : genre}
                    </button>
                  ))}
                </div>

                {recommendations.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 via-blue-100 to-blue-100 dark:from-blue-900/50 dark:via-blue-900/50 dark:to-blue-900/50 mb-6   ring-4 ring-blue-200/30 dark:ring-blue-800/30">
                      <span className="text-5xl">📚</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-3">
                      {selectedGenre === "all" ? "No recommendations yet" : `No ${selectedGenre} recommendations`}
                    </h3>
                    <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                      {selectedGenre === "all" 
                        ? "Be the first to share something you&apos;re hyped about!"
                        : `Try a different genre or add the first ${selectedGenre} recommendation!`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {recommendations.map((rec: typeof allRecommendations[0]) => (
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
                    {totalPages > 1 && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </>
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
    action: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700",
    adventure: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    comedy: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700",
    drama: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    horror: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 border-2 border-red-300 dark:border-red-700",
    romance: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 dark:from-pink-900/40 dark:to-rose-900/40 dark:text-pink-300 border-2 border-pink-300 dark:border-pink-700",
    documentary: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    sports: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300 border-2 border-green-300 dark:border-green-700",
    biopic: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-300 border-2 border-violet-300 dark:border-violet-700",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600";

  return (
    <div className="group relative bg-white dark:bg-slate-800/95 p-6 rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500  hover: hover: dark:hover: transition-all duration-300 overflow-hidden backdrop-blur-sm hover:-translate-y-2">
      {recommendation.isStaffPick && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl   ring-2 ring-amber-300/50">
            <span className="text-sm">⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200/40 dark:border-slate-700/40 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300  group-hover:">
          <img
            src={imageUrl || "/no-image.png"}
            alt={recommendation.title}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 ${genreColor} `}>
              {recommendation.genre}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline decoration-2 underline-offset-2"
            >
              {recommendation.title}
            </a>
          </h3>
        </div>
        
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center gap-2.5 pt-4 border-t-2 border-slate-200/60 dark:border-slate-700/60">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-600 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 flex items-center justify-center text-white font-extrabold text-sm   flex-shrink-0 ring-2 ring-blue-400/30">
            {recommendation.authorName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
            by <span className="font-bold text-slate-800 dark:text-slate-200">{recommendation.authorName}</span>
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
  const canDelete = isAdmin || recommendation.authorId === currentUserId; // Admins can delete any, users can delete their own
  const canEdit = isAdmin || recommendation.authorId === currentUserId; // Admins can edit any, users can edit their own
  const imageUrl = useQuery(
    api.myFunctions.getImageUrl,
    recommendation.imageId ? { imageId: recommendation.imageId } : "skip"
  );
  
  const genreColors: Record<string, string> = {
    action: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700",
    adventure: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    comedy: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700",
    drama: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    horror: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 border-2 border-red-300 dark:border-red-700",
    romance: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 dark:from-pink-900/40 dark:to-rose-900/40 dark:text-pink-300 border-2 border-pink-300 dark:border-pink-700",
    documentary: "bg-gradient-to-r from-blue-100 to-blue-100 text-blue-800 dark:from-blue-900/40 dark:to-blue-900/40 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700",
    sports: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300 border-2 border-green-300 dark:border-green-700",
    biopic: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-300 border-2 border-violet-300 dark:border-violet-700",
  };

  const genreKey = recommendation.genre.toLowerCase();
  const genreColor = genreColors[genreKey] || "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600";

  return (
    <div className="group relative bg-white dark:bg-slate-800/95 p-6 rounded-3xl border-2 border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500  hover: hover: dark:hover: transition-all duration-300 overflow-hidden backdrop-blur-sm hover:-translate-y-2">
      {recommendation.isStaffPick && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl   ring-2 ring-amber-300/50">
            <span className="text-sm">⭐</span>
            <span>Staff Pick</span>
          </span>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200/40 dark:border-slate-700/40 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300  group-hover:">
          <img
            src={imageUrl || "/no-image.png"}
            alt={recommendation.title}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 ${genreColor} `}>
              {recommendation.genre}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            <a
              href={recommendation.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline decoration-2 underline-offset-2"
            >
              {recommendation.title}
            </a>
          </h3>
        </div>
        
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3 font-medium">
          {recommendation.blurb}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-600 dark:from-blue-500 dark:via-blue-500 dark:to-blue-500 flex items-center justify-center text-white font-extrabold text-sm   flex-shrink-0 ring-2 ring-blue-400/30">
              {recommendation.authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
              by <span className="font-bold text-slate-800 dark:text-slate-200">{recommendation.authorName}</span>
            </span>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleStaffPick(recommendation._id, recommendation.isStaffPick, recommendation.title);
                }}
                className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  recommendation.isStaffPick
                    ? "bg-gradient-to-br from-amber-200 to-yellow-200 dark:from-amber-800/60 dark:to-yellow-800/60 text-amber-700 dark:text-amber-300 border-2 border-amber-400/60 dark:border-amber-600/60 ring-2 ring-amber-300/30"
                    : "bg-white dark:bg-slate-700/90 hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 dark:hover:from-amber-900/40 dark:hover:to-yellow-900/20 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 border-2 border-slate-200 dark:border-slate-600 hover:border-amber-400/60 dark:hover:border-amber-600/60"
                }`}
                title={recommendation.isStaffPick ? "Remove Staff Pick" : "Mark as Staff Pick"}
              >
                <svg
                  className="w-4 h-4"
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
                className="group p-2.5 rounded-xl bg-white dark:bg-slate-700/90 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/40 dark:hover:to-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400/60 dark:hover:border-blue-600/60 cursor-pointer"
                title="Edit recommendation"
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:scale-110"
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
                className="group p-2.5 rounded-xl bg-white dark:bg-slate-700/90 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/40 dark:hover:to-pink-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 border-2 border-slate-200 dark:border-slate-600 hover:border-red-400/60 dark:hover:border-red-600/60 cursor-pointer"
                title="Delete recommendation"
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:scale-110"
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
