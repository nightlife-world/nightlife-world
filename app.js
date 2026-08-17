// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://umfwcqguwuwzfsczhndv.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jSF16kCRcEtcMFb0rITh6Q_hW2E2yGI";

const db =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==========================================
// DATI APP
// ==========================================

let venues = [];
let posts = [];

let currentCategory = "all";


// ==========================================
// MAPPA
// ==========================================

let map = null;
let markersLayer = null;


// ==========================================
// INIZIALIZZA MAPPA
// ==========================================

function initializeMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {

        console.error(
            "Elemento #map non trovato."
        );

        return;
    }

    map =
        L.map("map")
        .setView([20, 0], 2);


    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ).addTo(map);


    markersLayer =
        L.layerGroup()
        .addTo(map);

}


// ==========================================
// MOSTRA LOCALI SULLA MAPPA
// ==========================================

function showVenuesOnMap(list) {

    if (!map || !markersLayer) {
        return;
    }


    markersLayer.clearLayers();


    list.forEach(venue => {

        if (
            venue.latitude === null ||
            venue.longitude === null ||
            venue.latitude === undefined ||
            venue.longitude === undefined
        ) {

            return;

        }


        const marker =
            L.marker([
                Number(venue.latitude),
                Number(venue.longitude)
            ]);


        marker.bindPopup(`

            <div class="map-popup">

                <h3>
                    ${venue.name}
                </h3>

                <p>
                    📍 ${venue.city || ""}
                    ${
                        venue.country
                            ? ", " + venue.country
                            : ""
                    }
                </p>

                <p>
                    ⭐ ${venue.rating || 0}
                </p>

                <p>
                    💬 ${venue.reviews_count || 0}
                    recensioni
                </p>

                <button
                    onclick="openVenue(${venue.id})"
                >
                    Vedi locale
                </button>

            </div>

        `);


        marker.addTo(
            markersLayer
        );

    });

}


// ==========================================
// MOSTRA LOCALI NELLA LISTA
// ==========================================

function renderVenues(list) {

    const container =
        document.getElementById(
            "venues"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    if (resultCount) {

        resultCount.textContent =
            `${list.length} locali`;

    }


    if (list.length === 0) {

        container.innerHTML = `

            <div class="empty">

                Nessun locale trovato.

            </div>

        `;

        return;

    }


    list.forEach(venue => {

        const music =
            Array.isArray(venue.music)
                ? venue.music
                : [];


        container.innerHTML += `

            <article class="venue">

                <div class="venue-image">

                    ${
                        venue.image_url

                            ? `
                                <img
                                    src="${venue.image_url}"
                                    alt="${venue.name}"
                                >
                              `

                            : "🎧"
                    }

                </div>


                <div class="venue-info">

                    <div class="venue-name">
                        ${venue.name}
                    </div>


                    <div class="venue-city">

                        📍 ${venue.city || ""}

                        ${
                            venue.country
                                ? ", " + venue.country
                                : ""
                        }

                    </div>


                    <div class="rating">

                        ⭐ ${venue.rating || 0}

                        <span style="color:#777">

                            (${venue.reviews_count || 0})

                        </span>

                    </div>


                    <div class="tags">

                        <span class="tag">

                            ${venue.category || "Locale"}

                        </span>


                        ${music.map(
                            item =>
                            `
                            <span class="tag">
                                ${item}
                            </span>
                            `
                        ).join("")}

                    </div>


                    <button
                        class="venue-button"
                        onclick="openVenue(${venue.id})"
                    >

                        Vedi locale →

                    </button>

                </div>

            </article>

        `;

    });

}


// ==========================================
// CARICA LOCALI DA SUPABASE
// ==========================================

async function loadVenues() {

    const {
        data,
        error
    } = await db
        .from("venues")
        .select("*")
        .order(
            "rating",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Errore Supabase:",
            error
        );

        alert(
            "Errore nel caricamento dei locali."
        );

        return;
    }


    venues =
        data || [];


    renderVenues(
        venues
    );


    showVenuesOnMap(
        venues
    );

}


// ==========================================
// RICERCA
// ==========================================

function applyFilters() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const search =
        input
            ? input.value
                .toLowerCase()
            : "";


    let result =
        venues.filter(
            venue => {

                const music =
                    Array.isArray(
                        venue.music
                    )
                        ? venue.music
                        : [];


                const searchable = [

                    venue.name || "",

                    venue.city || "",

                    venue.country || "",

                    venue.category || "",

                    ...music

                ]
                .join(" ")
                .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    if (
        currentCategory !==
        "all"
    ) {

        result =
            result.filter(
                venue =>
                    venue.category ===
                    currentCategory
            );

    }


    renderVenues(
        result
    );


    showVenuesOnMap(
        result
    );

}


// ==========================================
// CATEGORIE
// ==========================================

function filterCategory(
    category,
    element
) {

    currentCategory =
        category;


    document
        .querySelectorAll(
            ".category"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }


    applyFilters();

}


// ==========================================
// DETTAGLI LOCALE
// ==========================================

function openVenue(id) {

    const venue =
        venues.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!venue) {

        console.error(
            "Locale non trovato:",
            id
        );

        return;
    }


    const details =
        document.getElementById(
            "venueDetails"
        );


    if (!details) {

        console.error(
            "Elemento venueDetails non trovato."
        );

        return;
    }


    const music =
        Array.isArray(
            venue.music
        )
            ? venue.music
            : [];


    details.innerHTML = `

        <div class="venue-image">

            ${
                venue.image_url

                    ? `
                        <img
                            src="${venue.image_url}"
                            alt="${venue.name}"
                        >
                      `

                    : "🎧"
            }

        </div>


        <h1 style="margin-top:20px">

            ${venue.name}

        </h1>


        <p style="
            color:#888;
            margin-top:7px;
        ">

            📍 ${venue.city || ""}

            ${
                venue.country
                    ? ", " + venue.country
                    : ""
            }

        </p>


        <div class="rating">

            ⭐ ${venue.rating || 0}

        </div>


        <p style="
            margin-top:20px;
            color:#aaa;
        ">

            ${venue.reviews_count || 0}
            recensioni

        </p>


        <div class="tags">

            <span class="tag">

                ${venue.category || "Locale"}

            </span>


            ${music.map(
                item =>
                `
                <span class="tag">
                    ${item}
                </span>
                `
            ).join("")}

        </div>


        ${
            venue.description

                ? `

                    <p style="
                        margin-top:20px;
                        color:#aaa;
                    ">

                        ${venue.description}

                    </p>

                  `

                : ""
        }


        <button
            class="main-button"
            style="margin-top:25px"
            onclick="
                alert(
                    'Qui inseriremo le recensioni.'
                )
            "
        >

            ⭐ Scrivi una recensione

        </button>

    `;


    const modal =
        document.getElementById(
            "venueModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// ==========================================
// CHIUDI MODALE LOCALE
// ==========================================

function closeModal() {

    const modal =
        document.getElementById(
            "venueModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ==========================================
// COMMUNITY
// ==========================================

function renderPosts() {

    const container =
        document.getElementById(
            "posts"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    posts.forEach(post => {

        container.innerHTML += `

            <article class="post">

                <div class="post-user">

                    👤 ${post.user}

                </div>


                <div class="post-venue">

                    📍 ${post.venue}

                </div>


                <div class="post-text">

                    ${post.text}

                </div>


                <div style="
                    margin-top:15px;
                    color:#777;
                ">

                    ❤️ 0
                    &nbsp;&nbsp;

                    💬 0
                    &nbsp;&nbsp;

                    ↗️

                </div>

            </article>

        `;

    });

}


// ==========================================
// APRI POST
// ==========================================

function openPost() {

    const modal =
        document.getElementById(
            "postModal"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// ==========================================
// CHIUDI POST
// ==========================================

function closePost() {

    const modal =
        document.getElementById(
            "postModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


// ==========================================
// PUBBLICA POST
// ==========================================

function publishPost() {

    const venueInput =
        document.getElementById(
            "postVenue"
        );


    const textInput =
        document.getElementById(
            "postText"
        );


    const venue =
        venueInput
            ? venueInput.value.trim()
            : "";


    const text =
        textInput
            ? textInput.value.trim()
            : "";


    if (!venue || !text) {

        alert(
            "Inserisci il locale e il testo."
        );

        return;
    }


    posts.unshift({

        user:
            "Nightlife User",

        venue:
            venue,

        text:
            text

    });


    if (venueInput) {

        venueInput.value = "";

    }


    if (textInput) {

        textInput.value = "";

    }


    closePost();

    renderPosts();


    alert(
        "Post pubblicato! 📸"
    );

}


// ==========================================
// NAVIGAZIONE
// ==========================================

function goTo(
    section,
    button
) {

    document
        .querySelectorAll(
            "main section"
        )
        .forEach(
            item => {

                item.style.display =
                    "none";

            }
        );


    const target =
        document.getElementById(
            section
        );


    if (target) {

        target.style.display =
            "block";

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    if (
        section ===
        "community"
    ) {

        renderPosts();

    }


    if (
        section ===
        "explore" &&
        map
    ) {

        setTimeout(
            () => {

                map.invalidateSize();

            },
            100
        );

    }

}


// ==========================================
// ESPLORE
// ==========================================

function showExplore() {

    const explore =
        document.getElementById(
            "explore"
        );


    if (explore) {

        explore.scrollIntoView({

            behavior:
                "smooth"

        });

    }

}


// ==========================================
// POSIZIONE
// ==========================================

function detectLocation() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "La geolocalizzazione non è disponibile."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            alert(

                "Posizione rilevata! 📍\n\n" +

                "Latitudine: " +

                position.coords.latitude +

                "\nLongitudine: " +

                position.coords.longitude

            );

        },


        () => {

            alert(
                "Non è stato possibile ottenere la posizione."
            );

        }

    );

}


// ==========================================
// AUTENTICAZIONE
// ==========================================

let authMode =
    "register";


// ==========================================
// CAMBIA LOGIN / REGISTRAZIONE
// ==========================================

function switchAuthMode() {

    const title =
        document.getElementById(
            "authTitle"
        );


    const subtitle =
        document.getElementById(
            "authSubtitle"
        );


    const username =
        document.getElementById(
            "authUsername"
        );


    const button =
        document.getElementById(
            "authSubmit"
        );


    const secondary =
        document.querySelector(
            "#authBox .auth-secondary"
        );


    if (
        authMode ===
        "register"
    ) {

        authMode =
            "login";


        title.textContent =
            "Bentornato";


        subtitle.textContent =
            "Accedi al tuo account NIGHTLIFE WORLD.";


        username.style.display =
            "none";


        button.textContent =
            "Accedi →";


        button.onclick =
            loginUser;


        secondary.textContent =
            "Non hai ancora un account? Registrati";

    }


    else {

        authMode =
            "register";


        title.textContent =
            "Crea il tuo account";


        subtitle.textContent =
            "Registrati per entrare nella community.";


        username.style.display =
            "block";


        button.textContent =
            "Registrati →";


        button.onclick =
            registerUser;


        secondary.textContent =
            "Hai già un account? Accedi";

    }

}


// ==========================================
// REGISTRAZIONE
// ==========================================

async function registerUser() {

    const username =
        document
        .getElementById(
            "authUsername"
        )
        .value
        .trim();


    const email =
        document
        .getElementById(
            "authEmail"
        )
        .value
        .trim();


    const password =
        document
        .getElementById(
            "authPassword"
        )
        .value;


    if (
        !username ||
        !email ||
        !password
    ) {

        alert(
            "Compila tutti i campi."
        );

        return;

    }


    if (
        password.length <
        6
    ) {

        alert(
            "La password deve contenere almeno 6 caratteri."
        );

        return;

    }


    const {
        data,
        error
    } =
        await db.auth.signUp({

            email:
                email,

            password:
                password,

            options: {

                emailRedirectTo:
                    "https://nightlife-world.github.io/nightlife-world/"

            }

        });


    if (error) {

        console.error(
            "Errore registrazione:",
            error
        );


        alert(
            error.message
        );


        return;

    }


    if (!data.user) {

        alert(
            "Registrazione non completata."
        );

        return;

    }


    alert(

        "Account creato! 🎉\n\n" +

        "Controlla la tua email e " +

        "conferma il tuo indirizzo.\n\n" +

        "Dopo la conferma potrai accedere."

    );

}


// ==========================================
// LOGIN
// ==========================================

async function loginUser() {

    const email =
        document
        .getElementById(
            "authEmail"
        )
        .value
        .trim();


    const password =
        document
        .getElementById(
            "authPassword"
        )
        .value;


    if (
        !email ||
        !password
    ) {

        alert(
            "Inserisci email e password."
        );

        return;

    }


    const {
        data,
        error
    } =
        await db.auth.signInWithPassword({

            email:
                email,

            password:
                password

        });


    if (error) {

        console.error(
            "Errore login:",
            error
        );


        alert(
            error.message
        );


        return;

    }


    await loadUserProfile(
        data.user
    );

}


// ==========================================
// CARICA PROFILO
// ==========================================

async function loadUserProfile(
    user
) {

    if (!user) {
        return;
    }


    const {
        data: profile,
        error
    } =
        await db
        .from("profiles")
        .select("username")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Errore caricamento profilo:",
            error
        );

    }


    if (profile) {

        showLoggedProfile(
            profile.username
        );

        return;

    }


    const username =
        user.email
            ? user.email.split("@")[0]
            : "Utente";


    const {
        error: insertError
    } =
        await db
        .from("profiles")
        .insert({

            id:
                user.id,

            username:
                username

        });


    if (
        insertError &&
        insertError.code !==
        "23505"
    ) {

        console.error(
            "Errore creazione profilo:",
            insertError
        );

    }


    showLoggedProfile(
        username
    );

}


// ==========================================
// MOSTRA PROFILO
// ==========================================

function showLoggedProfile(
    username
) {

    const authBox =
        document.getElementById(
            "authBox"
        );


    const loggedProfile =
        document.getElementById(
            "loggedProfile"
        );


    const loggedUsername =
        document.getElementById(
            "loggedUsername"
        );


    if (authBox) {

        authBox.style.display =
            "none";

    }


    if (loggedProfile) {

        loggedProfile.style.display =
            "block";

    }


    if (loggedUsername) {

        loggedUsername.textContent =
            username ||
            "Utente";

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

    const {
        error
    } =
        await db.auth.signOut();


    if (error) {

        console.error(
            error
        );


        alert(
            error.message
        );


        return;

    }


    const authBox =
        document.getElementById(
            "authBox"
        );


    const loggedProfile =
        document.getElementById(
            "loggedProfile"
        );


    if (authBox) {

        authBox.style.display =
            "block";

    }


    if (loggedProfile) {

        loggedProfile.style.display =
            "none";

    }


    authMode =
        "register";


    const title =
        document.getElementById(
            "authTitle"
        );


    const subtitle =
        document.getElementById(
            "authSubtitle"
        );


    const username =
        document.getElementById(
            "authUsername"
        );


    const button =
        document.getElementById(
            "authSubmit"
        );


    const secondary =
        document.querySelector(
            "#authBox .auth-secondary"
        );


    if (title) {

        title.textContent =
            "Crea il tuo account";

    }


    if (subtitle) {

        subtitle.textContent =
            "Registrati per entrare nella community.";

    }


    if (username) {

        username.style.display =
            "block";

    }


    if (button) {

        button.textContent =
            "Registrati →";

        button.onclick =
            registerUser;

    }


    if (secondary) {

        secondary.textContent =
            "Hai già un account? Accedi";

    }


    alert(
        "Hai effettuato il logout."
    );

}


// ==========================================
// CONTROLLO SESSIONE
// ==========================================

async function checkUserSession() {

    const {
        data,
        error
    } =
        await db.auth.getSession();


    if (error) {

        console.error(
            "Errore sessione:",
            error
        );

        return;

    }


    if (
        data &&
        data.session &&
        data.session.user
    ) {

        await loadUserProfile(
            data.session.user
        );

    }

}


// ==========================================
// AVVIO APP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeMap();


        await loadVenues();


        renderPosts();


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                applyFilters
            );

        }


        await checkUserSession();

    }
);


// ==========================================
// CAMBIO SESSIONE SUPABASE
// ==========================================

db.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        if (
            event ===
                "SIGNED_IN" &&
            session &&
            session.user
        ) {

            await loadUserProfile(
                session.user
            );

        }

    }
);