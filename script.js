const imageWrapper = document.querySelector(".images");
const searchInput = document.querySelector(".search input");
const loadMoreBtn = document.querySelector(".gallery .load-more");
const lightbox = document.querySelector(".lightbox");
const downloadImgBtn = lightbox.querySelector(".uil-import");
const closeImgBtn = lightbox.querySelector(".close-icon");
const toggleButton = document.getElementById("toggleButton");

const apiKey = "KQLQ1rv8kErAhw9O37XwDW7vS82wYf6yKeW9gqfocoAOsRxuq1BnGGFU";
const perPage = 15;
let currentPage = 1;
let searchTerm = null;
let isVideoGallery = false;

const downloadMedia = (url) => {
    fetch(url).then(res => res.blob()).then(blob => {
        const a = document.createElement("a");
        const extension = url.split('.').pop().split('?')[0]; 
        a.href = URL.createObjectURL(blob);
        a.download = `download.${extension}`;
        a.click();
    }).catch(() => alert("Failed to download media!"));
}

const showLightbox = (name, mediaUrl) => {
    if (isVideoGallery) {
        lightbox.querySelector("img").style.display = "none";
        const videoElement = document.createElement("video");
        videoElement.controls = true;
        videoElement.src = mediaUrl;
        videoElement.style.width = "100%";
        lightbox.querySelector(".img").appendChild(videoElement);
    } else {
        lightbox.querySelector("img").src = mediaUrl;
        lightbox.querySelector("img").style.display = "block";
    }
    lightbox.querySelector("span").innerText = name;
    downloadImgBtn.setAttribute("data-media", mediaUrl);
    lightbox.classList.add("show");
    document.body.style.overflow = "hidden";
}

const hideLightbox = () => {
    lightbox.classList.remove("show");
    document.body.style.overflow = "auto";
    if (isVideoGallery) {
        const videoElement = lightbox.querySelector("video");
        if (videoElement) {
            videoElement.remove(); 
        }
    }
}

const generateHTML = (items) => {
    imageWrapper.innerHTML += items.map(item => {
        if (isVideoGallery) {
            const landscapeVideos = item.video_files.filter(file => {
                return file.width > file.height;
            });

            if (landscapeVideos.length === 0) return '';

            const videoSrc = landscapeVideos[0].link;
            const videoThumbnail = item.image;
            const photographer = item.user.name;
            return `
                <li class="card">
                    <video onclick="showLightbox('${photographer}', '${videoSrc}')" poster="${videoThumbnail}" controls>
                        <source src="${videoSrc}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="details">
                        <div class="photographer">
                            <i class="uil uil-camera"></i>
                            <span>${photographer}</span>
                        </div>
                        <button onclick="downloadMedia('${videoSrc}');">
                            <i class="uil uil-import"></i>
                        </button>
                    </div>
                </li>`;
        } else {
            const imgSrc = item.src.large2x;
            const photographer = item.photographer;
            return `
                <li class="card">
                    <img onclick="showLightbox('${photographer}', '${imgSrc}')" src="${imgSrc}" alt="img">
                    <div class="details">
                        <div class="photographer">
                            <i class="uil uil-camera"></i>
                            <span>${photographer}</span>
                        </div>
                        <button onclick="downloadMedia('${imgSrc}');">
                            <i class="uil uil-import"></i>
                        </button>
                    </div>
                </li>`;
        }
    }).join("");
}

const getItems = (apiURL) => {
    searchInput.blur();
    loadMoreBtn.innerText = "Loading...";
    loadMoreBtn.classList.add("disabled");
    fetch(apiURL, {
        headers: { Authorization: apiKey }
    }).then(res => res.json()).then(data => {
        const items = isVideoGallery ? data.videos : data.photos;
        generateHTML(items);
        loadMoreBtn.innerText = "Load More";
        loadMoreBtn.classList.remove("disabled");
    }).catch(() => alert("Failed to load items!"));
}

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
}

const loadSearchItems = (e) => {
    if (e.target.value === "") return searchTerm = null;
    if (e.key === "Enter") {
        currentPage = 1;
        searchTerm = e.target.value;
        imageWrapper.innerHTML = "";
        let apiUrl = isVideoGallery
            ? `https://api.pexels.com/videos/search?query=${searchTerm}&page=1&per_page=${perPage}`
            : `https://api.pexels.com/v1/search?query=${searchTerm}&page=1&per_page=${perPage}`;
        getItems(apiUrl);
        
        window.scrollTo({
            top: document.querySelector(".gallery").offsetTop - 50, 
            behavior: "smooth"
        });
    }
}

const toggleGallery = () => {
    isVideoGallery = !isVideoGallery;
    currentPage = 1;
    searchTerm = null;
    imageWrapper.innerHTML = "";
    toggleButton.innerText = isVideoGallery ? "Switch to Image Gallery" : "Switch to Video Gallery";
    let apiUrl = isVideoGallery
        ? `https://api.pexels.com/videos/popular?page=1&per_page=${perPage}`
        : `https://api.pexels.com/v1/curated?page=1&per_page=${perPage}`;
    getItems(apiUrl);
}

getItems(`https://api.pexels.com/v1/curated?page=${currentPage}&per_page=${perPage}`);
loadMoreBtn.addEventListener("click", loadMoreItems);
searchInput.addEventListener("keyup", loadSearchItems);
closeImgBtn.addEventListener("click", hideLightbox);
downloadImgBtn.addEventListener("click", (e) => downloadMedia(e.target.dataset.media));
toggleButton.addEventListener("click", toggleGallery);
