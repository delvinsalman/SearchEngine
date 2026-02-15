# 📸 [Captures.io](https://delvinsalman.github.io/SearchEngine/) – Free Photo & Video Search Engine


<img width="1511" height="771" alt="Screenshot 2026-02-15 at 4 53 30 PM" src="https://github.com/user-attachments/assets/821d3424-c78f-45f0-81f4-fc3d31006192" />


Captures.io is a modern web application that lets you search, browse, and download high-quality photos and videos from the Pexels API. With a clean UI, keyboard shortcuts, and flexible layout, it works well for creatives, developers, and anyone who needs free stock media.

---

## ✨ Features

### Search & Discovery
- **Photo & Video Search** – Switch between photo and video galleries with one click
- **Search Suggestions** – Recent searches and live suggestions as you type
- **Clear Search** – One-click clear with the X button inside the search bar
- **Related Searches** – Topic suggestions when there are no results

### Viewing & Lightbox
- **Lightbox Viewer** – View media full-screen with photographer credit
- **Keyboard Navigation** – Use ← → to move between items, Esc to close
- **Zoom** – Toggle zoom on images (images only)
- **Share & Copy Link** – Share via Web Share API or copy media URL
- **Prev/Next** – Move through results without closing the lightbox
- **Position Counter** – Shows current item (e.g., 2/12)

### Collection & Downloads
- **Collection** – Save favorites in a local collection
- **One-Click Download** – Download any photo or video
- **Collection Badge** – Badge shows how many items are saved

### Layout & UI
- **Grid Toggle** – 2 or 3 columns (default 3×3)
- **Dark/Light Mode** – Theme toggle with saved preference
- **Responsive Design** – Works on desktop, tablet, and mobile
- **Video Hover Preview** – Videos play on hover in the gallery
- **Skeleton Loaders** – Loading placeholders during fetch
- **Scroll-to-Top** – Button appears after scrolling
- **Toast Notifications** – Notifications for actions (downloads, favorites)

### Other
- **Info Modal** – Overview of features and usage
- **Random Discovery** – Random topic on load for initial content

---

## 🖼️ Screenshots

| Light Mode – Photo Gallery | Dark Mode – Search Results |
|----------------------------|----------------------------|
|<img width="1511" height="771" alt="Screenshot 2026-02-15 at 4 54 13 PM" src="https://github.com/user-attachments/assets/d394c114-d4c6-4893-979e-d38c456fddcb" />|  <img width="1511" height="771" alt="Screenshot 2026-02-15 at 4 58 01 PM" src="https://github.com/user-attachments/assets/5be9a68c-8290-4a61-a8fd-93b24f5da496" />|

| Video Gallery | Lightbox with Media Controls |
|---------------|------------------------------|
|<img width="1511" height="771" alt="Screenshot 2026-02-15 at 4 58 46 PM" src="https://github.com/user-attachments/assets/7eb221e5-a131-46e9-9550-bb036ce2fe85" /> | <img width="1511" height="771" alt="Screenshot 2026-02-15 at 4 59 31 PM" src="https://github.com/user-attachments/assets/e4bdbf63-7003-4e5e-860c-c280696bc08e" />|

| Collection View | User Features |
|-----------------|-------------------|
| <img width="1511" height="771" alt="Screenshot 2026-02-15 at 5 01 04 PM" src="https://github.com/user-attachments/assets/bb30a4b4-b840-47c8-81a2-76f2d73a3914" />|<img width="1511" height="771" alt="Screenshot 2026-02-15 at 5 04 53 PM" src="https://github.com/user-attachments/assets/365a0633-f024-4d3d-9cb8-7499f083ce50" />|
 
---

## 🛠️ Technologies Used

| Category        | Tech |
|----------------|------|
| **Frontend**   | HTML5, CSS3, JavaScript (ES6+) |
| **API**        | [Pexels API](https://www.pexels.com/api/) for photos and videos |
| **Icons**      | [Unicons](https://iconscout.com/unicons) |
| **Font**       | [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts) |
| **Layout**     | CSS Grid, Flexbox |
| **Storage**    | Local Storage (theme, collection, grid preference, recent searches) |

---

## 🚀 Installation & Usage

### Clone the repository
```bash
git clone https://github.com/delvinsalman/SearchEngine.git
cd SearchEngine
```

### Run locally
Open `index.html` in a browser, or use a local server:
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve
```
Then visit `http://localhost:8000`.

### Pexels API key
For production, add your own [Pexels API key](https://www.pexels.com/api/) in `script.js`:

```javascript
const apiKey = "YOUR_PEXELS_API_KEY";
```

---

## 📄 License

This project uses media from [Pexels](https://www.pexels.com/), which are free to use. Check Pexels licensing for commercial use.
