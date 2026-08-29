/* =========================================================
   HOUSING'S YQD
   SCRIPT PRINCIPAL
   VERSION : 1.0
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const YQD_CONFIG = {
    platformName: "Housing's YQD",

    currency: "FCFA",

    investmentDurationDays: 180,

    referralPercent: 10,

    storage: {
        users: "yqd_users",
        currentUser: "yqd_current_user",
        deposits: "yqd_deposits",
        withdrawals: "yqd_withdrawals",
        investments: "yqd_investments",
        tickets: "yqd_tickets",
        notifications: "yqd_notifications",
        adminSession: "yqd_admin_session"
    },

    packs: [
        {
            id: "starter",
            name: "Pack Starter",
            amount: 3000,
            dailyGain: 800,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
            description: "Une première opportunité accessible pour découvrir l'investissement immobilier."
        },
        {
            id: "familial",
            name: "Pack Familial",
            amount: 10000,
            dailyGain: 3000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
            description: "Un pack conçu pour les investisseurs souhaitant évoluer progressivement."
        },
        {
            id: "confort",
            name: "Pack Confort",
            amount: 20000,
            dailyGain: 6000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
            description: "Une formule immobilière moderne offrant une opportunité d'investissement structurée."
        },
        {
            id: "premium",
            name: "Pack Premium",
            amount: 45000,
            dailyGain: 14000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80",
            description: "Une opportunité destinée aux investisseurs recherchant davantage de potentiel."
        },
        {
            id: "prestige",
            name: "Pack Prestige",
            amount: 100000,
            dailyGain: 30000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=900&q=80",
            description: "Un investissement immobilier de niveau supérieur avec une présentation prestigieuse."
        },
        {
            id: "premium_plus",
            name: "Pack Premium Plus",
            amount: 200000,
            dailyGain: 65000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80",
            description: "Une formule premium pour les investisseurs souhaitant développer leur portefeuille."
        },
        {
            id: "elite",
            name: "Pack Elite",
            amount: 400000,
            dailyGain: 140000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=900&q=80",
            description: "Une offre immobilière haut de gamme destinée aux investisseurs ambitieux."
        },
        {
            id: "luxury",
            name: "Pack Luxury",
            amount: 800000,
            dailyGain: 290000,
            duration: 180,
            image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
            description: "Notre pack immobilier le plus prestigieux avec une résidence exceptionnelle."
        }
    ]
};


/* =========================================================
   CODE ADMINISTRATEUR
   IMPORTANT :
   POUR UNE VERSION PUBLIQUE, NE JAMAIS STOCKER
   UN SECRET ADMINISTRATEUR DANS JAVASCRIPT.
========================================================= */

const YQD_ADMIN_ACCESS_CODE = "937854M";


/* =========================================================
   OUTILS GENERAUX
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


function getStoredData(key, fallback) {

    try {

        const data =
            localStorage.getItem(key);

        return data
            ? JSON.parse(data)
            : fallback;

    } catch (error) {

        console.error(
            "Erreur de lecture localStorage :",
            error
        );

        return fallback;

    }

}


function setStoredData(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "Erreur d'enregistrement localStorage :",
            error
        );

        return false;

    }

}


function generateId(prefix = "YQD") {

    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


function generateReferralCode() {

    return (
        "YQD" +
        Math.floor(
            100000 +
            Math.random() * 900000
        )
    );

}


function formatFCFA(amount) {

    const value =
        Number(amount) || 0;

    return (
        new Intl.NumberFormat(
            "fr-FR",
            {
                maximumFractionDigits: 0
            }
        ).format(value) +
        " FCFA"
    );

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


function escapeHTML(value) {

    const text =
        String(value ?? "");

    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };

    return text.replace(
        /[&<>"']/g,
        function (character) {
            return map[character];
        }
    );

}


function getInitials(name) {

    if (!name) {
        return "U";
    }

    const parts =
        name.trim().split(/\s+/);

    return parts
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0).toUpperCase()
        )
        .join("");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        getElement("toastContainer");

    if (!container) {

        alert(message);

        return;

    }

    const toast =
        document.createElement("div");

    toast.className =
        "toast toast-" + type;

    let icon =
        "fa-circle-check";

    if (type === "error") {
        icon =
            "fa-circle-xmark";
    }

    if (type === "warning") {
        icon =
            "fa-triangle-exclamation";
    }

    if (type === "info") {
        icon =
            "fa-circle-info";
    }

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(
        function () {

            toast.classList.add(
                "show"
            );

        },
        10
    );

    setTimeout(
        function () {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                function () {

                    toast.remove();

                },
                300
            );

        },
        4500
    );

}


/* =========================================================
   LOADER
========================================================= */

function showLoader(
    text = "Chargement..."
) {

    const loader =
        getElement("pageLoader");

    if (!loader) {
        return;
    }

    const label =
        loader.querySelector("span");

    if (label) {
        label.textContent =
            text;
    }

    loader.style.display =
        "flex";

}


function hideLoader() {

    const loader =
        getElement("pageLoader");

    if (!loader) {
        return;
    }

    loader.style.display =
        "none";

}


/* =========================================================
   UTILISATEURS
========================================================= */

function getUsers() {

    return getStoredData(
        YQD_CONFIG.storage.users,
        []
    );

}


function saveUsers(users) {

    return setStoredData(
        YQD_CONFIG.storage.users,
        users
    );

}


function getCurrentUser() {

    return getStoredData(
        YQD_CONFIG.storage.currentUser,
        null
    );

}


function saveCurrentUser(user) {

    return setStoredData(
        YQD_CONFIG.storage.currentUser,
        user
    );

}


function updateUser(updatedUser) {

    const users =
        getUsers();

    const index =
        users.findIndex(
            user =>
                user.id === updatedUser.id
        );

    if (index === -1) {
        return false;
    }

    users[index] =
        updatedUser;

    saveUsers(users);

    const currentUser =
        getCurrentUser();

    if (
        currentUser &&
        currentUser.id === updatedUser.id
    ) {

        saveCurrentUser(
            updatedUser
        );

    }

    return true;

}


function findUserById(userId) {

    return getUsers().find(
        user =>
            user.id === userId
    );

}


function findUserByReferralCode(code) {

    if (!code) {
        return null;
    }

    return getUsers().find(
        user =>
            String(
                user.referralCode
            ).toUpperCase() ===
            String(code)
                .trim()
                .toUpperCase()
    );

}


/* =========================================================
   DONNEES FINANCIERES
========================================================= */

function getDeposits() {

    return getStoredData(
        YQD_CONFIG.storage.deposits,
        []
    );

}


function saveDeposits(deposits) {

    return setStoredData(
        YQD_CONFIG.storage.deposits,
        deposits
    );

}


function getWithdrawals() {

    return getStoredData(
        YQD_CONFIG.storage.withdrawals,
        []
    );

}


function saveWithdrawals(withdrawals) {

    return setStoredData(
        YQD_CONFIG.storage.withdrawals,
        withdrawals
    );

}


function getInvestments() {

    return getStoredData(
        YQD_CONFIG.storage.investments,
        []
    );

}


function saveInvestments(investments) {

    return setStoredData(
        YQD_CONFIG.storage.investments,
        investments
    );

}


function getTickets() {

    return getStoredData(
        YQD_CONFIG.storage.tickets,
        []
    );

}


function saveTickets(tickets) {

    return setStoredData(
        YQD_CONFIG.storage.tickets,
        tickets
    );

}


/* =========================================================
   INSCRIPTION
========================================================= */

function initializeRegisterPage() {

    const form =
        getElement("registerForm");

    if (!form) {
        return;
    }

    const referralInput =
        getElement("referralCode");

    const params =
        new URLSearchParams(
            window.location.search
        );

    const referralCode =
        params.get("ref");

    if (
        referralCode &&
        referralInput
    ) {

        referralInput.value =
            referralCode
                .trim()
                .toUpperCase();

    }


    const passwordInput =
        getElement("registerPassword");

    const confirmPasswordInput =
        getElement("confirmPassword");

    const togglePassword =
        getElement("toggleRegisterPassword");

    const toggleConfirm =
        getElement("toggleConfirmPassword");


    if (
        togglePassword &&
        passwordInput
    ) {

        togglePassword.addEventListener(
            "click",
            function () {

                const icon =
                    togglePassword.querySelector("i");

                const hidden =
                    passwordInput.type === "password";

                passwordInput.type =
                    hidden
                        ? "text"
                        : "password";

                if (icon) {

                    icon.className =
                        hidden
                            ? "fa-solid fa-eye-slash"
                            : "fa-solid fa-eye";

                }

            }
        );

    }


    if (
        toggleConfirm &&
        confirmPasswordInput
    ) {

        toggleConfirm.addEventListener(
            "click",
            function () {

                const icon =
                    toggleConfirm.querySelector("i");

                const hidden =
                    confirmPasswordInput.type ===
                    "password";

                confirmPasswordInput.type =
                    hidden
                        ? "text"
                        : "password";

                if (icon) {

                    icon.className =
                        hidden
                            ? "fa-solid fa-eye-slash"
                            : "fa-solid fa-eye";

                }

            }
        );

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const fullName =
                (
                    getElement("registerFullName")
                        ?.value ||
                    getElement("fullName")
                        ?.value ||
                    ""
                )
                    .trim();


            const email =
                (
                    getElement("registerEmail")
                        ?.value ||
                    getElement("email")
                        ?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const phone =
                (
                    getElement("registerPhone")
                        ?.value ||
                    getElement("phone")
                        ?.value ||
                    ""
                )
                    .trim();


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const confirmPassword =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : "";


            const referralCodeValue =
                referralInput
                    ? referralInput.value
                        .trim()
                        .toUpperCase()
                    : "";


            if (
                fullName.length < 3
            ) {

                showToast(
                    "Veuillez saisir votre nom complet.",
                    "error"
                );

                return;

            }


            if (
                !email ||
                !email.includes("@")
            ) {

                showToast(
                    "Veuillez saisir une adresse e-mail valide.",
                    "error"
                );

                return;

            }


            if (
                phone.length < 8
            ) {

                showToast(
                    "Veuillez saisir un numéro de téléphone valide.",
                    "error"
                );

                return;

            }


            if (
                password.length < 6
            ) {

                showToast(
                    "Le mot de passe doit contenir au moins 6 caractères.",
                    "error"
                );

                return;

            }


            if (
                confirmPassword &&
                password !== confirmPassword
            ) {

                showToast(
                    "Les mots de passe ne correspondent pas.",
                    "error"
                );

                return;

            }


            const users =
                getUsers();


            const existingUser =
                users.find(
                    user =>
                        user.email === email ||
                        user.phone === phone
                );


            if (
                existingUser
            ) {

                showToast(
                    "Un compte existe déjà avec cet e-mail ou ce numéro.",
                    "error"
                );

                return;

            }


            let referrerId =
                null;


            if (
                referralCodeValue
            ) {

                const referrer =
                    findUserByReferralCode(
                        referralCodeValue
                    );


                if (
                    !referrer
                ) {

                    showToast(
                        "Le code de parrainage est invalide.",
                        "error"
                    );

                    return;

                }


                referrerId =
                    referrer.id;

            }


            const newUser = {

                id:
                    generateId("USER"),

                fullName,

                email,

                phone,

                password,

                referralCode:
                    generateReferralCode(),

                referrerId,

                referralBonus:
                    0,

                referralRewarded:
                    false,

                balance:
                    0,

                invested:
                    0,

                earnings:
                    0,

                createdAt:
                    new Date().toISOString()

            };


            users.push(
                newUser
            );


            saveUsers(
                users
            );


            saveCurrentUser(
                newUser
            );


            showToast(
                "Inscription réussie. Bienvenue sur Housing's YQD.",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                1000
            );

        }
    );

}


/* =========================================================
   CONNEXION
========================================================= */

function initializeLoginPage() {

    const form =
        getElement("loginForm");

    if (!form) {
        return;
    }


    const passwordInput =
        getElement("loginPassword") ||
        getElement("password");


    const togglePassword =
        getElement("toggleLoginPassword");


    if (
        togglePassword &&
        passwordInput
    ) {

        togglePassword.addEventListener(
            "click",
            function () {

                const icon =
                    togglePassword.querySelector(
                        "i"
                    );

                const hidden =
                    passwordInput.type ===
                    "password";


                passwordInput.type =
                    hidden
                        ? "text"
                        : "password";


                if (icon) {

                    icon.className =
                        hidden
                            ? "fa-solid fa-eye-slash"
                            : "fa-solid fa-eye";

                }

            }
        );

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const identifier =
                (
                    getElement("loginIdentifier")
                        ?.value ||
                    getElement("loginEmail")
                        ?.value ||
                    getElement("email")
                        ?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const users =
                getUsers();


            const user =
                users.find(
                    currentUser =>
                        (
                            currentUser.email
                                ?.toLowerCase() ===
                            identifier
                        ) ||
                        (
                            currentUser.phone ===
                            identifier
                        )
                );


            if (
                !user ||
                user.password !== password
            ) {

                showToast(
                    "Identifiants incorrects.",
                    "error"
                );

                return;

            }


            saveCurrentUser(
                user
            );


            showLoader(
                "Connexion sécurisée..."
            );


            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                700
            );

        }
    );

}


/* =========================================================
   MOT DE PASSE OUBLIE
========================================================= */

function initializeForgotPasswordPage() {

    const form =
        getElement("forgotPasswordForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                (
                    getElement("forgotEmail")
                        ?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const messageBox =
                getElement(
                    "forgotPasswordMessage"
                );


            if (
                !email ||
                !email.includes("@")
            ) {

                if (messageBox) {

                    messageBox.style.display =
                        "block";

                    messageBox.style.background =
                        "#fee2e2";

                    messageBox.style.color =
                        "#991b1b";

                    messageBox.textContent =
                        "Veuillez saisir une adresse e-mail valide.";

                }

                return;

            }


            const user =
                getUsers().find(
                    item =>
                        item.email === email
                );


            if (messageBox) {

                messageBox.style.display =
                    "block";

                messageBox.style.background =
                    "#dcfce7";

                messageBox.style.color =
                    "#166534";

                messageBox.textContent =
                    "Si un compte correspond à cette adresse, les instructions de récupération seront traitées.";

            }


            /*
               VERSION DEMO :

               Aucun véritable e-mail ne peut être envoyé
               uniquement avec JavaScript et localStorage.

               Pour la production :
               Supabase Auth / serveur sécurisé.
            */

            if (user) {

                console.log(
                    "Demande de récupération pour :",
                    user.email
                );

            }

        }
    );

}


/* =========================================================
   VERIFICATION CONNEXION UTILISATEUR
========================================================= */

function requireUserSession() {

    if (
        !window.location.pathname.includes(
            "dashboard.html"
        )
    ) {
        return true;
    }


    const user =
        getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


/* =========================================================
   CALCUL DES INVESTISSEMENTS
========================================================= */

function getUserInvestments(userId) {

    return getInvestments().filter(
        investment =>
            investment.userId === userId
    );

}


function calculateInvestmentEarnings(
    investment
) {

    const now =
        new Date();

    const startDate =
        new Date(
            investment.startDate
        );

    const endDate =
        new Date(
            investment.endDate
        );


    if (
        now < startDate
    ) {
        return 0;
    }


    const effectiveDate =
        now > endDate
            ? endDate
            : now;


    const milliseconds =
        effectiveDate - startDate;


    const elapsedDays =
        Math.max(
            0,
            Math.floor(
                milliseconds /
                (1000 * 60 * 60 * 24)
            )
        );


    return (
        elapsedDays *
        Number(
            investment.dailyGain || 0
        )
    );

}


function refreshUserFinancials(user) {

    const investments =
        getUserInvestments(
            user.id
        );


    let invested =
        0;

    let earnings =
        0;


    investments.forEach(
        investment => {

            if (
                investment.status === "active"
            ) {

                invested +=
                    Number(
                        investment.amount
                    );

            }


            earnings +=
                calculateInvestmentEarnings(
                    investment
                );

        }
    );


    user.invested =
        invested;


    user.earnings =
        earnings;


    updateUser(
        user
    );


    return user;

}


/* =========================================================
   DASHBOARD UTILISATEUR
========================================================= */

function initializeDashboard() {

    if (
        !window.location.pathname.includes(
            "dashboard.html"
        )
    ) {
        return;
    }


    if (
        !requireUserSession()
    ) {
        return;
    }


    let user =
        getCurrentUser();


    user =
        refreshUserFinancials(
            user
        );


    updateDashboardIdentity(
        user
    );


    renderDashboardBalances(
        user
    );


    renderPacks();


    renderRecentActivity(
        user
    );


    renderUserInvestments(
        user
    );


    renderHistory(
        user
    );


    renderReferral(
        user
    );


    renderReferrals(
        user
    );


    renderTickets(
        user
    );


    renderProfile(
        user
    );


    initializeDepositForm(
        user
    );


    initializeWithdrawForm(
        user
    );


    initializeSupportForm(
        user
    );


    initializeProfileForm(
        user
    );


    initializeReferralButtons();


    initializeInvestmentModal();


    initializeUserLogout();

}


/* =========================================================
   IDENTITE UTILISATEUR
========================================================= */

function updateDashboardIdentity(user) {

    const userName =
        getElement("userName");

    const userAvatar =
        getElement("userAvatar");

    const profileAvatar =
        getElement("profileAvatar");

    const welcomeMessage =
        getElement("welcomeMessage");


    if (userName) {

        userName.textContent =
            user.fullName;

    }


    if (userAvatar) {

        userAvatar.textContent =
            getInitials(
                user.fullName
            );

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            getInitials(
                user.fullName
            );

    }


    if (welcomeMessage) {

        const firstName =
            user.fullName
                .split(" ")[0];

        welcomeMessage.textContent =
            "Bienvenue " +
            firstName +
            " 👋";

    }

}


/* =========================================================
   SOLDES
========================================================= */

function renderDashboardBalances(user) {

    const available =
        getElement(
            "availableBalance"
        );

    const invested =
        getElement(
            "investedBalance"
        );

    const earnings =
        getElement(
            "totalEarnings"
        );

    const referral =
        getElement(
            "referralBalance"
        );


    if (available) {

        available.textContent =
            formatFCFA(
                user.balance
            );

    }


    if (invested) {

        invested.textContent =
            formatFCFA(
                user.invested
            );

    }


    if (earnings) {

        earnings.textContent =
            formatFCFA(
                user.earnings
            );

    }


    if (referral) {

        referral.textContent =
            formatFCFA(
                user.referralBonus
            );

    }

}


/* =========================================================
   PACKS
========================================================= */

function renderPacks() {

    const container =
        getElement(
            "packsContainer"
        );

    if (!container) {
        return;
    }


    container.innerHTML =
        YQD_CONFIG.packs
            .map(
                pack => {

                    const totalPotential =
                        pack.dailyGain *
                        pack.duration;


                    return `
                        <article class="pack-card">

                            <div class="pack-image">

                                <img
                                    src="${escapeHTML(pack.image)}"
                                    alt="${escapeHTML(pack.name)}"
                                    loading="lazy"
                                >

                            </div>

                            <div class="pack-content">

                                <h3>
                                    ${escapeHTML(pack.name)}
                                </h3>

                                <p>
                                    ${escapeHTML(pack.description)}
                                </p>

                                <div class="pack-price">
                                    ${formatFCFA(pack.amount)}
                                </div>

                                <div class="pack-details">

                                    <div>
                                        <span>Durée</span>
                                        <strong>
                                            ${pack.duration} jours
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Gain quotidien</span>
                                        <strong>
                                            ${formatFCFA(pack.dailyGain)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Gain théorique maximal</span>
                                        <strong>
                                            ${formatFCFA(totalPotential)}
                                        </strong>
                                    </div>

                                </div>

                                <button
                                    class="btn btn-primary invest-button"
                                    type="button"
                                    data-pack-id="${escapeHTML(pack.id)}"
                                >

                                    <i class="fa-solid fa-chart-line"></i>

                                    Investir

                                </button>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    document.querySelectorAll(
        ".invest-button"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    openInvestmentModal(
                        button.dataset.packId
                    );

                }
            );

        }
    );

}


/* =========================================================
   MODAL INVESTISSEMENT
========================================================= */

function initializeInvestmentModal() {

    const modal =
        getElement(
            "investmentModal"
        );

    if (!modal) {
        return;
    }

}


function openInvestmentModal(packId) {

    const pack =
        YQD_CONFIG.packs.find(
            item =>
                item.id === packId
        );


    if (!pack) {
        return;
    }


    const content =
        getElement(
            "investmentModalContent"
        );


    const modal =
        getElement(
            "investmentModal"
        );


    if (
        !content ||
        !modal
    ) {
        return;
    }


    content.innerHTML = `

        <div class="investment-confirmation">

            <h4>
                ${escapeHTML(pack.name)}
            </h4>

            <p>
                Montant nécessaire :
                <strong>
                    ${formatFCFA(pack.amount)}
                </strong>
            </p>

            <p>
                Durée :
                <strong>
                    ${pack.duration} jours
                </strong>
            </p>

            <p>
                Gain quotidien affiché :
                <strong>
                    ${formatFCFA(pack.dailyGain)}
                </strong>
            </p>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    id="confirmInvestmentButton"
                >

                    Confirmer l'investissement

                </button>

            </div>

        </div>

    `;


    modal.classList.add(
        "active"
    );


    const confirmButton =
        getElement(
            "confirmInvestmentButton"
        );


    if (
        confirmButton
    ) {

        confirmButton.addEventListener(
            "click",
            function () {

                createInvestment(
                    pack
                );

            }
        );

    }

}


/* =========================================================
   CREATION INVESTISSEMENT
========================================================= */

function createInvestment(pack) {

    const user =
        getCurrentUser();


    if (!user) {
        return;
    }


    if (
        Number(user.balance) <
        Number(pack.amount)
    ) {

        showToast(
            "Solde insuffisant pour effectuer cet investissement.",
            "error"
        );

        return;

    }


    user.balance =
        Number(user.balance) -
        Number(pack.amount);


    const startDate =
        new Date();


    const endDate =
        new Date(
            startDate.getTime()
        );


    endDate.setDate(
        endDate.getDate() +
        Number(pack.duration)
    );


    const investment = {

        id:
            generateId(
                "INV"
            ),

        userId:
            user.id,

        packId:
            pack.id,

        packName:
            pack.name,

        amount:
            Number(
                pack.amount
            ),

        dailyGain:
            Number(
                pack.dailyGain
            ),

        duration:
            Number(
                pack.duration
            ),

        startDate:
            startDate.toISOString(),

        endDate:
            endDate.toISOString(),

        status:
            "active",

        createdAt:
            new Date().toISOString()

    };


    const investments =
        getInvestments();


    investments.push(
        investment
    );


    saveInvestments(
        investments
    );


    user.invested =
        Number(
            user.invested
        ) +
        Number(
            pack.amount
        );


    updateUser(
        user
    );


    const modal =
        getElement(
            "investmentModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    showToast(
        "Votre investissement est maintenant actif.",
        "success"
    );


    initializeDashboard();

}


/* =========================================================
   DEPOT
========================================================= */

function initializeDepositForm() {

    const form =
        getElement(
            "depositForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const user =
                getCurrentUser();


            if (!user) {
                return;
            }


            const amount =
                Number(
                    getElement(
                        "depositAmount"
                    ).value
                );


            const method =
                getElement(
                    "depositMethod"
                ).value;


            const reference =
                getElement(
                    "depositReference"
                ).value
                    .trim();


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {

                showToast(
                    "Veuillez saisir un montant valide.",
                    "error"
                );

                return;

            }


            if (
                !method ||
                !reference
            ) {

                showToast(
                    "Veuillez remplir toutes les informations.",
                    "error"
                );

                return;

            }


            const deposits =
                getDeposits();


            deposits.push(
                {

                    id:
                        generateId(
                            "DEP"
                        ),

                    userId:
                        user.id,

                    amount,

                    method,

                    reference,

                    status:
                        "pending",

                    createdAt:
                        new Date().toISOString(),

                    validatedAt:
                        null,

                    rejectedAt:
                        null

                }
            );


            saveDeposits(
                deposits
            );


            form.reset();


            showToast(
                "Votre demande de dépôt a été envoyée à l'administration.",
                "success"
            );


            renderRecentActivity(
                user
            );


            renderHistory(
                user
            );

        }
    );

}


/* =========================================================
   RETRAIT
========================================================= */

function initializeWithdrawForm() {

    const form =
        getElement(
            "withdrawForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const user =
                getCurrentUser();


            if (!user) {
                return;
            }


            const amount =
                Number(
                    getElement(
                        "withdrawAmount"
                    ).value
                );


            const method =
                getElement(
                    "withdrawMethod"
                ).value;


            const account =
                getElement(
                    "withdrawAccount"
                ).value
                    .trim();


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount <= 0
            ) {

                showToast(
                    "Veuillez saisir un montant valide.",
                    "error"
                );

                return;

            }


            if (
                amount >
                Number(
                    user.balance
                )
            ) {

                showToast(
                    "Votre solde disponible est insuffisant.",
                    "error"
                );

                return;

            }


            const withdrawals =
                getWithdrawals();


            withdrawals.push(
                {

                    id:
                        generateId(
                            "WIT"
                        ),

                    userId:
                        user.id,

                    amount,

                    method,

                    account,

                    status:
                        "pending",

                    createdAt:
                        new Date().toISOString(),

                    validatedAt:
                        null,

                    rejectedAt:
                        null

                }
            );


            saveWithdrawals(
                withdrawals
            );


            form.reset();


            showToast(
                "Votre demande de retrait a été envoyée à l'administration.",
                "success"
            );


            renderRecentActivity(
                user
            );


            renderHistory(
                user
            );

        }
    );

}


/* =========================================================
   ACTIVITE RECENTE
========================================================= */

function renderRecentActivity(user) {

    const body =
        getElement(
            "recentActivityBody"
        );

    if (!body) {
        return;
    }


    const deposits =
        getDeposits()
            .filter(
                deposit =>
                    deposit.userId === user.id
            )
            .map(
                deposit => ({
                    type: "Dépôt",
                    amount:
                        deposit.amount,
                    date:
                        deposit.createdAt,
                    status:
                        deposit.status
                })
            );


    const withdrawals =
        getWithdrawals()
            .filter(
                withdrawal =>
                    withdrawal.userId === user.id
            )
            .map(
                withdrawal => ({
                    type: "Retrait",
                    amount:
                        withdrawal.amount,
                    date:
                        withdrawal.createdAt,
                    status:
                        withdrawal.status
                })
            );


    const operations =
        [
            ...deposits,
            ...withdrawals
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            )
            .slice(
                0,
                6
            );


    if (
        operations.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="4">
                    Aucune opération pour le moment.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        operations
            .map(
                operation => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                operation.type
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                operation.amount
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                operation.date
                            )}
                        </td>

                        <td>
                            ${renderStatus(
                                operation.status
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   HISTORIQUE UTILISATEUR
========================================================= */

function renderHistory(user) {

    const body =
        getElement(
            "historyBody"
        );

    if (!body) {
        return;
    }


    const deposits =
        getDeposits()
            .filter(
                deposit =>
                    deposit.userId === user.id
            )
            .map(
                deposit => ({
                    type: "Dépôt",
                    amount:
                        deposit.amount,
                    details:
                        deposit.method +
                        " - " +
                        deposit.reference,
                    date:
                        deposit.createdAt,
                    status:
                        deposit.status
                })
            );


    const withdrawals =
        getWithdrawals()
            .filter(
                withdrawal =>
                    withdrawal.userId === user.id
            )
            .map(
                withdrawal => ({
                    type: "Retrait",
                    amount:
                        withdrawal.amount,
                    details:
                        withdrawal.method +
                        " - " +
                        withdrawal.account,
                    date:
                        withdrawal.createdAt,
                    status:
                        withdrawal.status
                })
            );


    const operations =
        [
            ...deposits,
            ...withdrawals
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            );


    if (
        operations.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="5">
                    Aucune opération enregistrée.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        operations
            .map(
                operation => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                operation.type
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                operation.amount
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                operation.details
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                operation.date
                            )}
                        </td>

                        <td>
                            ${renderStatus(
                                operation.status
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   STATUT
========================================================= */

function renderStatus(status) {

    const labels = {

        pending:
            "En attente",

        approved:
            "Validé",

        rejected:
            "Refusé",

        active:
            "Actif",

        completed:
            "Terminé",

        open:
            "Ouvert",

        answered:
            "Répondu",

        closed:
            "Fermé"

    };


    return `
        <span class="status status-${escapeHTML(status)}">
            ${escapeHTML(
                labels[status] ||
                status
            )}
        </span>
    `;

}


/* =========================================================
   INVESTISSEMENTS UTILISATEUR
========================================================= */

function renderUserInvestments(user) {

    const preview =
        getElement(
            "activeInvestmentsPreview"
        );

    const container =
        getElement(
            "activeInvestmentsContainer"
        );


    const investments =
        getUserInvestments(
            user.id
        );


    const activeInvestments =
        investments.filter(
            investment =>
                investment.status === "active"
        );


    if (preview) {

        if (
            activeInvestments.length === 0
        ) {

            preview.innerHTML = `
                <p class="text-muted">
                    Aucun investissement actif.
                </p>
            `;

        } else {

            preview.innerHTML =
                activeInvestments
                    .slice(0, 3)
                    .map(
                        investment => `

                            <div class="investment-item">

                                <strong>
                                    ${escapeHTML(
                                        investment.packName
                                    )}
                                </strong>

                                <span>
                                    ${formatFCFA(
                                        investment.amount
                                    )}
                                </span>

                                <span>
                                    Fin :
                                    ${formatDate(
                                        investment.endDate
                                    )}
                                </span>

                            </div>

                        `
                    )
                    .join("");

        }

    }


    if (!container) {
        return;
    }


    if (
        investments.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted">
                Aucun investissement actif.
            </p>
        `;

        return;

    }


    container.innerHTML =
        investments
            .map(
                investment => {

                    const now =
                        new Date();

                    const end =
                        new Date(
                            investment.endDate
                        );

                    const totalDuration =
                        investment.duration;

                    const elapsed =
                        Math.min(
                            totalDuration,
                            Math.max(
                                0,
                                Math.floor(
                                    (
                                        now -
                                        new Date(
                                            investment.startDate
                                        )
                                    ) /
                                    (
                                        1000 *
                                        60 *
                                        60 *
                                        24
                                    )
                                )
                            )
                        );

                    const progress =
                        Math.min(
                            100,
                            Math.round(
                                (
                                    elapsed /
                                    totalDuration
                                ) *
                                100
                            )
                        );


                    return `

                        <div class="investment-card">

                            <div class="investment-card-header">

                                <div>

                                    <h4>
                                        ${escapeHTML(
                                            investment.packName
                                        )}
                                    </h4>

                                    <span>
                                        ${renderStatus(
                                            investment.status
                                        )}
                                    </span>

                                </div>

                                <strong>
                                    ${formatFCFA(
                                        investment.amount
                                    )}
                                </strong>

                            </div>

                            <div class="investment-progress">

                                <div class="progress-info">

                                    <span>
                                        Progression
                                    </span>

                                    <strong>
                                        ${elapsed}/${totalDuration} jours
                                    </strong>

                                </div>

                                <div class="progress-bar">

                                    <span
                                        style="width: ${progress}%"
                                    ></span>

                                </div>

                            </div>

                            <div class="investment-meta">

                                <span>
                                    Début :
                                    ${formatDate(
                                        investment.startDate
                                    )}
                                </span>

                                <span>
                                    Fin :
                                    ${formatDate(
                                        investment.endDate
                                    )}
                                </span>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   PARRAINAGE
========================================================= */

function renderReferral(user) {

    const code =
        getElement(
            "userReferralCode"
        );

    const link =
        getElement(
            "referralLink"
        );


    if (code) {

        code.textContent =
            user.referralCode;

    }


    if (link) {

        const baseURL =
            window.location.origin +
            window.location.pathname
                .replace(
                    /dashboard\.html.*$/,
                    ""
                );

        link.textContent =
            baseURL +
            "register.html?ref=" +
            encodeURIComponent(
                user.referralCode
            );

    }

}


function renderReferrals(user) {

    const body =
        getElement(
            "referralsBody"
        );

    if (!body) {
        return;
    }


    const referrals =
        getUsers().filter(
            item =>
                item.referrerId === user.id
        );


    if (
        referrals.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="3">
                    Aucun filleul enregistré.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        referrals
            .map(
                referral => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                referral.fullName
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                referral.createdAt
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                referral.referralRewarded
                                    ? referral.referralRewardAmount || 0
                                    : 0
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");

}


function initializeReferralButtons() {

    const copyCode =
        getElement(
            "copyReferralCode"
        );

    const copyLink =
        getElement(
            "copyReferralLink"
        );


    if (copyCode) {

        copyCode.addEventListener(
            "click",
            function () {

                const user =
                    getCurrentUser();

                if (!user) {
                    return;
                }

                copyToClipboard(
                    user.referralCode
                );

            }
        );

    }


    if (copyLink) {

        copyLink.addEventListener(
            "click",
            function () {

                const link =
                    getElement(
                        "referralLink"
                    );

                if (!link) {
                    return;
                }

                copyToClipboard(
                    link.textContent
                );

            }
        );

    }

}


function copyToClipboard(text) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        navigator.clipboard
            .writeText(text)
            .then(
                function () {

                    showToast(
                        "Copié avec succès.",
                        "success"
                    );

                }
            )
            .catch(
                function () {

                    showToast(
                        "Impossible de copier automatiquement.",
                        "error"
                    );

                }
            );

    } else {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        try {

            document.execCommand(
                "copy"
            );

            showToast(
                "Copié avec succès.",
                "success"
            );

        } catch (error) {

            showToast(
                "Impossible de copier.",
                "error"
            );

        }

        textarea.remove();

    }

}


/* =========================================================
   ASSISTANCE UTILISATEUR
========================================================= */

function initializeSupportForm(user) {

    const form =
        getElement(
            "supportForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const subject =
                getElement(
                    "ticketSubject"
                ).value.trim();


            const message =
                getElement(
                    "ticketMessage"
                ).value.trim();


            if (
                subject.length < 3 ||
                message.length < 5
            ) {

                showToast(
                    "Veuillez fournir davantage de détails.",
                    "error"
                );

                return;

            }


            const tickets =
                getTickets();


            tickets.push(
                {

                    id:
                        generateId(
                            "TICKET"
                        ),

                    userId:
                        user.id,

                    subject,

                    message,

                    reply:
                        "",

                    status:
                        "open",

                    createdAt:
                        new Date().toISOString(),

                    repliedAt:
                        null

                }
            );


            saveTickets(
                tickets
            );


            form.reset();


            renderTickets(
                user
            );


            showToast(
                "Votre ticket a été envoyé.",
                "success"
            );

        }
    );

}


function renderTickets(user) {

    const container =
        getElement(
            "ticketsContainer"
        );

    if (!container) {
        return;
    }


    const tickets =
        getTickets()
            .filter(
                ticket =>
                    ticket.userId === user.id
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            );


    if (
        tickets.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted">
                Aucun ticket pour le moment.
            </p>
        `;

        return;

    }


    container.innerHTML =
        tickets
            .map(
                ticket => `

                    <article class="ticket-item">

                        <div class="ticket-header">

                            <strong>
                                ${escapeHTML(
                                    ticket.subject
                                )}
                            </strong>

                            ${renderStatus(
                                ticket.status
                            )}

                        </div>

                        <p>
                            ${escapeHTML(
                                ticket.message
                            )}
                        </p>

                        ${
                            ticket.reply
                                ? `
                                    <div class="ticket-reply">

                                        <strong>
                                            Réponse de l'administration :
                                        </strong>

                                        <p>
                                            ${escapeHTML(
                                                ticket.reply
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                        }

                        <small>
                            ${formatDate(
                                ticket.createdAt
                            )}
                        </small>

                    </article>

                `
            )
            .join("");

}


/* =========================================================
   PROFIL
========================================================= */

function renderProfile(user) {

    const profileName =
        getElement(
            "profileName"
        );

    const profileEmail =
        getElement(
            "profileEmail"
        );

    const profilePhone =
        getElement(
            "profilePhone"
        );

    const fullNameInput =
        getElement(
            "profileFullName"
        );

    const emailInput =
        getElement(
            "profileEmailInput"
        );

    const phoneInput =
        getElement(
            "profilePhoneInput"
        );


    if (profileName) {

        profileName.textContent =
            user.fullName;

    }


    if (profileEmail) {

        profileEmail.textContent =
            user.email;

    }


    if (profilePhone) {

        profilePhone.textContent =
            user.phone;

    }


    if (fullNameInput) {

        fullNameInput.value =
            user.fullName;

    }


    if (emailInput) {

        emailInput.value =
            user.email;

    }


    if (phoneInput) {

        phoneInput.value =
            user.phone;

    }

}


function initializeProfileForm() {

    const form =
        getElement(
            "profileForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const user =
                getCurrentUser();

            if (!user) {
                return;
            }


            const fullName =
                getElement(
                    "profileFullName"
                ).value.trim();


            const email =
                getElement(
                    "profileEmailInput"
                ).value
                    .trim()
                    .toLowerCase();


            const phone =
                getElement(
                    "profilePhoneInput"
                ).value.trim();


            if (
                fullName.length < 3 ||
                !email.includes("@") ||
                phone.length < 8
            ) {

                showToast(
                    "Veuillez vérifier vos informations.",
                    "error"
                );

                return;

            }


            const users =
                getUsers();


            const duplicate =
                users.find(
                    item =>
                        item.id !== user.id &&
                        (
                            item.email === email ||
                            item.phone === phone
                        )
                );


            if (duplicate) {

                showToast(
                    "Cet e-mail ou ce numéro appartient déjà à un autre compte.",
                    "error"
                );

                return;

            }


            user.fullName =
                fullName;

            user.email =
                email;

            user.phone =
                phone;


            updateUser(
                user
            );


            updateDashboardIdentity(
                user
            );


            renderProfile(
                user
            );


            showToast(
                "Profil mis à jour avec succès.",
                "success"
            );

        }
    );

}


/* =========================================================
   DECONNEXION UTILISATEUR
========================================================= */

function initializeUserLogout() {

    const button =
        getElement(
            "logoutButton"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                YQD_CONFIG.storage.currentUser
            );


            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   ADMIN SESSION
========================================================= */

function getAdminSession() {

    return getStoredData(
        YQD_CONFIG.storage.adminSession,
        null
    );

}


function saveAdminSession(session) {

    return setStoredData(
        YQD_CONFIG.storage.adminSession,
        session
    );

}


function clearAdminSession() {

    localStorage.removeItem(
        YQD_CONFIG.storage.adminSession
    );

}


/* =========================================================
   INITIALISATION ADMIN
========================================================= */

function initializeAdmin() {

    if (
        !window.location.pathname.includes(
            "admin.html"
        )
    ) {
        return;
    }


    const authScreen =
        getElement(
            "adminAuthScreen"
        );

    const panel =
        getElement(
            "adminPanel"
        );


    const session =
        getAdminSession();


    if (
        session &&
        session.authenticated === true
    ) {

        if (authScreen) {

            authScreen.style.display =
                "none";

        }

        if (panel) {

            panel.style.display =
                "block";

        }


        initializeAdminPanel();

    } else {

        if (authScreen) {

            authScreen.style.display =
                "flex";

        }

        if (panel) {

            panel.style.display =
                "none";

        }


        initializeAdminAuth();

    }

}


/* =========================================================
   AUTH ADMIN
========================================================= */

function initializeAdminAuth() {

    const form =
        getElement(
            "adminCodeForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const input =
                getElement(
                    "adminAccessCode"
                );


            const message =
                getElement(
                    "adminAuthMessage"
                );


            const code =
                input.value.trim();


            if (
                code !==
                YQD_ADMIN_ACCESS_CODE
            ) {

                if (message) {

                    message.style.display =
                        "block";

                    message.style.background =
                        "#fee2e2";

                    message.style.color =
                        "#991b1b";

                    message.textContent =
                        "Code administrateur incorrect.";

                }

                return;

            }


            saveAdminSession(
                {
                    authenticated: true,
                    createdAt:
                        new Date().toISOString()
                }
            );


            if (message) {

                message.style.display =
                    "block";

                message.style.background =
                    "#dcfce7";

                message.style.color =
                    "#166534";

                message.textContent =
                    "Vérification réussie. Chargement...";

            }


            setTimeout(
                function () {

                    initializeAdmin();

                },
                500
            );

        }
    );

}


/* =========================================================
   PANEL ADMIN
========================================================= */

function initializeAdminPanel() {

    renderAdminOverview();

    renderAdminUsers();

    renderAdminDeposits();

    renderAdminWithdrawals();

    renderAdminInvestments();

    renderAdminTickets();

    renderAdminTransactions();

    initializeAdminFilters();

    initializeAdminLogout();

    initializeTicketReplyForm();

}


/* =========================================================
   ADMIN OVERVIEW
========================================================= */

function renderAdminOverview() {

    const users =
        getUsers();

    const deposits =
        getDeposits();

    const withdrawals =
        getWithdrawals();

    const investments =
        getInvestments();


    const pendingDeposits =
        deposits.filter(
            deposit =>
                deposit.status ===
                "pending"
        );


    const pendingWithdrawals =
        withdrawals.filter(
            withdrawal =>
                withdrawal.status ===
                "pending"
        );


    const activeInvestments =
        investments.filter(
            investment =>
                investment.status ===
                "active"
        );


    setText(
        "adminTotalUsers",
        users.length
    );


    setText(
        "adminPendingDeposits",
        pendingDeposits.length
    );


    setText(
        "adminPendingWithdrawals",
        pendingWithdrawals.length
    );


    setText(
        "adminActiveInvestments",
        activeInvestments.length
    );


    setText(
        "pendingDepositsCount",
        pendingDeposits.length
    );


    setText(
        "pendingWithdrawalsCount",
        pendingWithdrawals.length
    );


    const openTickets =
        getTickets().filter(
            ticket =>
                ticket.status ===
                "open"
        );


    setText(
        "pendingTicketsCount",
        openTickets.length
    );


    renderAdminRecentActivity();

    renderAdminRecentTickets();

}


function setText(id, value) {

    const element =
        getElement(id);

    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ADMIN UTILISATEURS
========================================================= */

function renderAdminUsers() {

    const body =
        getElement(
            "adminUsersBody"
        );

    if (!body) {
        return;
    }


    const users =
        getUsers();


    if (
        users.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun utilisateur enregistré.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        users
            .map(
                user => `

                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    user.fullName
                                )}
                            </strong>

                            <br>

                            <small>
                                ${escapeHTML(
                                    user.email
                                )}
                            </small>

                        </td>

                        <td>
                            ${escapeHTML(
                                user.phone
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                user.balance
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                user.invested
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                user.createdAt
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-small admin-user-details"
                                type="button"
                                data-user-id="${escapeHTML(user.id)}"
                            >

                                Voir

                            </button>

                        </td>

                    </tr>

                `
            )
            .join("");


    document.querySelectorAll(
        ".admin-user-details"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    openUserDetails(
                        button.dataset.userId
                    );

                }
            );

        }
    );

}


/* =========================================================
   DETAILS UTILISATEUR
========================================================= */

function openUserDetails(userId) {

    const user =
        findUserById(
            userId
        );


    if (!user) {
        return;
    }


    const content =
        getElement(
            "userDetailsContent"
        );


    const modal =
        getElement(
            "userDetailsModal"
        );


    if (
        !content ||
        !modal
    ) {
        return;
    }


    const investments =
        getUserInvestments(
            user.id
        );


    content.innerHTML = `

        <div class="user-details-grid">

            <div>

                <span>Nom</span>

                <strong>
                    ${escapeHTML(
                        user.fullName
                    )}
                </strong>

            </div>

            <div>

                <span>E-mail</span>

                <strong>
                    ${escapeHTML(
                        user.email
                    )}
                </strong>

            </div>

            <div>

                <span>Téléphone</span>

                <strong>
                    ${escapeHTML(
                        user.phone
                    )}
                </strong>

            </div>

            <div>

                <span>Solde</span>

                <strong>
                    ${formatFCFA(
                        user.balance
                    )}
                </strong>

            </div>

            <div>

                <span>Capital investi</span>

                <strong>
                    ${formatFCFA(
                        user.invested
                    )}
                </strong>

            </div>

            <div>

                <span>Code de parrainage</span>

                <strong>
                    ${escapeHTML(
                        user.referralCode
                    )}
                </strong>

            </div>

            <div>

                <span>Inscription</span>

                <strong>
                    ${formatDate(
                        user.createdAt
                    )}
                </strong>

            </div>

        </div>

        <hr>

        <h4>
            Investissements
        </h4>

        <p>
            Nombre :
            <strong>
                ${investments.length}
            </strong>
        </p>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   ADMIN DEPOTS
========================================================= */

function renderAdminDeposits() {

    const body =
        getElement(
            "adminDepositsBody"
        );

    if (!body) {
        return;
    }


    const filter =
        getElement(
            "depositStatusFilter"
        )?.value ||
        "all";


    let deposits =
        getDeposits();


    if (
        filter !== "all"
    ) {

        deposits =
            deposits.filter(
                deposit =>
                    deposit.status ===
                    filter
            );

    }


    deposits =
        deposits.sort(
            (a, b) =>
                new Date(
                    b.createdAt
                ) -
                new Date(
                    a.createdAt
                )
        );


    if (
        deposits.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="7">
                    Aucune demande de dépôt.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        deposits
            .map(
                deposit => {

                    const user =
                        findUserById(
                            deposit.userId
                        );


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    user?.fullName ||
                                    "Utilisateur supprimé"
                                )}
                            </td>

                            <td>
                                ${formatFCFA(
                                    deposit.amount
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    deposit.method
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    deposit.reference
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    deposit.createdAt
                                )}
                            </td>

                            <td>
                                ${renderStatus(
                                    deposit.status
                                )}
                            </td>

                            <td>

                                ${
                                    deposit.status ===
                                    "pending"
                                        ? `

                                            <button
                                                class="btn btn-small approve-deposit"
                                                data-deposit-id="${escapeHTML(deposit.id)}"
                                            >
                                                Valider
                                            </button>

                                            <button
                                                class="btn btn-small reject-deposit"
                                                data-deposit-id="${escapeHTML(deposit.id)}"
                                            >
                                                Refuser
                                            </button>

                                        `
                                        : "-"
                                }

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    bindDepositActions();

}


/* =========================================================
   ACTIONS DEPOT
========================================================= */

function bindDepositActions() {

    document.querySelectorAll(
        ".approve-deposit"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    processDeposit(
                        button.dataset.depositId,
                        "approved"
                    );

                }
            );

        }
    );


    document.querySelectorAll(
        ".reject-deposit"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    processDeposit(
                        button.dataset.depositId,
                        "rejected"
                    );

                }
            );

        }
    );

}


function processDeposit(
    depositId,
    decision
) {

    const deposits =
        getDeposits();


    const deposit =
        deposits.find(
            item =>
                item.id ===
                depositId
        );


    if (
        !deposit ||
        deposit.status !==
        "pending"
    ) {
        return;
    }


    deposit.status =
        decision;


    if (
        decision ===
        "approved"
    ) {

        deposit.validatedAt =
            new Date().toISOString();


        const user =
            findUserById(
                deposit.userId
            );


        if (user) {

            user.balance =
                Number(
                    user.balance
                ) +
                Number(
                    deposit.amount
                );


            updateUser(
                user
            );


            processReferralReward(
                user,
                deposit.amount
            );

        }


        showToast(
            "Dépôt validé avec succès.",
            "success"
        );

    } else {

        deposit.rejectedAt =
            new Date().toISOString();


        showToast(
            "Dépôt refusé.",
            "warning"
        );

    }


    saveDeposits(
        deposits
    );


    refreshAdminData();

}


/* =========================================================
   BONUS PARRAINAGE
========================================================= */

function processReferralReward(
    referredUser,
    firstDepositAmount
) {

    if (
        !referredUser.referrerId ||
        referredUser.referralRewarded
    ) {
        return;
    }


    const referrer =
        findUserById(
            referredUser.referrerId
        );


    if (!referrer) {
        return;
    }


    const reward =
        Number(
            firstDepositAmount
        ) *
        (
            YQD_CONFIG.referralPercent /
            100
        );


    referrer.balance =
        Number(
            referrer.balance
        ) +
        reward;


    referrer.referralBonus =
        Number(
            referrer.referralBonus
        ) +
        reward;


    referredUser.referralRewarded =
        true;


    referredUser.referralRewardAmount =
        reward;


    updateUser(
        referrer
    );


    updateUser(
        referredUser
    );

}


/* =========================================================
   ADMIN RETRAITS
========================================================= */

function renderAdminWithdrawals() {

    const body =
        getElement(
            "adminWithdrawalsBody"
        );

    if (!body) {
        return;
    }


    const filter =
        getElement(
            "withdrawalStatusFilter"
        )?.value ||
        "all";


    let withdrawals =
        getWithdrawals();


    if (
        filter !== "all"
    ) {

        withdrawals =
            withdrawals.filter(
                withdrawal =>
                    withdrawal.status ===
                    filter
            );

    }


    withdrawals =
        withdrawals.sort(
            (a, b) =>
                new Date(
                    b.createdAt
                ) -
                new Date(
                    a.createdAt
                )
        );


    if (
        withdrawals.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="7">
                    Aucune demande de retrait.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        withdrawals
            .map(
                withdrawal => {

                    const user =
                        findUserById(
                            withdrawal.userId
                        );


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    user?.fullName ||
                                    "Utilisateur supprimé"
                                )}
                            </td>

                            <td>
                                ${formatFCFA(
                                    withdrawal.amount
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    withdrawal.method
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    withdrawal.account
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    withdrawal.createdAt
                                )}
                            </td>

                            <td>
                                ${renderStatus(
                                    withdrawal.status
                                )}
                            </td>

                            <td>

                                ${
                                    withdrawal.status ===
                                    "pending"
                                        ? `

                                            <button
                                                class="btn btn-small approve-withdrawal"
                                                data-withdrawal-id="${escapeHTML(withdrawal.id)}"
                                            >
                                                Valider
                                            </button>

                                            <button
                                                class="btn btn-small reject-withdrawal"
                                                data-withdrawal-id="${escapeHTML(withdrawal.id)}"
                                            >
                                                Refuser
                                            </button>

                                        `
                                        : "-"
                                }

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    bindWithdrawalActions();

}


function bindWithdrawalActions() {

    document.querySelectorAll(
        ".approve-withdrawal"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    processWithdrawal(
                        button.dataset.withdrawalId,
                        "approved"
                    );

                }
            );

        }
    );


    document.querySelectorAll(
        ".reject-withdrawal"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    processWithdrawal(
                        button.dataset.withdrawalId,
                        "rejected"
                    );

                }
            );

        }
    );

}


function processWithdrawal(
    withdrawalId,
    decision
) {

    const withdrawals =
        getWithdrawals();


    const withdrawal =
        withdrawals.find(
            item =>
                item.id ===
                withdrawalId
        );


    if (
        !withdrawal ||
        withdrawal.status !==
        "pending"
    ) {
        return;
    }


    const user =
        findUserById(
            withdrawal.userId
        );


    if (!user) {
        return;
    }


    if (
        decision ===
        "approved"
    ) {

        if (
            Number(
                user.balance
            ) <
            Number(
                withdrawal.amount
            )
        ) {

            showToast(
                "Solde utilisateur insuffisant.",
                "error"
            );

            return;

        }


        user.balance =
            Number(
                user.balance
            ) -
            Number(
                withdrawal.amount
            );


        updateUser(
            user
        );


        withdrawal.status =
            "approved";


        withdrawal.validatedAt =
            new Date().toISOString();


        showToast(
            "Retrait validé.",
            "success"
        );

    } else {

        withdrawal.status =
            "rejected";


        withdrawal.rejectedAt =
            new Date().toISOString();


        showToast(
            "Retrait refusé.",
            "warning"
        );

    }


    saveWithdrawals(
        withdrawals
    );


    refreshAdminData();

}


/* =========================================================
   ADMIN INVESTISSEMENTS
========================================================= */

function renderAdminInvestments() {

    const body =
        getElement(
            "adminInvestmentsBody"
        );

    if (!body) {
        return;
    }


    const investments =
        getInvestments()
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            );


    if (
        investments.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="7">
                    Aucun investissement enregistré.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        investments
            .map(
                investment => {

                    const user =
                        findUserById(
                            investment.userId
                        );


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    user?.fullName ||
                                    "-"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    investment.packName
                                )}
                            </td>

                            <td>
                                ${formatFCFA(
                                    investment.amount
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    investment.startDate
                                )}
                            </td>

                            <td>
                                ${formatDate(
                                    investment.endDate
                                )}
                            </td>

                            <td>
                                ${renderStatus(
                                    investment.status
                                )}
                            </td>

                            <td>

                                <button
                                    class="btn btn-small investment-details-button"
                                    data-investment-id="${escapeHTML(investment.id)}"
                                >

                                    Voir

                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    document.querySelectorAll(
        ".investment-details-button"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    openAdminInvestmentDetails(
                        button.dataset.investmentId
                    );

                }
            );

        }
    );

}


function openAdminInvestmentDetails(
    investmentId
) {

    const investment =
        getInvestments().find(
            item =>
                item.id ===
                investmentId
        );


    if (!investment) {
        return;
    }


    const content =
        getElement(
            "adminInvestmentModalContent"
        );


    const modal =
        getElement(
            "adminInvestmentModal"
        );


    if (
        !content ||
        !modal
    ) {
        return;
    }


    content.innerHTML = `

        <div class="investment-details">

            <p>
                <strong>Pack :</strong>
                ${escapeHTML(
                    investment.packName
                )}
            </p>

            <p>
                <strong>Montant :</strong>
                ${formatFCFA(
                    investment.amount
                )}
            </p>

            <p>
                <strong>Gain quotidien affiché :</strong>
                ${formatFCFA(
                    investment.dailyGain
                )}
            </p>

            <p>
                <strong>Durée :</strong>
                ${investment.duration} jours
            </p>

            <p>
                <strong>Date de début :</strong>
                ${formatDate(
                    investment.startDate
                )}
            </p>

            <p>
                <strong>Date de fin :</strong>
                ${formatDate(
                    investment.endDate
                )}
            </p>

        </div>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   ADMIN TICKETS
========================================================= */

function renderAdminTickets() {

    const container =
        getElement(
            "adminTicketsContainer"
        );

    if (!container) {
        return;
    }


    const tickets =
        getTickets()
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            );


    if (
        tickets.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted">
                Aucun ticket utilisateur.
            </p>
        `;

        return;

    }


    container.innerHTML =
        tickets
            .map(
                ticket => {

                    const user =
                        findUserById(
                            ticket.userId
                        );


                    return `

                        <article class="admin-ticket-item">

                            <div class="ticket-header">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            ticket.subject
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            user?.fullName ||
                                            "Utilisateur"
                                        )}
                                    </small>

                                </div>

                                ${renderStatus(
                                    ticket.status
                                )}

                            </div>

                            <p>
                                ${escapeHTML(
                                    ticket.message
                                )}
                            </p>

                            ${
                                ticket.reply
                                    ? `

                                        <div class="ticket-reply">

                                            <strong>
                                                Réponse envoyée :
                                            </strong>

                                            <p>
                                                ${escapeHTML(
                                                    ticket.reply
                                                )}
                                            </p>

                                        </div>

                                    `
                                    : ""
                            }

                            <div class="ticket-actions">

                                <button
                                    class="btn btn-small reply-ticket-button"
                                    data-ticket-id="${escapeHTML(ticket.id)}"
                                >

                                    Répondre

                                </button>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    document.querySelectorAll(
        ".reply-ticket-button"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const ticketId =
                        button.dataset.ticketId;


                    getElement(
                        "replyTicketId"
                    ).value =
                        ticketId;


                    const modal =
                        getElement(
                            "ticketReplyModal"
                        );


                    if (modal) {

                        modal.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   REPONSE TICKET
========================================================= */

function initializeTicketReplyForm() {

    const form =
        getElement(
            "ticketReplyForm"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const ticketId =
                getElement(
                    "replyTicketId"
                ).value;


            const reply =
                getElement(
                    "ticketReplyMessage"
                ).value.trim();


            if (
                !ticketId ||
                reply.length < 2
            ) {

                showToast(
                    "Veuillez écrire une réponse.",
                    "error"
                );

                return;

            }


            const tickets =
                getTickets();


            const ticket =
                tickets.find(
                    item =>
                        item.id ===
                        ticketId
                );


            if (!ticket) {
                return;
            }


            ticket.reply =
                reply;


            ticket.status =
                "answered";


            ticket.repliedAt =
                new Date().toISOString();


            saveTickets(
                tickets
            );


            form.reset();


            const modal =
                getElement(
                    "ticketReplyModal"
                );


            if (modal) {

                modal.classList.remove(
                    "active"
                );

            }


            showToast(
                "Réponse envoyée à l'utilisateur.",
                "success"
            );


            refreshAdminData();

        }
    );

}


/* =========================================================
   TRANSACTIONS ADMIN
========================================================= */

function renderAdminTransactions() {

    const body =
        getElement(
            "adminTransactionsBody"
        );

    if (!body) {
        return;
    }


    const deposits =
        getDeposits()
            .map(
                deposit => {

                    const user =
                        findUserById(
                            deposit.userId
                        );


                    return {

                        user:
                            user?.fullName ||
                            "Utilisateur",

                        type:
                            "Dépôt",

                        amount:
                            deposit.amount,

                        details:
                            deposit.reference,

                        date:
                            deposit.createdAt,

                        status:
                            deposit.status

                    };

                }
            );


    const withdrawals =
        getWithdrawals()
            .map(
                withdrawal => {

                    const user =
                        findUserById(
                            withdrawal.userId
                        );


                    return {

                        user:
                            user?.fullName ||
                            "Utilisateur",

                        type:
                            "Retrait",

                        amount:
                            withdrawal.amount,

                        details:
                            withdrawal.account,

                        date:
                            withdrawal.createdAt,

                        status:
                            withdrawal.status

                    };

                }
            );


    const transactions =
        [
            ...deposits,
            ...withdrawals
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            );


    if (
        transactions.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucune transaction enregistrée.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        transactions
            .map(
                transaction => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                transaction.user
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.type
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                transaction.amount
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                transaction.details
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                transaction.date
                            )}
                        </td>

                        <td>
                            ${renderStatus(
                                transaction.status
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");

}


/* =========================================================
   ACTIVITE ADMIN RECENTE
========================================================= */

function renderAdminRecentActivity() {

    const body =
        getElement(
            "adminRecentActivityBody"
        );

    if (!body) {
        return;
    }


    const transactions =
        [
            ...getDeposits().map(
                item => ({
                    userId:
                        item.userId,
                    type:
                        "Dépôt",
                    amount:
                        item.amount,
                    status:
                        item.status,
                    date:
                        item.createdAt
                })
            ),

            ...getWithdrawals().map(
                item => ({
                    userId:
                        item.userId,
                    type:
                        "Retrait",
                    amount:
                        item.amount,
                    status:
                        item.status,
                    date:
                        item.createdAt
                })
            )
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            )
            .slice(
                0,
                6
            );


    if (
        transactions.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="4">
                    Aucune activité récente.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        transactions
            .map(
                transaction => {

                    const user =
                        findUserById(
                            transaction.userId
                        );


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    user?.fullName ||
                                    "Utilisateur"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    transaction.type
                                )}
                            </td>

                            <td>
                                ${formatFCFA(
                                    transaction.amount
                                )}
                            </td>

                            <td>
                                ${renderStatus(
                                    transaction.status
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   TICKETS RECENTS ADMIN
========================================================= */

function renderAdminRecentTickets() {

    const container =
        getElement(
            "adminRecentTickets"
        );

    if (!container) {
        return;
    }


    const tickets =
        getTickets()
            .filter(
                ticket =>
                    ticket.status ===
                    "open"
            )
            .slice(
                0,
                5
            );


    if (
        tickets.length === 0
    ) {

        container.innerHTML = `
            <p class="text-muted">
                Aucune demande.
            </p>
        `;

        return;

    }


    container.innerHTML =
        tickets
            .map(
                ticket => {

                    const user =
                        findUserById(
                            ticket.userId
                        );


                    return `

                        <div class="recent-ticket">

                            <strong>
                                ${escapeHTML(
                                    ticket.subject
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    user?.fullName ||
                                    "Utilisateur"
                                )}
                            </span>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FILTRES ADMIN
========================================================= */

function initializeAdminFilters() {

    const depositFilter =
        getElement(
            "depositStatusFilter"
        );


    const withdrawalFilter =
        getElement(
            "withdrawalStatusFilter"
        );


    const searchInput =
        getElement(
            "userSearchInput"
        );


    if (depositFilter) {

        depositFilter.addEventListener(
            "change",
            renderAdminDeposits
        );

    }


    if (withdrawalFilter) {

        withdrawalFilter.addEventListener(
            "change",
            renderAdminWithdrawals
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterAdminUsers(
                    searchInput.value
                );

            }
        );

    }

}


function filterAdminUsers(query) {

    const body =
        getElement(
            "adminUsersBody"
        );

    if (!body) {
        return;
    }


    const value =
        query
            .trim()
            .toLowerCase();


    const users =
        getUsers().filter(
            user =>
                user.fullName
                    .toLowerCase()
                    .includes(
                        value
                    ) ||
                user.email
                    .toLowerCase()
                    .includes(
                        value
                    ) ||
                user.phone
                    .toLowerCase()
                    .includes(
                        value
                    )
        );


    if (
        users.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    Aucun utilisateur trouvé.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        users
            .map(
                user => `

                    <tr>

                        <td>
                            ${escapeHTML(
                                user.fullName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                user.phone
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                user.balance
                            )}
                        </td>

                        <td>
                            ${formatFCFA(
                                user.invested
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                user.createdAt
                            )}
                        </td>

                        <td>

                            <button
                                class="btn btn-small admin-user-details"
                                data-user-id="${escapeHTML(user.id)}"
                            >
                                Voir
                            </button>

                        </td>

                    </tr>

                `
            )
            .join("");


    document.querySelectorAll(
        ".admin-user-details"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    openUserDetails(
                        button.dataset.userId
                    );

                }
            );

        }
    );

}


/* =========================================================
   DECONNEXION ADMIN
========================================================= */

function initializeAdminLogout() {

    const button =
        getElement(
            "adminLogoutButton"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            clearAdminSession();


            window.location.reload();

        }
    );

}


/* =========================================================
   RAFRAICHISSEMENT ADMIN
========================================================= */

function refreshAdminData() {

    renderAdminOverview();

    renderAdminUsers();

    renderAdminDeposits();

    renderAdminWithdrawals();

    renderAdminInvestments();

    renderAdminTickets();

    renderAdminTransactions();

}


/* =========================================================
   INITIALISATION GENERALE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeRegisterPage();

        initializeLoginPage();

        initializeForgotPasswordPage();

        initializeDashboard();

        initializeAdmin();

    }
);
