const imageWrapper = document.querySelector(".images");
const searchInput = document.querySelector(".search-container input");
const loadMoreBtn = document.querySelector(".load-more");
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

const apiKey = "KQLQ1rv8kErAhw9O37XwDW7vS82wYf6yKeW9gqfocoAOsRxuq1BnGGFU";
const perPage = 9;
let currentPage = 1;
let searchTerm = null;
let isVideoGallery = false;
let isCollectionView = false;
let currentLightboxItem = null;

// Generate a random query for variety on refresh
const getRandomQuery = () => {
  const queries = [
    'nature', 'city', 'people', 'animals', 'food', 'travel', 'art', 'technology',
    'architecture', 'fashion', 'sports', 'music', 'history', 'science', 'space', 'ocean',
    'mountains', 'desert', 'forests', 'waterfalls', 'rivers', 'sunsets', 'sunrises', 'wildlife',
    'flowers', 'gardens', 'lakes', 'islands', 'castles', 'monuments', 'street art', 'festivals',
    'markets', 'landscapes', 'weather', 'vehicles', 'trains', 'boats', 'planes', 'bridges',
    'parks', 'caves', 'temples', 'palaces', 'mountain villages', 'snow', 'rain', 'clouds',
    'cities at night', 'ancient ruins', 'space exploration', 'fantasy worlds',
    'mythical creatures', 'digital art', 'sculptures', 'portraits', 'street photography'
  ];
  
  return queries[Math.floor(Math.random() * queries.length)];
};

// Initialize theme
const initTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.innerHTML = savedTheme === "dark" 
    ? '<i class="uil uil-sun"></i>' 
    : '<i class="uil uil-moon"></i>';
};

// Toggle theme
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML = newTheme === "dark" 
    ? '<i class="uil uil-sun"></i>' 
    : '<i class="uil uil-moon"></i>';
};

// Get collection from localStorage
const getCollection = () => {
  const collection = localStorage.getItem("mediaCollection");
  return collection ? JSON.parse(collection) : [];
};

// Save to collection
const saveToCollection = (item) => {
  const collection = getCollection();
  if (!collection.some(i => i.id === item.id)) {
    collection.push(item);
    localStorage.setItem("mediaCollection", JSON.stringify(collection));
    return true;
  }
  return false;
};

// Remove from collection
const removeFromCollection = (id) => {
  const collection = getCollection().filter(item => item.id !== id);
  localStorage.setItem("mediaCollection", JSON.stringify(collection));
};

// Check if item is in collection
const isInCollection = (id) => {
  return getCollection().some(item => item.id === id);
};

const downloadMedia = (url) => {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement("a");
      const extension = url.split('.').pop().split('?')[0]; 
      a.href = URL.createObjectURL(blob);
      a.download = `download.${extension}`;
      a.click();
    })
    .catch(() => alert("Failed to download media!"));
};

const showLightbox = (name, mediaUrl, isVideo = false, itemData = null) => {
  const photographerName = lightbox.querySelector(".photographer-name");
  photographerName.textContent = name;
  
  if (itemData) {
    currentLightboxItem = itemData;
    favoriteBtn.classList.toggle("active", isInCollection(itemData.id));
  }
  
  if (isVideo) {
    lightboxImage.style.display = "none";
    lightboxVideo.style.display = "block";
    lightboxVideo.src = mediaUrl;
    lightboxVideo.classList.add("visible");
    lightboxImage.classList.remove("visible");
  } else {
    lightboxVideo.style.display = "none";
    lightboxImage.style.display = "block";
    lightboxImage.src = mediaUrl;
    lightboxImage.classList.add("visible");
    lightboxVideo.classList.remove("visible");
    
    // Load image to check orientation
    const img = new Image();
    img.src = mediaUrl;
    img.onload = function() {
      if (this.height > this.width) {
        lightboxImage.style.maxHeight = "70vh";
        lightboxImage.style.maxWidth = "auto";
      } else {
        lightboxImage.style.maxWidth = "80vw";
        lightboxImage.style.maxHeight = "auto";
      }
    };
  }
  
  downloadImgBtn.setAttribute("data-media", mediaUrl);
  lightbox.classList.add("show");
  document.body.style.overflow = "hidden";
};

const hideLightbox = () => {
  lightbox.classList.remove("show");
  document.body.style.overflow = "auto";
  lightboxVideo.pause();
  currentLightboxItem = null;
};

const toggleFavorite = () => {
  if (!currentLightboxItem) return;
  
  if (isInCollection(currentLightboxItem.id)) {
    removeFromCollection(currentLightboxItem.id);
    favoriteBtn.classList.remove("active");
  } else {
    if (saveToCollection(currentLightboxItem)) {
      favoriteBtn.classList.add("active");
    }
  }
};

const generateHTML = (items) => {
  const fragment = document.createDocumentFragment();
  
  if (items.length === 0) {
    if (imageWrapper.children.length === 0) {
      imageWrapper.innerHTML = `<p class="no-results">No items found matching your search.</p>`;
    }
    return;
  }
  
  if (isCollectionView) {
    const title = document.createElement("h2");
    title.className = "collection-title";
    title.textContent = "Your Collection";
    fragment.appendChild(title);
  }
  
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    
    if (isVideoGallery || item.type === "video") {
      const videoSrc = item.videoUrl || (item.video_files && item.video_files[0]?.link);
      const videoThumbnail = item.image || item.videoThumbnail;
      const photographer = item.user?.name || item.photographer || "Unknown";
      const itemId = item.id || Math.random().toString(36).substr(2, 9);
      
      card.innerHTML = `
        <video onclick="showLightbox('${photographer}', '${videoSrc}', true, ${JSON.stringify({
          id: itemId,
          type: "video",
          videoUrl: videoSrc,
          videoThumbnail: videoThumbnail,
          photographer: photographer
        }).replace(/"/g, '&quot;')})" poster="${videoThumbnail}">
          <source src="${videoSrc}" type="video/mp4">
        </video>
        <div class="details">
          <div class="photographer">
            <i class="uil uil-camera"></i>
            <span>${photographer}</span>
          </div>
          <div>
            <button onclick="downloadMedia('${videoSrc}'); event.stopPropagation();" class="download-btn">
              <i class="uil uil-import"></i>
            </button>
            ${isCollectionView ? `
            <button onclick="removeFromCollection('${itemId}'); this.closest('.card').remove(); event.stopPropagation();" class="download-btn">
              <i class="uil uil-trash-alt"></i>
            </button>` : ''}
          </div>
        </div>`;
    } else {
      const imgSrc = item.src?.large2x || item.src?.original || item.imageUrl;
      const photographer = item.photographer || "Unknown";
      const itemId = item.id || Math.random().toString(36).substr(2, 9);
      
      card.innerHTML = `
        <img onclick="showLightbox('${photographer}', '${imgSrc}', false, ${JSON.stringify({
          id: itemId,
          type: "image",
          imageUrl: imgSrc,
          photographer: photographer
        }).replace(/"/g, '&quot;')})" src="${imgSrc}" alt="img">
        <div class="details">
          <div class="photographer">
            <i class="uil uil-camera"></i>
            <span>${photographer}</span>
          </div>
          <div>
            <button onclick="downloadMedia('${imgSrc}'); event.stopPropagation();" class="download-btn">
              <i class="uil uil-import"></i>
            </button>
            ${isCollectionView ? `
            <button onclick="removeFromCollection('${itemId}'); this.closest('.card').remove(); event.stopPropagation();" class="download-btn">
              <i class="uil uil-trash-alt"></i>
            </button>` : ''}
          </div>
        </div>`;
    }
    
    fragment.appendChild(card);
  });
  
  imageWrapper.appendChild(fragment);
};

const getItems = (apiURL) => {
  if (isCollectionView) {
    loadMoreBtn.style.display = "none";
    const collection = getCollection();
    generateHTML(collection);
    return;
  }
  
  loadMoreBtn.style.display = "block";
  loadMoreBtn.innerText = "Loading...";
  loadMoreBtn.classList.add("disabled");
  
  fetch(apiURL, {
    headers: { Authorization: apiKey }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const items = isVideoGallery ? (data.videos || []) : (data.photos || []);
      generateHTML(items);
      loadMoreBtn.innerText = "Load More";
      loadMoreBtn.classList.remove("disabled");
    })
    .catch((error) => {
      console.error("Error loading items:", error);
      loadMoreBtn.innerText = "Load More";
      loadMoreBtn.classList.remove("disabled");
      if (imageWrapper.children.length === 0) {
        imageWrapper.innerHTML = `<p class="error-message">Failed to load items. Please try again later.</p>`;
      }
    });
};

const loadMoreItems = () => {
  currentPage++;
  let apiUrl = isVideoGallery
    ? `https://api.pexels.com/videos/popular?page=${currentPage}&per_page=${perPage}`
    : `https://api.pexels.com/v1/curated?page=${currentPage}&per_page=${perPage}`;
  
  if (searchTerm) {
    apiUrl = isVideoGallery
      ? `https://api.pexels.com/videos/search?query=${searchTerm}&page=${currentPage}&per_page=${perPage}`
      : `https://api.pexels.com/v1/search?query=${searchTerm}&page=${currentPage}&per_page=${perPage}`;
  }
  
  getItems(apiUrl);
};

const loadSearchItems = (e) => {
  if (e.key === "Enter") {
    currentPage = 1;
    searchTerm = e.target.value.trim();
    imageWrapper.innerHTML = "";
    loadMoreItems();
  }
};

const toggleGallery = () => {
  if (isCollectionView) return;
  
  isVideoGallery = !isVideoGallery;
  currentPage = 1;
  searchTerm = null;
  searchInput.value = "";
  imageWrapper.innerHTML = "";
  
  toggleButton.innerHTML = `
    <i class="uil uil-exchange"></i>
    <span>Switch to ${isVideoGallery ? 'Images' : 'Videos'}</span>
  `;
  
  let apiUrl = isVideoGallery
    ? `https://api.pexels.com/videos/popular?page=1&per_page=${perPage}`
    : `https://api.pexels.com/v1/curated?page=1&per_page=${perPage}`;
  
  if (!searchTerm) {
    const randomQuery = getRandomQuery();
    apiUrl = isVideoGallery
      ? `https://api.pexels.com/videos/search?query=${randomQuery}&page=1&per_page=${perPage}`
      : `https://api.pexels.com/v1/search?query=${randomQuery}&page=1&per_page=${perPage}`;
  }
  
  getItems(apiUrl);
};

const toggleCollectionView = () => {
  isCollectionView = !isCollectionView;
  collectionToggle.classList.toggle("active", isCollectionView);
  
  if (isCollectionView) {
    currentPage = 1;
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
  imageWrapper.innerHTML = "";
  
  const randomQuery = getRandomQuery();
  if (isVideoGallery) {
    getItems(`https://api.pexels.com/videos/search?query=${randomQuery}&page=1&per_page=${perPage}`);
  } else {
    getItems(`https://api.pexels.com/v1/search?query=${randomQuery}&page=1&per_page=${perPage}`);
  }
};

// Event Listeners
loadMoreBtn.addEventListener("click", loadMoreItems);
searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") loadSearchItems(e);
});
closeImgBtn.addEventListener("click", hideLightbox);
favoriteBtn.addEventListener("click", toggleFavorite);
downloadImgBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  downloadMedia(e.target.closest("button").dataset.media);
});
toggleButton.addEventListener("click", toggleGallery);
themeToggle.addEventListener("click", toggleTheme);
collectionToggle.addEventListener("click", toggleCollectionView);
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  resetGallery();
});
// Add this to the existing script.js file, near the other DOM selectors
const infoToggle = document.getElementById("infoToggle");
const infoModal = document.querySelector(".info-modal");
const closeInfoBtn = document.querySelector(".close-info");

// Add this function to show/hide the info modal
const toggleInfoModal = () => {
  infoModal.classList.toggle("show");
  document.body.style.overflow = infoModal.classList.contains("show") ? "hidden" : "auto";
};

// Add this event listener with the others
infoToggle.addEventListener("click", toggleInfoModal);
closeInfoBtn.addEventListener("click", toggleInfoModal);

// Also close when clicking outside the modal content
infoModal.addEventListener("click", (e) => {
  if (e.target === infoModal) {
    toggleInfoModal();
  }
});
// Initialize
initTheme();
resetGallery();