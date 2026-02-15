const imageWrapper = document.querySelector(".images");
const searchInput = document.querySelector(".search-container input");
const loadMoreBtn = document.querySelector(".load-more");
const loadMoreWrapper = document.querySelector(".load-more-wrapper");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxVideo = lightbox.querySelector(".lightbox-video");
const downloadImgBtn = lightbox.querySelector(".download-btn");
const favoriteBtn = lightbox.querySelector(".favorite-btn");
const closeImgBtn = lightbox.querySelector(".close-icon");
const toggleButton = document.getElementById("toggleButton");
const themeToggle = document.getElementById("themeToggle");
const collectionToggle = document.getElementById("collectionToggle");
const homeLink = document.getElementById("homeLink");
const searchSuggestions = document.querySelector(".search-suggestions");
const searchClearBtn = document.querySelector(".search-clear");
const gridBtns = document.querySelectorAll(".grid-btn");
const scrollTopBtn = document.querySelector(".scroll-top");
const galleryContext = document.querySelector(".gallery-context");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const shareBtn = lightbox.querySelector(".share-btn");
const copyLinkBtn = lightbox.querySelector(".copy-link-btn");
const zoomBtn = lightbox.querySelector(".zoom-btn");
const lightboxCounter = lightbox.querySelector(".lightbox-counter");

const apiKey = "KQLQ1rv8kErAhw9O37XwDW7vS82wYf6yKeW9gqfocoAOsRxuq1BnGGFU";
const perPage = 12;
let currentPage = 1;
let searchTerm = null;
let isVideoGallery = false;
let isCollectionView = false;
let currentLightboxItem = null;
let currentLightboxIndex = -1;
let galleryItems = [];
let searchDebounceTimer = null;

// Trending / popular search terms
const TRENDING_QUERIES = [
  'nature', 'sunset', 'city', 'people', 'animals', 'food', 'travel', 'mountains',
  'ocean', 'flowers', 'forest', 'sky', 'abstract', 'minimal', 'architecture',
  'portrait', 'landscape', 'coffee', 'technology', 'space', 'beach'
];

// Recent searches (max 8)
const getRecentSearches = () => {
  const stored = localStorage.getItem("recentSearches");
  return stored ? JSON.parse(stored) : [];
};

const addRecentSearch = (term) => {
  if (!term || term.length < 2) return;
  let recent = getRecentSearches().filter(t => t.toLowerCase() !== term.toLowerCase());
  recent.unshift(term);
  recent = recent.slice(0, 8);
  localStorage.setItem("recentSearches", JSON.stringify(recent));
};

const getRandomQuery = () => {
  return TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
};

// Toast notifications
const showToast = (message, type = "success") => {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

// Initialize theme
const initTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.innerHTML = savedTheme === "dark"
    ? '<i class="uil uil-sun"></i>'
    : '<i class="uil uil-moon"></i>';
};

// Get collection from localStorage
const getCollection = () => {
  const collection = localStorage.getItem("mediaCollection");
  return collection ? JSON.parse(collection) : [];
};

const updateCollectionCount = () => {
  const collection = getCollection();
  let countBadge = collectionToggle.querySelector('.collection-count');

  if (!countBadge) {
    countBadge = document.createElement('span');
    countBadge.className = 'collection-count';
    collectionToggle.appendChild(countBadge);
  }

  countBadge.textContent = collection.length;
  countBadge.style.display = collection.length > 0 ? "flex" : "none";
};

const saveToCollection = (item) => {
  const collection = getCollection();
  if (!collection.some(i => String(i.id) === String(item.id))) {
    collection.push(item);
    localStorage.setItem("mediaCollection", JSON.stringify(collection));
    updateCollectionCount();
    return true;
  }
  return false;
};

const removeFromCollection = (id) => {
  const collection = getCollection().filter(item => String(item.id) !== String(id));
  localStorage.setItem("mediaCollection", JSON.stringify(collection));
  updateCollectionCount();
};

const isInCollection = (id) => {
  return getCollection().some(item => String(item.id) === String(id));
};

const downloadMedia = (url) => {
  showToast("Download starting...");
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement("a");
      const extension = url.split('.').pop().split('?')[0] || 'jpg';
      a.href = URL.createObjectURL(blob);
      a.download = `captures-${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Download started!");
    })
    .catch(() => showToast("Download failed. Try again.", "error"));
};

// Normalize API or stored item to standard format for gallery
const normalizeItem = (item, isVideo = false) => {
  const isVid = isVideo || item.type === "video";
  if (isVid) {
    const videoSrc = item.videoUrl || (item.video_files && item.video_files[0]?.link);
    const videoThumbnail = item.image || item.videoThumbnail;
    const photographer = item.user?.name || item.photographer || "Unknown";
    return {
      id: item.id || Math.random().toString(36).substr(2, 9),
      type: "video",
      mediaUrl: videoSrc,
      thumbnail: videoThumbnail,
      photographer,
      raw: item
    };
  } else {
    const imgSrc = item.src?.large2x || item.src?.original || item.imageUrl;
    return {
      id: item.id || Math.random().toString(36).substr(2, 9),
      type: "image",
      mediaUrl: imgSrc,
      thumbnail: imgSrc,
      photographer: item.photographer || "Unknown",
      raw: item
    };
  }
};

const showLightbox = (name, mediaUrl, isVideo = false, itemData = null, index = -1) => {
  currentLightboxIndex = index >= 0 ? index : galleryItems.findIndex(i =>
    (i.mediaUrl === mediaUrl || (i.photographer === name && i.type === (isVideo ? "video" : "image"))));
  if (currentLightboxIndex < 0 && galleryItems.length > 0) currentLightboxIndex = 0;

  const photographerName = lightbox.querySelector(".photographer-name");
  photographerName.textContent = name;

  if (itemData) {
    currentLightboxItem = typeof itemData === 'object' ? itemData : {
      id: itemData.id, type: itemData.type || (isVideo ? "video" : "image"),
      mediaUrl, photographer: name, imageUrl: mediaUrl, videoUrl: isVideo ? mediaUrl : null
    };
    favoriteBtn.classList.toggle("active", isInCollection(currentLightboxItem.id));
  }

  if (galleryItems.length > 0 && currentLightboxIndex >= 0) {
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${galleryItems.length}`;
    lightboxCounter.style.display = "inline";
    lightboxPrev.style.display = galleryItems.length > 1 ? "flex" : "none";
    lightboxNext.style.display = galleryItems.length > 1 ? "flex" : "none";
  } else {
    lightboxCounter.style.display = "none";
    lightboxPrev.style.display = "none";
    lightboxNext.style.display = "none";
  }

  if (isVideo) {
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "block";
    lightboxVideo.src = mediaUrl;
    lightboxVideo.classList.add("visible");
    lightboxImage.classList.remove("visible");
    zoomBtn.style.display = "none";
  } else {
    lightboxVideo.style.display = "none";
    lightboxImage.style.display = "block";
    lightboxImage.src = mediaUrl;
    lightboxImage.classList.add("visible");
    lightboxVideo.classList.remove("visible");
    zoomBtn.style.display = "flex";
    const img = new Image();
    img.src = mediaUrl;
    img.onload = function () {
      lightboxImage.style.maxHeight = this.height > this.width ? "70vh" : "auto";
      lightboxImage.style.maxWidth = this.height > this.width ? "auto" : "80vw";
    };
  }

  downloadImgBtn.setAttribute("data-media", mediaUrl);
  lightbox.classList.add("show");
  document.body.style.overflow = "hidden";
  lightbox.focus();
};

const hideLightbox = () => {
  lightbox.classList.remove("show");
  document.body.style.overflow = "auto";
  lightboxVideo.pause();
  lightboxVideo.src = "";
  currentLightboxItem = null;
  currentLightboxIndex = -1;
  if (lightboxImage.classList.contains("zoomed")) {
    lightboxImage.classList.remove("zoomed");
  }
};

const navigateLightbox = (direction) => {
  if (galleryItems.length < 2) return;
  let next = currentLightboxIndex + direction;
  if (next < 0) next = galleryItems.length - 1;
  if (next >= galleryItems.length) next = 0;
  currentLightboxIndex = next;
  const item = galleryItems[next];
  showLightbox(item.photographer, item.mediaUrl, item.type === "video", item, next);
};

const toggleFavorite = () => {
  if (!currentLightboxItem) return;
  if (isInCollection(currentLightboxItem.id)) {
    removeFromCollection(currentLightboxItem.id);
    favoriteBtn.classList.remove("active");
    showToast("Removed from collection");
  } else {
    if (saveToCollection(currentLightboxItem)) {
      favoriteBtn.classList.add("active");
      showToast("Added to collection!");
    }
  }
};

const toggleZoom = () => {
  if (lightboxImage.classList.contains("visible")) {
    lightboxImage.classList.toggle("zoomed");
  }
};

const copyMediaLink = () => {
  const url = downloadImgBtn.getAttribute("data-media");
  if (url && navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast("Link copied!")).catch(() => showToast("Could not copy", "error"));
  }
};

const shareMedia = async () => {
  const url = downloadImgBtn.getAttribute("data-media");
  if (!url) return;
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Captures.io",
        url: window.location.href,
        text: `Check out this ${currentLightboxItem?.type === "video" ? "video" : "image"} from Captures.io`
      });
      showToast("Shared!");
    } catch (e) {
      if (e.name !== "AbortError") copyMediaLink();
    }
  } else {
    copyMediaLink();
  }
};

// Skeleton loader HTML
const getSkeletonHTML = (count = 6) => {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `<div class="card skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-details">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>`;
  }
  return html;
};

const generateHTML = (items, append = false) => {
  const fragment = document.createDocumentFragment();

  if (items.length === 0 && !append) {
    if (imageWrapper.children.length === 0) {
      const noResults = document.createElement("p");
      noResults.className = "no-results";
      noResults.innerHTML = `
        No items found${searchTerm ? ` for "${searchTerm}"` : ""}.<br>
        <span class="related-hint">Try: ${TRENDING_QUERIES.slice(0, 5).map(q =>
        `<button class="related-chip" data-query="${q}">${q}</button>`).join(" ")}</span>`;
      imageWrapper.innerHTML = "";
      imageWrapper.appendChild(noResults);
    }
    return;
  }

  const newNormItems = items.map(i => normalizeItem(i, isCollectionView ? i.type === "video" : (isVideoGallery || i.type === "video")));
  if (append) {
    galleryItems = galleryItems.concat(newNormItems);
  } else {
    galleryItems = newNormItems;
  }

  items.forEach((item, idx) => {
    const norm = newNormItems[idx];
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = idx;

    if (norm.type === "video") {
      card.innerHTML = `
        <div class="video-wrapper">
          <video class="card-video" poster="${norm.thumbnail}" preload="metadata">
            <source src="${norm.mediaUrl}" type="video/mp4">
          </video>
          <div class="play-overlay"><i class="uil uil-play-circle"></i></div>
        </div>
        <div class="details">
          <div class="photographer">
            <i class="uil uil-camera"></i>
            <span>${norm.photographer}</span>
          </div>
          <div class="card-actions">
            <button class="download-btn" title="Download"><i class="uil uil-import"></i></button>
            ${isCollectionView ? `<button class="remove-btn" title="Remove"><i class="uil uil-trash-alt"></i></button>` : ""}
          </div>
        </div>`;
    } else {
      card.innerHTML = `
        <img loading="lazy" src="${norm.thumbnail}" alt="${norm.photographer}" class="card-img">
        <div class="details">
          <div class="photographer">
            <i class="uil uil-camera"></i>
            <span>${norm.photographer}</span>
          </div>
          <div class="card-actions">
            <button class="download-btn" title="Download"><i class="uil uil-import"></i></button>
            ${isCollectionView ? `<button class="remove-btn" title="Remove"><i class="uil uil-trash-alt"></i></button>` : ""}
          </div>
        </div>`;
    }

    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const itemData = { id: norm.id, type: norm.type, imageUrl: norm.mediaUrl, videoUrl: norm.type === "video" ? norm.mediaUrl : null, photographer: norm.photographer };
      const globalIdx = append ? galleryItems.length - items.length + idx : idx;
      showLightbox(norm.photographer, norm.mediaUrl, norm.type === "video", itemData, globalIdx);
    });

    const dlBtn = card.querySelector(".download-btn");
    if (dlBtn) dlBtn.addEventListener("click", (e) => { e.stopPropagation(); downloadMedia(norm.mediaUrl); });

    const rmBtn = card.querySelector(".remove-btn");
    if (rmBtn) rmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromCollection(norm.id);
      card.remove();
      galleryItems = galleryItems.filter((_, i) => i !== idx);
    });

    if (norm.type === "video") {
      const video = card.querySelector(".card-video");
      card.addEventListener("mouseenter", () => { video.play().catch(() => {}); });
      card.addEventListener("mouseleave", () => { video.pause(); video.currentTime = 0; });
    }

    fragment.appendChild(card);
  });

  imageWrapper.appendChild(fragment);
};

const buildApiUrl = (page, query, sort = "relevant") => {
  const p = page || 1;
  const hasQuery = query && String(query).trim().length > 0;
  const q = hasQuery ? encodeURIComponent(query.trim()) : encodeURIComponent(getRandomQuery());
  if (isVideoGallery) {
    return hasQuery
      ? `https://api.pexels.com/videos/search?query=${q}&page=${p}&per_page=${perPage}`
      : `https://api.pexels.com/videos/search?query=${q}&page=${p}&per_page=${perPage}`;
  } else {
    return hasQuery
      ? `https://api.pexels.com/v1/search?query=${q}&page=${p}&per_page=${perPage}`
      : `https://api.pexels.com/v1/search?query=${q}&page=${p}&per_page=${perPage}`;
  }
};

const getItems = (apiURL, append = false) => {
  if (isCollectionView) {
    if (loadMoreWrapper) loadMoreWrapper.style.display = "none";
    const collection = getCollection();
    galleryItems = collection.map(i => normalizeItem(i, i.type === "video"));
    if (!append) imageWrapper.innerHTML = "";
    generateHTML(collection, false);
    updateGalleryContext();
    return;
  }

  if (loadMoreWrapper) loadMoreWrapper.style.display = "flex";
  if (!append) {
    imageWrapper.innerHTML = getSkeletonHTML(9);
  }
  loadMoreBtn.innerText = "Loading...";
  loadMoreBtn.classList.add("disabled");

  fetch(apiURL, { headers: { Authorization: apiKey } })
    .then(res => {
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const items = isVideoGallery ? (data.videos || []) : (data.photos || []);
      if (!append) {
        imageWrapper.innerHTML = "";
        galleryItems = [];
      }
      generateHTML(items, append);
      loadMoreBtn.innerText = "Load More";
      loadMoreBtn.classList.remove("disabled");
      updateGalleryContext();
    })
    .catch((err) => {
      console.error(err);
      if (!append) imageWrapper.innerHTML = `<p class="error-message">Failed to load. Check your connection and try again.</p>`;
      loadMoreBtn.innerText = "Load More";
      loadMoreBtn.classList.remove("disabled");
      showToast("Failed to load. Try again.", "error");
    });
};

const updateGalleryContext = () => {
  if (!galleryContext) return;
  if (isCollectionView) {
    galleryContext.textContent = `Your collection · ${galleryItems.length} items`;
  } else {
    const media = isVideoGallery ? "Videos" : "Photos";
    galleryContext.textContent = searchTerm ? `${media} for "${searchTerm}"` : `Featured ${media}`;
  }
};

const loadInitialOrSearch = (query = null, append = false) => {
  if (!append) {
    currentPage = 1;
    searchTerm = query !== null ? (query || null) : searchTerm;
    if (query !== null) {
      searchInput.value = query || "";
      searchClearBtn?.classList.toggle("visible", (query || "").length > 0);
    }
    imageWrapper.innerHTML = "";
  }
  const url = buildApiUrl(currentPage, searchTerm || undefined);
  getItems(url, append);
};

const loadMoreItems = () => {
  currentPage++;
  const url = buildApiUrl(currentPage, searchTerm || undefined);
  getItems(url, true);
};

const performSearch = (term) => {
  const t = (term || searchInput?.value || "").trim();
  if (!t) return;
  addRecentSearch(t);
  searchSuggestions.classList.remove("show");
  loadInitialOrSearch(t, false);
};

// Search suggestions & trending chips
const renderSearchSuggestions = () => {
  const recent = getRecentSearches();
  const val = (searchInput?.value || "").trim().toLowerCase();
  if (!val) {
    if (recent.length === 0) {
      searchSuggestions.classList.remove("show");
      return;
    }
    searchSuggestions.innerHTML = `<div class="suggestion-label">Recent</div>` +
      recent.map(r => `<button class="suggestion-item" data-query="${r.replace(/"/g, '&quot;')}">${r}</button>`).join("");
  } else {
    const filtered = TRENDING_QUERIES.filter(q => q.toLowerCase().includes(val)).slice(0, 5);
    if (filtered.length === 0) {
      searchSuggestions.innerHTML = `<button class="suggestion-item" data-query="${val}">Search "${val}"</button>`;
    } else {
      searchSuggestions.innerHTML = filtered.map(q =>
        `<button class="suggestion-item" data-query="${q}">${q}</button>`).join("");
    }
  }
  searchSuggestions.classList.add("show");
};

const toggleGallery = () => {
  if (isCollectionView) return;
  isVideoGallery = !isVideoGallery;
  searchTerm = null;
  searchInput.value = "";
  searchClearBtn?.classList.remove("visible");
  toggleButton.innerHTML = `<i class="uil uil-exchange"></i><span>Switch to ${isVideoGallery ? 'Images' : 'Videos'}</span>`;
  loadInitialOrSearch(null, false);
};

const toggleCollectionView = () => {
  isCollectionView = !isCollectionView;
  collectionToggle.classList.toggle("active", isCollectionView);
  if (isCollectionView) {
    searchTerm = null;
    searchInput.value = "";
    imageWrapper.innerHTML = "";
    getItems();
  } else {
    resetGallery();
  }
};

const resetGallery = () => {
  isCollectionView = false;
  collectionToggle.classList.remove("active");
  currentPage = 1;
  searchTerm = null;
  searchInput.value = "";
  searchClearBtn?.classList.remove("visible");
  imageWrapper.innerHTML = "";
  const randomQuery = getRandomQuery();
  getItems(buildApiUrl(1, randomQuery), false);
};

// Grid size (2 or 3 columns, default 3)
const setGridColumns = (cols) => {
  document.documentElement.style.setProperty("--grid-cols", cols);
  gridBtns?.forEach(b => b.classList.toggle("active", parseInt(b.dataset.cols) === cols));
  localStorage.setItem("gridCols", String(cols));
};

// Scroll to top
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Event listeners
if (loadMoreBtn) loadMoreBtn.addEventListener("click", loadMoreItems);

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchClearBtn?.classList.toggle("visible", searchInput.value.length > 0);
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(renderSearchSuggestions, 150);
  });
  searchInput.addEventListener("focus", renderSearchSuggestions);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      performSearch(searchInput.value.trim());
    } else if (e.key === "Escape") {
      searchSuggestions.classList.remove("show");
      searchInput.blur();
    }
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) searchSuggestions?.classList.remove("show");
});

if (searchSuggestions) {
  searchSuggestions.addEventListener("click", (e) => {
    const btn = e.target.closest(".suggestion-item");
    if (btn) performSearch(btn.dataset.query);
  });
}

document.querySelector(".images")?.addEventListener("click", (e) => {
  const related = e.target.closest(".related-chip");
  if (related) performSearch(related.dataset.query);
});

if (searchClearBtn) {
  searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchClearBtn.classList.remove("visible");
    searchSuggestions.classList.remove("show");
    searchInput.focus();
  });
}

gridBtns?.forEach(btn => btn.addEventListener("click", () => setGridColumns(parseInt(btn.dataset.cols))));

if (scrollTopBtn) scrollTopBtn.addEventListener("click", scrollToTop);

window.addEventListener("scroll", () => {
  scrollTopBtn?.classList.toggle("visible", window.scrollY > 400);
});

closeImgBtn?.addEventListener("click", hideLightbox);
favoriteBtn?.addEventListener("click", toggleFavorite);
zoomBtn?.addEventListener("click", toggleZoom);
copyLinkBtn?.addEventListener("click", copyMediaLink);
shareBtn?.addEventListener("click", shareMedia);

downloadImgBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  downloadMedia(e.target.closest("button").dataset.media);
});

lightboxPrev?.addEventListener("click", (e) => { e.stopPropagation(); navigateLightbox(-1); });
lightboxNext?.addEventListener("click", (e) => { e.stopPropagation(); navigateLightbox(1); });

toggleButton?.addEventListener("click", toggleGallery);
themeToggle?.addEventListener("click", toggleTheme);
collectionToggle?.addEventListener("click", toggleCollectionView);

homeLink?.addEventListener("click", (e) => {
  e.preventDefault();
  resetGallery();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("show")) return;
  if (e.key === "Escape") hideLightbox();
  if (e.key === "ArrowLeft") navigateLightbox(-1);
  if (e.key === "ArrowRight") navigateLightbox(1);
});

lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) hideLightbox();
});

// Info modal
const infoToggle = document.getElementById("infoToggle");
const infoModal = document.querySelector(".info-modal");
const closeInfo = document.querySelector(".close-info");

const toggleInfoModal = () => infoModal?.classList.toggle("show");

infoToggle?.addEventListener("click", toggleInfoModal);
closeInfo?.addEventListener("click", toggleInfoModal);
infoModal?.addEventListener("click", (e) => { if (e.target === infoModal) toggleInfoModal(); });

// Init
initTheme();
updateCollectionCount();
setGridColumns(parseInt(localStorage.getItem("gridCols")) || 3);
loadInitialOrSearch(getRandomQuery(), false);

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML = newTheme === "dark" ? '<i class="uil uil-sun"></i>' : '<i class="uil uil-moon"></i>';
}
