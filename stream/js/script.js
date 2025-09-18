// This single script now contains all the logic for the application.

// --- Global State ---
let scene, camera, renderer, videoObjects = [], targetPlanet;
let currentIndex = 0;
let _planetData; 
let currentView = 'navigator-view'; // The view currently visible
let viewHistory = []; // An array to track the user's navigation path
let playerHistory = []; // MODIFIED: An array to track played videos within the player UI
let currentMovieCategory = null; 
let isAnimatingCamera = false; // NEW: Flag to control camera animation state
let isLowQualityMode = false; // NEW: Flag for performance optimization

// Lists for Watch Later & Favorites
let watchLaterList = [];
let favoritesList = [];

let cameraTarget = { 
    position: new THREE.Vector3(), 
    lookAt: new THREE.Vector3() 
};


// --- Data ---
const planetData = [
    { id: 'all', category: {en: "All Movies", my: "ရုပ်ရှင်အားလုံး"}, position: new THREE.Vector3(0, 0, 0), color: 0xffffff, scale: 2.5 },
    { id: 'scifi', category: {en: "Sci-Fi", my: "<span class='font-eng'>Sci-Fi</span>"}, position: new THREE.Vector3(0, 20, -50), color: 0x8b5cf6, scale: 1.8 },
    { id: 'horror', category: {en: "Horror", my: "သရဲ"}, position: new THREE.Vector3(-40, -15, -90), color: 0x4a044e, scale: 1.6 },
    { id: 'action', category: {en: "Action", my: "အက်ရှင်"}, position: new THREE.Vector3(60, 0, -100), color: 0xfacc15, scale: 2.0 },
    { id: 'drama', category: {en: "Drama", my: "ဒရာမာ"}, position: new THREE.Vector3(30, -25, -40), color: 0x0ea5e9, scale: 1.7 },
    { id: 'comedy', category: {en: "Comedy", my: "ဟာသ"}, position: new THREE.Vector3(-20, 25, -60), color: 0xec4899, scale: 1.5 },
    { id: 'mystery', category: {en: "Mystery", my: "လျှို့ဝှက်ဆန်းကြယ်"}, position: new THREE.Vector3(10, -20, -70), color: 0x22c55e, scale: 1.6 },
];

const movieData = {
    'scifi': [
        { title: 'Dune: Part Two', poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', year: 2024, rating: '8.3', synopsis: 'Paul Atrides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', trailerId: 'U2Qp5pL3ovA' },
        { title: 'Blade Runner 2049', poster: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Blade_Runner_2049_poster.png', year: 2017, rating: '7.9', synopsis: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who\'s been missing for 30 years.', trailerId: 'gCcx85zbxz4' },
        { title: 'Arrival', poster: 'https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg', year: 2016, rating: '7.9', synopsis: 'A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.', trailerId: 'tFMo3UJ4B4g' },
    ],
    'horror': [
        { title: 'Hereditary', poster: 'https://upload.wikimedia.org/wikipedia/en/d/d9/Hereditary.png', year: 2018, rating: '7.2', synopsis: 'A grieving family is haunted by tragic and disturbing occurrences after the death of their secretive grandmother.', trailerId: 'V6wWKNij_1M' },
        { title: 'A Quiet Place', poster: 'https://upload.wikimedia.org/wikipedia/en/a/a0/A_Quiet_Place_film_poster.png', year: 2018, rating: '7.5', synopsis: 'In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing.', trailerId: 'WR7cc5t7tv8' },
    ],
    'action': [
        { title: 'John Wick: Chapter 4', poster: 'https://upload.wikimedia.org/wikipedia/en/d/d0/John_Wick_-_Chapter_4_promotional_poster.jpg', year: 2023, rating: '7.8', synopsis: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.', trailerId: 'qEVUtrk8_B4' },
        { title: 'Mad Max: Fury Road', poster: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg', year: 2015, rating: '8.1', synopsis: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the help of a group of female prisoners, a psychotic worshiper, and a drifter named Max.', trailerId: 'hEJnMQG9ev8' },
    ],
    'drama': [
        { title: 'Parasite', poster: 'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png', year: 2019, rating: '8.6', synopsis: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', trailerId: '5xH0HfJHsaY' },
        { title: 'Oppenheimer', poster: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg', year: 2023, rating: '8.6', synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', trailerId: 'uYPbbksJxIg' },
    ],
    'comedy': [
        { title: 'Superbad', poster: 'https://upload.wikimedia.org/wikipedia/en/8/8b/Superbad_Poster.png', year: 2007, rating: '7.6', synopsis: 'Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.', trailerId: '4v8KEbQA8kw' },
    ],
    'mystery': [
        { title: 'Knives Out', poster: 'https://upload.wikimedia.org/wikipedia/en/1/1f/Knives_Out_poster.jpeg', year: 2019, rating: '7.9', synopsis: 'A detective investigates the death of a patriarch of an eccentric, combative family.', trailerId: 'qGqiHJTsRkQ' },
    ]
};
function getAllMovies() {
    return Object.values(movieData).flat();
}

// --- List Management (Watch Later & Favorites) ---
function saveLists() {
    localStorage.setItem('cinelux_watchLater', JSON.stringify(watchLaterList));
    localStorage.setItem('cinelux_favorites', JSON.stringify(favoritesList));
}

function loadLists() {
    const savedWatchLater = localStorage.getItem('cinelux_watchLater');
    const savedFavorites = localStorage.getItem('cinelux_favorites');
    if (savedWatchLater) watchLaterList = JSON.parse(savedWatchLater);
    if (savedFavorites) favoritesList = JSON.parse(savedFavorites);
}

function toggleListItem(listType, movie) {
    const list = listType === 'favorites' ? favoritesList : watchLaterList;
    const index = list.findIndex(item => item.title === movie.title);

    if (index > -1) {
        list.splice(index, 1);
    } else {
        list.push(movie);
    }
    saveLists();
    updatePopupButtons(movie);
}


// --- 3D Scene Logic ---
function createCategoryLabel(text, lang) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const isBurmese = /[\u1000-\u109F]/.test(text);
    const FONT_FAMILY = isBurmese ? 'Padauk' : 'Inter';
    
    const FONT_SIZE = 48;
    context.font = `700 ${FONT_SIZE}px ${FONT_FAMILY}`;
    const textWidth = context.measureText(text).width;
    
    canvas.width = textWidth + 32;
    canvas.height = FONT_SIZE + 16;
    
    context.font = `700 ${FONT_SIZE}px ${FONT_FAMILY}`;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: true, depthWrite: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(canvas.width / 100, canvas.height / 100, 1);
    return sprite;
}


function updateAllCategoryLabels() {
    const currentLang = localStorage.getItem('wemarz_lang') || 'en';
    videoObjects.forEach(planet => {
        let newText = planet.userData.category[currentLang];
        if (typeof newText === 'string') newText = newText.replace(/<[^>]*>?/gm, '');
        const newLabel = createCategoryLabel(newText, currentLang);
        
        if (planet.children[0]) {
            planet.children[0].material.map.dispose();
            planet.children[0].material.map = newLabel.material.map;
            planet.children[0].scale.set(newLabel.scale.x, newLabel.scale.y, 1);
        }
    });
}

function updateInfoPanel(video) {
    const infoPanel = document.getElementById('info-panel');
    infoPanel.classList.remove('visible');
    
    const color = new THREE.Color(video.color);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    setTimeout(() => {
        infoPanel.style.setProperty('--planet-glow-color', `rgb(${r}, ${g}, ${b})`);
        infoPanel.style.setProperty('--planet-glow-color-rgb', `${r}, ${g}, ${b}`);
        infoPanel.classList.add('visible');
    }, 300);
}

function updateTargetPlanet() {
    if (_planetData.length === 0) return;
    targetPlanet = videoObjects[currentIndex];
    currentMovieCategory = targetPlanet.userData.id;
    updateInfoPanel(targetPlanet.userData);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCameraTransition(targetObject, onComplete) {
    isAnimatingCamera = true;
    const duration = 1500; 
    const startTime = performance.now();

    const startPosition = camera.position.clone();
    const startLookAt = new THREE.Vector3().copy(cameraTarget.lookAt);

    const endLookAt = targetObject.position.clone();
    const endPosition = endLookAt.clone().add(new THREE.Vector3(0, 0, (targetObject.geometry.parameters.radius * targetObject.scale.x) + 2));

    function transition() {
        const elapsedTime = performance.now() - startTime;
        let progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        const currentPos = new THREE.Vector3().lerpVectors(startPosition, endPosition, easedProgress);
        currentPos.y += Math.sin(progress * Math.PI) * 2; 
        camera.position.copy(currentPos);

        const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, endLookAt, easedProgress);
        camera.lookAt(currentLookAt);

        if (progress < 1) {
            requestAnimationFrame(transition);
        } else {
            camera.position.copy(endPosition);
            camera.lookAt(endLookAt);
            isAnimatingCamera = false;
            if (onComplete) onComplete();
        }
    }
    transition();
}


function animate() {
    requestAnimationFrame(animate);

    if (!isAnimatingCamera && targetPlanet && currentView === 'navigator-view') {
        const planetRadius = targetPlanet.geometry.parameters.radius * targetPlanet.scale.x;
        const isMobile = window.innerWidth < 768;
        let distanceMultiplier = isMobile ? 6 : 5;
        const cameraDistance = planetRadius * distanceMultiplier + 6;
        const cameraYOffset = planetRadius * 1.2;
        cameraTarget.position.copy(targetPlanet.position).add(new THREE.Vector3(0, cameraYOffset, cameraDistance));
        cameraTarget.lookAt.copy(targetPlanet.position);

        camera.position.lerp(cameraTarget.position, 0.04);
        const lookAtTarget = new THREE.Vector3().copy(cameraTarget.lookAt).lerp(targetPlanet.position, 0.04);
        camera.lookAt(lookAtTarget);
    }
    
    // MODIFIED: Only rotate planets when in navigator view to save performance
    if (currentView === 'navigator-view') {
        videoObjects.forEach(obj => {
            obj.rotation.y += 0.002;
            if (!isAnimatingCamera) {
                    if (obj !== targetPlanet) {
                        const baseScale = obj.userData.scale || 1.5;
                        obj.scale.lerp(new THREE.Vector3(baseScale, baseScale, baseScale), 0.1);
                    } else {
                        const targetScale = obj.userData.scale * 1.7;
                        obj.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
                    }
            }
        });
    }
    
    renderer.render(scene, camera);
}

function initThreeScene(planetData) {
    _planetData = planetData;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('bg-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 15;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Slightly brighter ambient light
    scene.add(ambientLight);

    // MODIFIED: Conditionally add advanced lighting
    if (!isLowQualityMode) {
        const pointLight = new THREE.PointLight(0xffffff, 1.2, 200);
        pointLight.position.set(20, 20, 30);
        scene.add(pointLight);
    }

    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const starColors = [];
    const colors = [new THREE.Color(0xffffff), new THREE.Color(0xffd700), new THREE.Color(0x87ceeb)]; 
    
    // MODIFIED: Reduce star count in low quality mode
    const starCount = isLowQualityMode ? 2000 : 10000;
    for (let i = 0; i < starCount; i++) {
        starVertices.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000
        );
        const color = colors[Math.floor(Math.random() * colors.length)];
        starColors.push(color.r, color.g, color.b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true
    });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    planetData.forEach(data => {
        const isMobile = window.innerWidth < 768;
        let radius = data.scale || 1.5;
        if (data.id === 'all' && isMobile) radius = 1.8;
        else if (data.id === 'all') radius = 2.5;

        // MODIFIED: Use simpler geometry and material for low quality mode
        const geometry = isLowQualityMode 
            ? new THREE.SphereGeometry(1, 32, 32) 
            : new THREE.SphereGeometry(1, 64, 64);
        
        const material = isLowQualityMode
            ? new THREE.MeshBasicMaterial({ color: data.color })
            : new THREE.MeshStandardMaterial({ 
                color: data.color,
                metalness: 0.1,
                roughness: 0.7
            });

        const planet = new THREE.Mesh(geometry, material);
        planet.scale.setScalar(radius);

        const label = createCategoryLabel(data.category.en, 'en');
        label.position.y = 1.2;
        planet.add(label);
        planet.position.copy(data.position);
        planet.userData = data;
        scene.add(planet);
        videoObjects.push(planet);
    });

    document.getElementById('prev-planet').addEventListener('click', () => {
        if (isAnimatingCamera) return;
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : _planetData.length - 1;
        updateTargetPlanet();
    });

    document.getElementById('next-planet').addEventListener('click', () => {
        if (isAnimatingCamera) return;
        currentIndex = (currentIndex < _planetData.length - 1) ? currentIndex + 1 : 0;
        updateTargetPlanet();
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    animate();
}


// --- UI and View Management Logic ---
function switchView(viewId, isGoingBack = false) {
    if (currentView === viewId && !isGoingBack) return;

    if (currentView === 'player-view') {
        document.getElementById('player-container').innerHTML = ''; 
    }

    if (!isGoingBack && currentView !== viewId) {
        viewHistory.push(currentView);
        history.pushState({view: viewId}, '', `#${viewId}`);
    }

    const newView = document.getElementById(viewId);
    if (!newView) return;

    const currentViewEl = document.getElementById(currentView);
    if (currentViewEl) {
        currentViewEl.classList.remove('active');
    }

    currentView = viewId;
    newView.classList.add('active');

    const header = document.getElementById('main-header');
    const navigatorUI = document.querySelector('.navigator-ui');
    const navArrows = document.querySelectorAll('.nav-arrow');
    const pcSearchInput = document.getElementById('pc-search-input');
    const aiChatButton = document.getElementById('ai-chat-button'); 

    const isNavView = viewId === 'navigator-view';
    const isGridView = ['grid-view', 'list-view', 'search-results-view'].includes(viewId);
    
    const isChatVisibleView = ['grid-view', 'list-view', 'search-results-view', 'player-view'].includes(viewId);
    aiChatButton.classList.toggle('visible', isChatVisibleView);


    navigatorUI.style.opacity = isNavView ? '1' : '0';
    navArrows.forEach(a => a.style.opacity = isNavView ? '1' : '0');

    if (isGridView) {
        header.classList.add('search-visible');
    } else {
        header.classList.remove('search-visible');
        pcSearchInput.parentElement.parentElement.classList.remove('active');
    }
}


function populateMovieGrid(container, movies) {
    container.innerHTML = '';
    movies.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'movie-item group';
        item.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster" onerror="this.onerror=null;this.src='https://placehold.co/400x600/1f2937/FFFFFF?text=Image+Not+Found';">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
            </div>
        `;
        item.addEventListener('click', () => showDetailsPopup(movie));
        container.appendChild(item);
    });
}

function updatePopupButtons(movie) {
    const favButton = document.getElementById('popup-favorites-button');
    const watchLaterButton = document.getElementById('popup-watchlater-button');
    if (!favButton || !watchLaterButton) return;

    const isFavorite = favoritesList.some(item => item.title === movie.title);
    const isWatchLater = watchLaterList.some(item => item.title === movie.title);

    favButton.classList.toggle('active', isFavorite);
    favButton.innerHTML = `<i data-feather="${isFavorite ? 'check' : 'heart'}"></i> <span class="lang-en">Favorites</span><span class="lang-my hidden">အနှစ်သက်ဆုံး</span>`;
    watchLaterButton.classList.toggle('active', isWatchLater);
    watchLaterButton.innerHTML = `<i data-feather="${isWatchLater ? 'check' : 'clock'}"></i> <span class="lang-en">Watch Later</span><span class="lang-my hidden">နောက်မှကြည့်ရန်</span>`;
    
    feather.replace({ width: '1em', height: '1em' });
    applyLanguage(localStorage.getItem('wemarz_lang') || 'en', document.getElementById('popup-content'));
}

function showDetailsPopup(movie) {
    const popup = document.getElementById('details-popup');
    popup.style.zIndex = '50'; 
    const popupContent = document.getElementById('popup-content');
    
    popupContent.innerHTML = `
        <button id="popup-close-button" class="absolute top-3 right-3 text-white hover:text-yellow-400 transition-colors p-2 rounded-full bg-black bg-opacity-50 z-20"><i data-feather="x"></i></button>
        <div id="popup-scroll-wrapper">
            <div class="relative">
                <div class="absolute inset-0 bg-black"><img src="${movie.poster}" class="w-full h-full object-cover opacity-30" alt="${movie.title} backdrop"></div>
                <div class="relative pt-8 pb-8 px-4 sm:px-8">
                    <div class="md:flex gap-8">
                        <div class="md:w-1/3 flex-shrink-0 mt-4"><img src="${movie.poster}" class="rounded-lg shadow-lg w-full" alt="${movie.title} poster"></div>
                        <div class="md:w-2/3 mt-6 md:mt-0 text-white">
                            <h2 class="text-3xl md:text-5xl font-bold text-shadow-lg">${movie.title}</h2>
                            <div class="flex items-center gap-4 mt-2 text-gray-300">
                                <span>${movie.year}</span>
                                <span class="flex items-center gap-1"><i data-feather="star" class="w-4 h-4 text-yellow-400 fill-current"></i> ${movie.rating}</span>
                            </div>
                            <p class="mt-4 text-gray-300">${movie.synopsis}</p>
                            <div class="mt-6 flex flex-col sm:flex-row items-center gap-3">
                                <button id="popup-play-button" class="bg-white text-black font-bold py-2 px-6 rounded-md flex items-center gap-2 transition w-full sm:w-auto"><i data-feather="play"></i> <span class="lang-en">Play</span><span class="lang-my hidden">ကြည့်ရန်</span></button>
                                <div class="flex w-full sm:w-auto gap-3">
                                    <button id="popup-watchlater-button" class="popup-action-button"></button>
                                    <button id="popup-favorites-button" class="popup-action-button"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    popup.classList.add('active');
    document.getElementById('main-header').classList.add('header-hidden');
    document.getElementById('ai-chat-button').classList.remove('visible');
    updatePopupButtons(movie);
    
    applyLanguage(localStorage.getItem('wemarz_lang') || 'en', document.body);

    document.getElementById('popup-close-button').addEventListener('click', hideDetailsPopup);
    document.getElementById('popup-overlay').addEventListener('click', hideDetailsPopup);
    document.getElementById('popup-play-button').addEventListener('click', () => showPlayerView(movie));
    document.getElementById('popup-watchlater-button').addEventListener('click', () => toggleListItem('watchLater', movie));
    document.getElementById('popup-favorites-button').addEventListener('click', () => toggleListItem('favorites', movie));
}

function hideDetailsPopup() {
    const popup = document.getElementById('details-popup');
    popup.classList.remove('active');
    popup.style.zIndex = ''; 
    document.getElementById('main-header').classList.remove('header-hidden');

    const isChatVisibleView = ['grid-view', 'list-view', 'search-results-view', 'player-view'].includes(currentView);
    if (isChatVisibleView) {
        document.getElementById('ai-chat-button').classList.add('visible');
    }
}

function populateRelatedVideos(relatedMovies) {
    const container = document.getElementById('related-videos-container');
    container.innerHTML = '';
    
    relatedMovies.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'related-video-item';
        item.innerHTML = `<img src="${movie.poster}" alt="${movie.title}"><h4 class="text-white">${movie.title}</h4>`;
        item.addEventListener('click', () => showDetailsPopup(movie));
        container.appendChild(item);
    });
}

function showPlayerView(movie, isNavigatingBack = false) {
    hideDetailsPopup();

    let relatedVideosToShow;

    if (!isNavigatingBack) {
        const categoryMovies = movieData[currentMovieCategory] || getAllMovies();
        let relatedMovies = categoryMovies.filter(m => m.title !== movie.title);
        
        for (let i = relatedMovies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [relatedMovies[i], relatedMovies[j]] = [relatedMovies[j], relatedMovies[i]];
        }
        
        relatedVideosToShow = relatedMovies.slice(0, 10);
        
        playerHistory.push({ movie: movie, related: relatedVideosToShow });
        history.pushState({view: 'player-view', movieTitle: movie.title}, '', `#player`);

    } else {
        const lastView = playerHistory[playerHistory.length - 1];
        if (lastView) {
            relatedVideosToShow = lastView.related;
        } else {
            const categoryMovies = movieData[currentMovieCategory] || getAllMovies();
            relatedVideosToShow = categoryMovies.filter(m => m.title !== movie.title).slice(0, 10);
        }
    }

    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${movie.trailerId}?autoplay=1&rel=0&showinfo=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    
    populateRelatedVideos(relatedVideosToShow);

    if (currentView !== 'player-view') {
        switchView('player-view');
    }
}

function showGridView(categoryId) {
    const gridTitle = document.getElementById('grid-title');
    currentMovieCategory = categoryId;
    const categoryData = _planetData.find(p => p.id === categoryId);
    if (!categoryData) return;
    const movies = (categoryId === 'all') ? getAllMovies() : (movieData[categoryId] || []);
    gridTitle.innerHTML = categoryData.category[localStorage.getItem('wemarz_lang') || 'en'];
    populateMovieGrid(document.getElementById('movie-grid'), movies);
    switchView('grid-view');
}

function showListView(listType) {
    const listTitle = document.getElementById('list-title');
    const listGrid = document.getElementById('list-grid');
    const emptyMessage = document.getElementById('list-empty-message');
    const list = listType === 'favorites' ? favoritesList : watchLaterList;
    const titles = {
        favorites: { en: 'Favorites', my: 'အနှစ်သက်ဆုံးများ' },
        watchLater: { en: 'Watch Later', my: 'နောက်မှကြည့်ရန်' }
    };
    listTitle.innerHTML = titles[listType][localStorage.getItem('wemarz_lang') || 'en'];
    if (list.length > 0) {
        populateMovieGrid(listGrid, list);
        listGrid.classList.remove('hidden');
        emptyMessage.classList.add('hidden');
    } else {
        listGrid.classList.add('hidden');
        emptyMessage.classList.remove('hidden');
    }
    switchView('list-view');
}

function showSearchResults(results, query) {
    const titleEl = document.getElementById('search-results-title');
    const gridEl = document.getElementById('search-results-grid');
    const emptyMsgEl = document.getElementById('search-empty-message');
    const titleText = {
        en: `Results for "${query}"`,
        my: `"${query}" အတွက် ရှာဖွေမှုရလဒ်များ`
    };
    titleEl.innerHTML = titleText[localStorage.getItem('wemarz_lang') || 'en'];
    if (results.length > 0) {
        populateMovieGrid(gridEl, results);
        gridEl.classList.remove('hidden');
        emptyMsgEl.classList.add('hidden');
    } else {
        gridEl.classList.add('hidden');
        emptyMsgEl.classList.remove('hidden');
    }
    switchView('search-results-view');
}

function performSearch(query) {
    if (!query || query.trim() === '') {
        if (viewHistory.length > 0) switchView(viewHistory.pop(), true);
        return;
    }
    const allMovies = getAllMovies();
    const lowerCaseQuery = query.toLowerCase();
    const results = allMovies.filter(movie => movie.title.toLowerCase().includes(lowerCaseQuery));
    showSearchResults(results, query);
}

function applyLanguage(lang, rootElement = document) {
    if (rootElement === document) {
        localStorage.setItem('wemarz_lang', lang);
        updateAllCategoryLabels();
    }
    rootElement.querySelectorAll('.lang-en').forEach(el => el.classList.toggle('hidden', lang !== 'en'));
    rootElement.querySelectorAll('.lang-my').forEach(el => el.classList.toggle('hidden', lang !== 'my'));
    if (currentView === 'grid-view' && targetPlanet) {
        document.getElementById('grid-title').innerHTML = targetPlanet.userData.category[lang];
    }
    // Update AI chat placeholder
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        const placeholder = {
            en: 'Ask about movies...',
            my: 'ရုပ်ရှင်များအကြောင်း မေးမြန်းပါ...'
        };
        chatInput.placeholder = placeholder[lang];
    }
}

// --- AI Chat Logic ---
const chatHistory = [];

function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showChatLoading(show) {
    const messagesContainer = document.getElementById('chat-messages');
    let loadingEl = document.getElementById('loading-indicator');
    if (show) {
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loading-indicator';
            loadingEl.className = 'chat-message loading';
            loadingEl.innerHTML = '<span></span><span></span><span></span>';
            messagesContainer.appendChild(loadingEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    } else {
        if (loadingEl) {
            loadingEl.remove();
        }
    }
}

async function getAIResponse(prompt) {
    showChatLoading(true);
    const currentLang = localStorage.getItem('wemarz_lang') || 'en';
    
    let languageInstruction = "You are a movie expert assistant. Your name is CineLux AI. Keep your answers concise and focused on movies. ";
    if (currentLang === 'my') {
        languageInstruction += `Please answer in Burmese (Myanmar). The user's question is: ${prompt}`;
    } else {
        languageInstruction += `Please answer in English. The user's question is: ${prompt}`;
    }

    try {
        chatHistory.push({ role: "user", parts: [{ text: languageInstruction }] });

        const payload = { contents: chatHistory };
        const apiKey = ""; // API key will be provided by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        let aiText = "Sorry, I couldn't get a response. Please try again.";
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            aiText = result.candidates[0].content.parts[0].text;
        }
        
        chatHistory.push({ role: "model", parts: [{ text: aiText }] });
        addMessageToChat(aiText, 'ai');

    } catch (error) {
        console.error("AI Error:", error);
        addMessageToChat("An error occurred. Please check the console for details.", 'ai');
    } finally {
        showChatLoading(false);
    }
}

function handleSendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (message) {
        addMessageToChat(message, 'user');
        getAIResponse(message);
        chatInput.value = '';
    }
}

// stream/js/script.js

// NEW: Function to detect low-performance devices (IMPROVED LOGIC)
function detectPerformance() {
    // 1. Prioritize checking device memory.
    if (navigator.deviceMemory) {
        // Consider devices with less than 4GB RAM as low-performance.
        // A Note 10 with 8GB RAM will pass this check (8 < 4 is false).
        return navigator.deviceMemory < 4; 
    }

    // 2. If memory information is unavailable, THEN fall back to screen size.
    // This is a less reliable fallback but better than nothing.
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        // Assume mobile is low-performance ONLY if we have no other data.
        return true; 
    }

    // 3. Default to high-performance if it's a desktop and memory is unknown.
    return false;
}


// --- Main execution ---
document.addEventListener('DOMContentLoaded', () => {
    // NEW: Detect performance and set quality mode
    isLowQualityMode = detectPerformance();
    console.log(`Low Quality Mode: ${isLowQualityMode}`); // For debugging purposes

    loadLists();
    initThreeScene(planetData);
    updateTargetPlanet();

    Promise.all([new Promise(resolve => setTimeout(resolve, 500)), document.fonts.ready]).then(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        loadingScreen.addEventListener('transitionend', () => loadingScreen.remove());
    });
    feather.replace({ width: '1em', height: '1em' });

    // --- Event Listeners ---
    document.querySelectorAll('.lang-switcher').forEach(button => {
        button.addEventListener('click', () => {
            const newLang = (localStorage.getItem('wemarz_lang') || 'en') === 'en' ? 'my' : 'en';
            applyLanguage(newLang, document);
        });
    });

    document.getElementById('view-category-button').addEventListener('click', () => {
        if (targetPlanet && !isAnimatingCamera) {
            const categoryId = targetPlanet.userData.id;
            document.querySelector('.navigator-ui').style.opacity = '0';
            document.querySelectorAll('.nav-arrow').forEach(a => a.style.opacity = '0');
            
            animateCameraTransition(targetPlanet, () => {
                showGridView(categoryId);
            });
        }
    });

    // stream/js/script.js

function handleSystemBack() {
    if (currentView === 'player-view' && playerHistory.length > 1) {
        playerHistory.pop(); 
        const previousMovieData = playerHistory[playerHistory.length - 1]; 
        showPlayerView(previousMovieData.movie, true); 
    } else if (viewHistory.length > 0) {
        if(currentView === 'player-view') playerHistory = [];
        switchView(viewHistory.pop(), true);
    } else {
        // If there's no more internal history, check where we came from.
        // If we came from index.html, redirect back with a parameter to open the modal.
        if (document.referrer && (document.referrer.includes('index.html') || document.referrer.endsWith('/'))) {
            window.location.href = 'index.html?modal=case-study-main#portfolio';
        } else {
            // Default behavior if came from somewhere else
            if (currentView !== 'navigator-view') {
                switchView('navigator-view', true);
            }
        }
    }
}

    document.getElementById('header-back-button').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
    });

    window.addEventListener('popstate', (event) => {
        handleSystemBack();
    });
    
    document.getElementById('header-title').addEventListener('click', () => {
        switchView('navigator-view');
        viewHistory = []; 
        playerHistory = [];
    });

    // --- Search Logic ---
    const pcSearchBtn = document.getElementById('pc-search-button');
    const pcSearchInput = document.getElementById('pc-search-input');
    const pcSearchClearBtn = document.getElementById('pc-search-clear');
    const mobileSearchBtn = document.getElementById('mobile-search-button');
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileSearchBackBtn = document.getElementById('mobile-search-back');
    const mobileSearchClearBtn = document.getElementById('mobile-search-clear');

    pcSearchBtn.addEventListener('click', () => { 
        pcSearchInput.parentElement.parentElement.classList.toggle('active'); 
        if (pcSearchInput.parentElement.parentElement.classList.contains('active')) pcSearchInput.focus(); 
    });
    
    mobileSearchBtn.addEventListener('click', () => { 
        mobileSearchOverlay.classList.add('active'); 
        mobileSearchInput.focus(); 
    });
    
    mobileSearchBackBtn.addEventListener('click', () => mobileSearchOverlay.classList.remove('active'));

    let searchTimeout;

    const handleSearchInput = (e) => {
        const input = e.target;
        const clearBtn = input.id === 'pc-search-input' ? pcSearchClearBtn : mobileSearchClearBtn;
        
        if (input.value.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = input.value;
            performSearch(query);
        }, 300);
    };

    const handleClearSearch = (input, clearBtn) => {
        input.value = '';
        clearBtn.classList.remove('visible');
        performSearch('');
        input.focus();
    };

    pcSearchInput.addEventListener('input', handleSearchInput);
    mobileSearchInput.addEventListener('input', handleSearchInput);

    pcSearchClearBtn.addEventListener('click', () => handleClearSearch(pcSearchInput, pcSearchClearBtn));
    mobileSearchClearBtn.addEventListener('click', () => handleClearSearch(mobileSearchInput, mobileSearchClearBtn));


    // --- Comments Logic ---
    const toggleBtn = document.getElementById('toggle-comments-btn');
    const commentsSection = document.getElementById('comments-section');
    toggleBtn.addEventListener('click', () => {
        toggleBtn.classList.toggle('open');
        const lang = localStorage.getItem('wemarz_lang') || 'en';
        const showText = { en: 'Show Comments', my: 'မှတ်ချက်များပြရန်' };
        const hideText = { en: 'Hide Comments', my: 'မှတ်ချက်များဖျောက်ရန်' };

        if (toggleBtn.classList.contains('open')) {
            toggleBtn.querySelector('.lang-en').textContent = hideText.en;
            toggleBtn.querySelector('.lang-my').textContent = hideText.my;
            commentsSection.style.maxHeight = commentsSection.scrollHeight + 'px';
        } else {
            toggleBtn.querySelector('.lang-en').textContent = showText.en;
            toggleBtn.querySelector('.lang-my').textContent = showText.my;
            commentsSection.style.maxHeight = '0';
        }
    });
    
    // --- Mobile Menu Logic ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileNav = document.getElementById('mobile-nav');
    mobileMenuButton.addEventListener('click', () => mobileNav.classList.add('active'));
    document.getElementById('mobile-nav-close').addEventListener('click', () => mobileNav.classList.remove('active'));
    document.getElementById('watch-later-btn').addEventListener('click', (e) => { e.preventDefault(); showListView('watchLater'); mobileNav.classList.remove('active'); });
    document.getElementById('favorites-btn').addEventListener('click', (e) => { e.preventDefault(); showListView('favorites'); mobileNav.classList.remove('active'); });
    document.getElementById('pc-watch-later-btn').addEventListener('click', (e) => { e.preventDefault(); showListView('watchLater'); });
    document.getElementById('pc-favorites-btn').addEventListener('click', (e) => { e.preventDefault(); showListView('favorites'); });

    // --- AI Chat Listeners ---
    const aiChatButton = document.getElementById('ai-chat-button');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatCloseBtn = document.getElementById('ai-chat-close-btn');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    
    aiChatButton.addEventListener('click', () => {
        aiChatWindow.classList.toggle('active');
    });
    
    aiChatCloseBtn.addEventListener('click', () => {
        aiChatWindow.classList.remove('active');
    });

    // MODIFIED: Close chatbox when clicking outside of it
    document.addEventListener('click', (event) => {
        const isClickInsideChat = aiChatWindow.contains(event.target);
        const isClickOnToggleButton = aiChatButton.contains(event.target);

        if (aiChatWindow.classList.contains('active') && !isClickInsideChat && !isClickOnToggleButton) {
            aiChatWindow.classList.remove('active');
        }
    });

    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    applyLanguage(localStorage.getItem('wemarz_lang') || 'en', document);
});
