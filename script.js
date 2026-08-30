"use strict";

/* =========================================================
   HOUSING'S YQD — SCRIPT PRINCIPAL

   IMPORTANT : cette version conserve le stockage navigateur
   pour rester compatible avec le site statique actuel.
   Pour une mise en production financière réelle, comptes,
   soldes, rôles et transactions doivent être déplacés vers
   un backend sécurisé (ex. Supabase + RLS/fonctions serveur).
========================================================= */

const HYQD_CONFIG = Object.freeze({
    APP_NAME: "Housing's YQD",
    ADMIN_CODE: "937854M", // Compatibilité maquette uniquement : ne constitue pas une sécurité serveur.
    REFERRAL_RATE: 0.10,
    DEPOSIT_FEE_RATE: 0.01,
    WITHDRAW_FEE_RATE: 0.25,
    INVESTMENT_DURATION: 180,
    MIN_DEPOSIT: 1000,
    MIN_WITHDRAWAL: 1000,
    DAY_MS: 24 * 60 * 60 * 1000
});

const HYQD_KEYS = Object.freeze({
    USERS: "hyqd_users_v4",
    CURRENT_USER: "hyqd_current_user_v4",
    ADMIN_SESSION: "hyqd_admin_session_v4",
    PASSWORD_RESETS: "hyqd_password_resets_v4"
});

/* =========================================================
   GRILLE DES 8 PACKS — SOURCE UNIQUE
========================================================= */

const HYQD_INVESTMENT_PACKS = Object.freeze([
    Object.freeze({ id: "starter",      name: "Starter",      amount: 3000,   dailyIncome: 800,    totalIncome: 144000,   duration: 180 }),
    Object.freeze({ id: "familial",     name: "Familial",     amount: 10000,  dailyIncome: 3000,   totalIncome: 540000,   duration: 180 }),
    Object.freeze({ id: "confort",      name: "Confort",      amount: 20000,  dailyIncome: 6000,   totalIncome: 1080000,  duration: 180 }),
    Object.freeze({ id: "premium",      name: "Premium",      amount: 45000,  dailyIncome: 14000,  totalIncome: 2520000,  duration: 180 }),
    Object.freeze({ id: "prestige",     name: "Prestige",     amount: 100000, dailyIncome: 30000,  totalIncome: 5400000,  duration: 180 }),
    Object.freeze({ id: "premium-plus", name: "Premium Plus", amount: 200000, dailyIncome: 65000,  totalIncome: 11700000, duration: 180 }),
    Object.freeze({ id: "elite",        name: "Elite",        amount: 400000, dailyIncome: 140000, totalIncome: 25200000, duration: 180 }),
    Object.freeze({ id: "luxury",       name: "Luxury",       amount: 800000, dailyIncome: 290000, totalIncome: 52200000, duration: 180 })
]);

/* =========================================================
   STOCKAGE
========================================================= */

function hyqdGet(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        console.error("Erreur lecture stockage Housing's YQD :", error);
        return fallback;
    }
}

function hyqdSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Erreur écriture stockage Housing's YQD :", error);
        return false;
    }
}

function cloneData(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

/* =========================================================
   OUTILS
========================================================= */

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function roundFCFA(value) {
    return Math.max(0, Math.round(safeNumber(value)));
}

function generateId(prefix = "id") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}_${crypto.randomUUID()}`;
    }

    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateCode() {
    const letters = Math.random().toString(36).slice(2, 6).toUpperCase();
    const numbers = Math.floor(1000 + Math.random() * 9000);
    return `YQD${letters}${numbers}`;
}

function normalizePhone(phone) {
    let value = String(phone || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^\d+]/g, "");

    if (value.startsWith("+225")) value = value.slice(4);
    if (value.startsWith("00225")) value = value.slice(5);

    return value.replace(/\D/g, "");
}

function isValidIvoryCoastPhone(phone) {
    const normalized = normalizePhone(phone);
    return /^\d{8,10}$/.test(normalized);
}

function formatFCFA(amount) {
    return `${new Intl.NumberFormat("fr-FR").format(roundFCFA(amount))} FCFA`;
}

function escapeHtml(value) {
    const text = String(value ?? "");

    if (typeof document === "undefined") {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function nowIso() {
    return new Date().toISOString();
}

function calculateFee(amount, rate) {
    return Math.floor(roundFCFA(amount) * safeNumber(rate));
}

function ensureUserShape(user) {
    if (!user || typeof user !== "object") return user;

    user.fullName = String(user.fullName || user.name || "Utilisateur").trim();
    user.name = user.fullName;
    user.phone = normalizePhone(user.phone);
    user.balance = safeNumber(user.balance);
    user.totalDeposited = safeNumber(user.totalDeposited);
    user.totalWithdrawn = safeNumber(user.totalWithdrawn);
    user.totalInvested = safeNumber(user.totalInvested);
    user.totalInvestmentIncome = safeNumber(user.totalInvestmentIncome);
    user.totalReferralBonus = safeNumber(user.totalReferralBonus);
    user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
    user.investments = Array.isArray(user.investments) ? user.investments : [];
    user.tickets = Array.isArray(user.tickets) ? user.tickets : [];
    user.notifications = Array.isArray(user.notifications) ? user.notifications : [];
    user.status = user.status || "active";
    user.firstDepositCompleted = Boolean(user.firstDepositCompleted);
    user.createdAt = user.createdAt || nowIso();

    if (!user.referralCode) user.referralCode = generateCode();

    return user;
}

/* =========================================================
   PACKS
========================================================= */

function getInvestmentPacks() {
    return cloneData(HYQD_INVESTMENT_PACKS);
}

function getPackById(packId) {
    return HYQD_INVESTMENT_PACKS.find(
        pack => pack.id === String(packId || "")
    ) || null;
}

function getPackByAmount(amount) {
    return HYQD_INVESTMENT_PACKS.find(
        pack => Number(pack.amount) === Number(amount)
    ) || null;
}

function getCanonicalPack(pack) {
    if (!pack) return null;

    if (typeof pack === "string") {
        return getPackById(pack);
    }

    return (pack.id && getPackById(pack.id)) ||
        getPackByAmount(pack.amount);
}

/* =========================================================
   UTILISATEURS
========================================================= */

function getUsersRaw() {
    const users = hyqdGet(
        HYQD_KEYS.USERS,
        []
    );

    if (!Array.isArray(users)) {
        return [];
    }

    return users.map(
        ensureUserShape
    );
}

function saveUsers(users) {
    const safeUsers = Array.isArray(users)
        ? users.map(ensureUserShape)
        : [];

    return hyqdSet(
        HYQD_KEYS.USERS,
        safeUsers
    );
}

function findUserById(userId) {
    return getUsersRaw().find(
        user => user.id === userId
    ) || null;
}

function findUserByPhone(phone) {
    const normalized =
        normalizePhone(phone);

    return getUsersRaw().find(
        user =>
            normalizePhone(user.phone) ===
            normalized
    ) || null;
}

function findUserByReferralCode(code) {
    const referral =
        String(code || "")
            .trim()
            .toUpperCase();

    if (!referral) {
        return null;
    }

    return getUsersRaw().find(
        user =>
            String(
                user.referralCode || ""
            ).toUpperCase() === referral
    ) || null;
}

/* =========================================================
   INSCRIPTION / CONNEXION
========================================================= */

function registerUser(...args) {
    let data;

    if (
        args.length === 1 &&
        typeof args[0] === "object" &&
        args[0] !== null
    ) {
        data = args[0];

    } else {
        data = {
            fullName: args[0] || "",
            phone: args[1] || "",
            password: args[2] || "",
            confirmPassword:
                args[3] ?? args[2] ?? "",
            referralCode: args[4] || ""
        };
    }

    const fullName =
        String(
            data.fullName ||
            data.name ||
            ""
        ).trim();

    const phone =
        normalizePhone(
            data.phone
        );

    const password =
        String(
            data.password || ""
        );

    const confirmPassword =
        String(
            data.confirmPassword ??
            password
        );

    const referralCode =
        String(
            data.referralCode || ""
        )
            .trim()
            .toUpperCase();

    if (
        fullName.length < 3 ||
        fullName
            .split(/\s+/)
            .filter(Boolean)
            .length < 2
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner votre nom complet."
        };
    }

    if (!isValidIvoryCoastPhone(phone)) {
        return {
            success: false,
            message:
                "Veuillez renseigner un numéro de téléphone valide."
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message:
                "Le mot de passe doit contenir au moins 6 caractères."
        };
    }

    if (password !== confirmPassword) {
        return {
            success: false,
            message:
                "Les mots de passe ne correspondent pas."
        };
    }

    const users =
        getUsersRaw();

    if (
        users.some(
            user =>
                normalizePhone(user.phone) ===
                phone
        )
    ) {
        return {
            success: false,
            message:
                "Un compte existe déjà avec ce numéro."
        };
    }

    const sponsor =
        referralCode
            ? users.find(
                user =>
                    String(
                        user.referralCode || ""
                    ).toUpperCase() ===
                    referralCode
            )
            : null;

    if (
        referralCode &&
        !sponsor
    ) {
        return {
            success: false,
            message:
                "Le code de parrainage est invalide."
        };
    }

    let personalReferralCode =
        generateCode();

    while (
        users.some(
            user =>
                user.referralCode ===
                personalReferralCode
        )
    ) {
        personalReferralCode =
            generateCode();
    }

    const user =
        ensureUserShape({

            id:
                generateId("user"),

            fullName,

            name:
                fullName,

            phone,

            // Compatibilité maquette actuelle.
            // À remplacer par Auth serveur avant production.
            password,

            balance:
                0,

            totalDeposited:
                0,

            totalWithdrawn:
                0,

            totalInvested:
                0,

            totalInvestmentIncome:
                0,

            totalReferralBonus:
                0,

            referralCode:
                personalReferralCode,

            referredBy:
                sponsor
                    ? sponsor.referralCode
                    : "",

            sponsorId:
                sponsor
                    ? sponsor.id
                    : null,

            firstDepositCompleted:
                false,

            transactions:
                [],

            investments:
                [],

            tickets:
                [],

            notifications:
                [],

            status:
                "active",

            createdAt:
                nowIso()
        });

    users.unshift(user);

    saveUsers(users);

    hyqdSet(
        HYQD_KEYS.CURRENT_USER,
        user.id
    );

    return {
        success: true,
        message:
            "Inscription réussie.",
        user:
            cloneData(user)
    };
}

function loginUser(phone, password) {
    const normalized =
        normalizePhone(phone);

    const users =
        getUsersRaw();

    const user =
        users.find(
            item =>
                normalizePhone(item.phone) ===
                normalized
        );

    if (!user) {
        return {
            success: false,
            message:
                "Compte introuvable."
        };
    }
       if (
        String(user.password) !==
        String(password)
    ) {
        return {
            success: false,
            message:
                "Mot de passe incorrect."
        };
    }

    if (
        user.status ===
        "blocked"
    ) {
        return {
            success: false,
            message:
                "Ce compte est actuellement bloqué."
        };
    }

    hyqdSet(
        HYQD_KEYS.CURRENT_USER,
        user.id
    );

    processInvestmentGainsForUser(
        user.id
    );

    return {
        success: true,
        message:
            "Connexion réussie.",
        user:
            getCurrentUser()
    };
}

function logoutUser() {
    localStorage.removeItem(
        HYQD_KEYS.CURRENT_USER
    );

    return true;
}

/* =========================================================
   SESSION UTILISATEUR
========================================================= */

function getCurrentUserId() {
    return hyqdGet(
        HYQD_KEYS.CURRENT_USER,
        null
    );
}

function getCurrentUser() {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return null;
    }

    processInvestmentGainsForUser(
        userId
    );

    const users =
        getUsersRaw();

    const user =
        users.find(
            item =>
                item.id ===
                userId
        );

    if (!user) {
        localStorage.removeItem(
            HYQD_KEYS.CURRENT_USER
        );

        return null;
    }

    return cloneData(user);
}

function requireAuth() {
    const user =
        getCurrentUser();

    if (!user) {
        if (
            typeof window !==
            "undefined"
        ) {
            window.location.replace(
                "login.html"
            );
        }

        return null;
    }

    return user;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function addNotification(
    user,
    type,
    title,
    message
) {
    ensureUserShape(user);

    const notification = {
        id:
            generateId(
                "notification"
            ),

        type:
            String(
                type || "general"
            ),

        title:
            String(
                title || "Notification"
            ),

        message:
            String(
                message || ""
            ),

        read:
            false,

        createdAt:
            nowIso()
    };

    user.notifications.unshift(
        notification
    );

    return notification;
}

function getCurrentUserNotifications() {
    const user =
        getCurrentUser();

    if (!user) {
        return [];
    }

    return cloneData(
        user.notifications || []
    );
}

function getUnreadNotificationCount() {
    return getCurrentUserNotifications()
        .filter(
            notification =>
                !notification.read
        )
        .length;
}

function markNotificationAsRead(
    notificationId
) {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return false;
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return false;
    }

    const user =
        users[userIndex];

    const notification =
        user.notifications.find(
            item =>
                item.id ===
                notificationId
        );

    if (!notification) {
        return false;
    }

    notification.read =
        true;

    users[userIndex] =
        user;

    saveUsers(users);

    return true;
}

function markAllNotificationsAsRead() {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return false;
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return false;
    }

    const user =
        users[userIndex];

    user.notifications.forEach(
        notification => {
            notification.read =
                true;
        }
    );

    users[userIndex] =
        user;

    saveUsers(users);

    return true;
}

/* =========================================================
   GAINS D'INVESTISSEMENT
========================================================= */

function processInvestmentGainsForUser(
    userId
) {
    if (!userId) {
        return;
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return;
    }

    const user =
        users[userIndex];

    ensureUserShape(user);

    if (!user.investments.length) {
        return;
    }

    let changed =
        false;

    const currentTime =
        Date.now();

    user.investments.forEach(
        investment => {

            if (!investment) {
                return;
            }

            const canonicalPack =
                getPackById(
                    investment.packId
                ) ||
                getPackByAmount(
                    investment.amount
                );

            if (!canonicalPack) {
                return;
            }

            if (
                !investment.dailyIncome
            ) {
                investment.dailyIncome =
                    canonicalPack.dailyIncome;

                changed =
                    true;
            }

            if (
                !investment.totalIncome
            ) {
                investment.totalIncome =
                    canonicalPack.totalIncome;

                changed =
                    true;
            }

            if (
                !investment.duration
            ) {
                investment.duration =
                    canonicalPack.duration;

                changed =
                    true;
            }

            if (
                typeof investment.creditedDays !==
                "number"
            ) {
                investment.creditedDays =
                    0;

                changed =
                    true;
            }

            if (
                typeof investment.totalIncomeCredited !==
                "number"
            ) {
                investment.totalIncomeCredited =
                    safeNumber(
                        investment.creditedDays
                    ) *
                    safeNumber(
                        investment.dailyIncome
                    );

                changed =
                    true;
            }

            if (
                investment.status ===
                "completed"
            ) {
                return;
            }

            if (
                investment.status &&
                investment.status !==
                "active"
            ) {
                return;
            }

            const start =
                new Date(
                    investment.startDate ||
                    investment.createdAt
                ).getTime();

            if (
                !Number.isFinite(start)
            ) {
                return;
            }

            const duration =
                Number(
                    investment.duration ||
                    canonicalPack.duration ||
                    HYQD_CONFIG
                        .INVESTMENT_DURATION
                );

            const dailyIncome =
                safeNumber(
                    investment.dailyIncome ||
                    canonicalPack.dailyIncome
                );

            if (
                duration <= 0 ||
                dailyIncome <= 0
            ) {
                return;
            }

            const elapsedFullDays =
                Math.floor(
                    Math.max(
                        0,
                        currentTime - start
                    ) /
                    HYQD_CONFIG.DAY_MS
                );

            const payableDays =
                Math.min(
                    duration,
                    elapsedFullDays
                );

            const creditedDays =
                Math.max(
                    0,
                    Number(
                        investment.creditedDays ||
                        0
                    )
                );

            const dueDays =
                payableDays -
                creditedDays;

            if (
                dueDays <= 0
            ) {
                if (
                    creditedDays >=
                        duration &&
                    investment.status !==
                        "completed"
                ) {
                    investment.status =
                        "completed";

                    investment.completedAt =
                        investment.completedAt ||
                        new Date(
                            start +
                            duration *
                            HYQD_CONFIG.DAY_MS
                        ).toISOString();

                    changed =
                        true;
                }

                return;
            }

            /*
             * On crédite en une seule opération logique
             * le nombre de jours dus.
             *
             * Les transactions restent détaillées jour
             * par jour pour conserver un historique clair.
             */

            for (
                let day =
                    creditedDays + 1;

                day <=
                    payableDays;

                day++
            ) {
                const payoutDate =
                    new Date(
                        start +
                        day *
                        HYQD_CONFIG.DAY_MS
                    ).toISOString();

                user.balance =
                    safeNumber(
                        user.balance
                    ) +
                    dailyIncome;

                user.totalInvestmentIncome =
                    safeNumber(
                        user.totalInvestmentIncome
                    ) +
                    dailyIncome;

                investment.totalIncomeCredited =
                    safeNumber(
                        investment
                            .totalIncomeCredited
                    ) +
                    dailyIncome;

                investment.creditedDays =
                    day;

                investment.lastPayoutAt =
                    payoutDate;

                user.transactions.unshift({
                    id:
                        generateId(
                            "gain"
                        ),

                    type:
                        "daily_gain",

                    amount:
                        dailyIncome,

                    status:
                        "approved",

                    investmentId:
                        investment.id,

                    packId:
                        investment.packId,

                    packName:
                        investment.packName ||
                        canonicalPack.name,

                    payoutDay:
                        day,

                    description:
                        `Gain journalier - jour ${day}/${duration}`,

                    createdAt:
                        payoutDate,

                    processedAt:
                        payoutDate
                });
            }

            /*
             * Une seule notification résume le crédit,
             * même si l'utilisateur revient après
             * plusieurs jours d'absence.
             */

            const totalCredited =
                dueDays *
                dailyIncome;

            addNotification(
                user,
                "daily_gain",
                dueDays > 1
                    ? "Gains journaliers crédités"
                    : "Gain journalier crédité",
                dueDays > 1
                    ? `${formatFCFA(totalCredited)} ont été ajoutés à votre solde pour ${dueDays} jours du pack ${investment.packName || canonicalPack.name}.`
                    : `${formatFCFA(dailyIncome)} ont été ajoutés à votre solde pour le pack ${investment.packName || canonicalPack.name}.`
            );

            if (
                investment.creditedDays >=
                duration
            ) {
                investment.status =
                    "completed";

                investment.completedAt =
                    new Date(
                        start +
                        duration *
                        HYQD_CONFIG.DAY_MS
                    ).toISOString();
            }

            changed =
                true;
        }
    );

    if (changed) {
        users[userIndex] =
            user;

        saveUsers(users);
    }
}

function processAllInvestmentGains() {
    const users =
        getUsersRaw();

    users.forEach(
        user => {
            processInvestmentGainsForUser(
                user.id
            );
        }
    );
}

/* =========================================================
   INVESTISSEMENT
========================================================= */

function investInPack(packInput) {
    const currentUserId =
        getCurrentUserId();

    if (!currentUserId) {
        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }

    processInvestmentGainsForUser(
        currentUserId
    );

    const pack =
        getCanonicalPack(
            packInput
        );

    if (!pack) {
        return {
            success: false,
            message:
                "Ce pack d'investissement est invalide."
        };
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                currentUserId
        );

    if (userIndex < 0) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        users[userIndex];

    const amount =
        safeNumber(
            pack.amount
        );

    if (
        safeNumber(
            user.balance
        ) <
        amount
    ) {
        return {
            success: false,
            message:
                "Votre solde est insuffisant pour activer ce pack."
        };
    }

    const startDate =
        new Date();

    const endDate =
        new Date(
            startDate.getTime() +
            pack.duration *
            HYQD_CONFIG.DAY_MS
        );

    const investment = {
        id:
            generateId(
                "investment"
            ),

        packId:
            pack.id,

        packName:
            pack.name,

        amount:
            pack.amount,

        dailyIncome:
            pack.dailyIncome,

        totalIncome:
            pack.totalIncome,

        duration:
            pack.duration,

        creditedDays:
            0,

        totalIncomeCredited:
            0,

        lastPayoutAt:
            null,

        status:
            "active",

        startDate:
            startDate.toISOString(),

        endDate:
            endDate.toISOString(),

        createdAt:
            startDate.toISOString(),

        completedAt:
            null
    };

    user.balance =
        safeNumber(
            user.balance
        ) -
        amount;

    user.totalInvested =
        safeNumber(
            user.totalInvested
        ) +
        amount;

    user.investments.unshift(
        investment
    );

    user.transactions.unshift({
        id:
            generateId(
                "investment_tx"
            ),

        type:
            "investment",

        amount,

        status:
            "approved",

        investmentId:
            investment.id,

        packId:
            pack.id,

        packName:
            pack.name,

        description:
            `Activation du pack ${pack.name}`,

        createdAt:
            startDate.toISOString(),

        processedAt:
            startDate.toISOString()
    });

    addNotification(
        user,
        "investment",
        "Investissement activé",
        `Le pack ${pack.name} de ${formatFCFA(amount)} a été activé pour ${pack.duration} jours.`
    );

    users[userIndex] =
        user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Investissement activé avec succès.",
        investment:
            cloneData(
                investment
            )
    };
}

/* =========================================================
   DÉPÔTS
========================================================= */

function requestDeposit(
    amount,
    method,
    reference
) {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }

    const value =
        roundFCFA(
            amount
        );

    if (
        value <
        HYQD_CONFIG.MIN_DEPOSIT
    ) {
        return {
            success: false,
            message:
                `Le montant minimum de dépôt est de ${formatFCFA(HYQD_CONFIG.MIN_DEPOSIT)}.`
        };
    }

    const paymentMethod =
        String(
            method || ""
        ).trim();

    if (!paymentMethod) {
        return {
            success: false,
            message:
                "Veuillez sélectionner le moyen de paiement."
        };
    }

    const paymentReference =
        String(
            reference || ""
        ).trim();

    if (!paymentReference) {
        return {
            success: false,
            message:
                "Veuillez renseigner la référence de transaction."
        };
    }

    const users =
        getUsersRaw();

    /*
     * Une référence de paiement ne peut être utilisée
     * qu'une seule fois dans toute la plateforme.
     */

    const referenceAlreadyUsed =
        users.some(
            user =>
                (user.transactions || [])
                    .some(
                        transaction =>
                            transaction.type ===
                                "deposit" &&
                            String(
                                transaction.reference ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                            paymentReference
                                .toLowerCase()
                    )
        );

    if (referenceAlreadyUsed) {
        return {
            success: false,
            message:
                "Cette référence de transaction a déjà été utilisée."
        };
    }

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        users[userIndex];

    const fee =
        calculateFee(
            value,
            HYQD_CONFIG.DEPOSIT_FEE_RATE
        );

    const netAmount =
        Math.max(
            0,
            value - fee
        );

    const transaction = {
        id:
            generateId(
                "deposit"
            ),

        type:
            "deposit",

        amount:
            value,

        grossAmount:
            value,

        fee,

        feeRate:
            HYQD_CONFIG
                .DEPOSIT_FEE_RATE,

        netAmount,

        method:
            paymentMethod,

        reference:
            paymentReference,

        status:
            "pending",

        createdAt:
            nowIso(),

        processedAt:
            null
    };

    user.transactions.unshift(
        transaction
    );

    addNotification(
        user,
        "deposit",
        "Dépôt en attente",
        `Votre demande de dépôt de ${formatFCFA(value)} a été enregistrée et attend la validation de l'administration.`
    );

    users[userIndex] =
        user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Votre demande de dépôt a été envoyée et attend la validation de l'administration.",
        transaction:
            cloneData(
                transaction
            )
    };
}

function createDepositRequest(
    amount,
    method,
    reference
) {
    return requestDeposit(
        amount,
        method,
        reference
    );
}
/* =========================================================
   RETRAITS
========================================================= */

function requestWithdrawal(
    amount,
    method,
    phone
) {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }

    processInvestmentGainsForUser(
        userId
    );

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        users[userIndex];

    const value =
        roundFCFA(
            amount
        );

    if (
        value <
        HYQD_CONFIG.MIN_WITHDRAWAL
    ) {
        return {
            success: false,
            message:
                `Le montant minimum de retrait est de ${formatFCFA(HYQD_CONFIG.MIN_WITHDRAWAL)}.`
        };
    }

    const paymentMethod =
        String(
            method || ""
        ).trim();

    if (!paymentMethod) {
        return {
            success: false,
            message:
                "Veuillez sélectionner le moyen de paiement."
        };
    }

    const receivePhone =
        normalizePhone(
            phone
        );

    if (
        !isValidIvoryCoastPhone(
            receivePhone
        )
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner un numéro de réception valide."
        };
    }

    const pendingWithdrawals =
        user.transactions
            .filter(
                transaction =>
                    transaction.type ===
                        "withdraw" &&
                    transaction.status ===
                        "pending"
            )
            .reduce(
                (
                    total,
                    transaction
                ) =>
                    total +
                    safeNumber(
                        transaction.amount
                    ),
                0
            );

    const availableForWithdrawal =
        safeNumber(
            user.balance
        ) -
        pendingWithdrawals;

    if (
        value >
        availableForWithdrawal
    ) {
        return {
            success: false,
            message:
                "Solde disponible insuffisant en tenant compte de vos retraits déjà en attente."
        };
    }

    const fee =
        calculateFee(
            value,
            HYQD_CONFIG.WITHDRAW_FEE_RATE
        );

    const netAmount =
        Math.max(
            0,
            value - fee
        );

    const transaction = {
        id:
            generateId(
                "withdraw"
            ),

        type:
            "withdraw",

        amount:
            value,

        grossAmount:
            value,

        fee,

        feeRate:
            HYQD_CONFIG
                .WITHDRAW_FEE_RATE,

        netAmount,

        method:
            paymentMethod,

        phone:
            receivePhone,

        status:
            "pending",

        createdAt:
            nowIso(),

        processedAt:
            null
    };

    user.transactions.unshift(
        transaction
    );

    addNotification(
        user,
        "withdraw",
        "Retrait en attente",
        `Votre demande de retrait de ${formatFCFA(value)} a été enregistrée. Montant net prévu après frais : ${formatFCFA(netAmount)}.`
    );

    users[userIndex] =
        user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Votre demande de retrait a été envoyée et attend la validation de l'administration.",
        transaction:
            cloneData(
                transaction
            )
    };
}

function createWithdrawRequest(
    amount,
    method,
    phone
) {
    return requestWithdrawal(
        amount,
        method,
        phone
    );
}

/* =========================================================
   ASSISTANCE
========================================================= */

function createTicket(
    subject,
    message
) {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }

    const cleanSubject =
        String(
            subject || ""
        ).trim();

    const cleanMessage =
        String(
            message || ""
        ).trim();

    if (
        cleanSubject.length < 2
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner le sujet de votre demande."
        };
    }

    if (
        cleanMessage.length < 5
    ) {
        return {
            success: false,
            message:
                "Veuillez détailler votre demande."
        };
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        users[userIndex];

    const ticket = {
        id:
            generateId(
                "ticket"
            ),

        subject:
            cleanSubject,

        message:
            cleanMessage,

        status:
            "open",

        adminReply:
            "",

        createdAt:
            nowIso(),

        repliedAt:
            null
    };

    user.tickets.unshift(
        ticket
    );

    addNotification(
        user,
        "support",
        "Demande envoyée",
        `Votre demande « ${cleanSubject} » a été transmise à l'assistance.`
    );

    users[userIndex] =
        user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Votre demande a été envoyée à l'assistance.",
        ticket:
            cloneData(
                ticket
            )
    };
}

function createSupportTicket(
    subject,
    message
) {
    return createTicket(
        subject,
        message
    );
}

/* =========================================================
   PROFIL
========================================================= */

function updateCurrentUserProfile(
    data = {}
) {
    const userId =
        getCurrentUserId();

    if (!userId) {
        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (userIndex < 0) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        users[userIndex];

    const fullName =
        String(
            data.fullName ||
            data.name ||
            user.fullName ||
            ""
        ).trim();

    const phone =
        normalizePhone(
            data.phone ||
            user.phone
        );

    if (
        fullName.length < 3 ||
        fullName
            .split(/\s+/)
            .filter(Boolean)
            .length < 2
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner votre nom complet."
        };
    }

    if (
        !isValidIvoryCoastPhone(
            phone
        )
    ) {
        return {
            success: false,
            message:
                "Numéro de téléphone invalide."
        };
    }

    const phoneUsed =
        users.some(
            item =>
                item.id !==
                    user.id &&
                normalizePhone(
                    item.phone
                ) ===
                    phone
        );

    if (phoneUsed) {
        return {
            success: false,
            message:
                "Ce numéro de téléphone est déjà utilisé par un autre compte."
        };
    }

    user.fullName =
        fullName;

    user.name =
        fullName;

    user.phone =
        phone;

    users[userIndex] =
        user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Profil mis à jour avec succès.",
        user:
            cloneData(
                user
            )
    };
}

/* =========================================================
   MOT DE PASSE OUBLIÉ
========================================================= */

function requestPasswordReset(
    phone
) {
    const normalized =
        normalizePhone(
            phone
        );

    if (
        !isValidIvoryCoastPhone(
            normalized
        )
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner un numéro valide."
        };
    }

    const user =
        findUserByPhone(
            normalized
        );

    if (!user) {
        return {
            success: false,
            message:
                "Aucun compte n'est associé à ce numéro."
        };
    }

    /*
     * IMPORTANT :
     * cette fonction ne modifie volontairement PAS
     * le mot de passe.
     *
     * Une vraie réinitialisation doit utiliser
     * un code OTP ou un lien sécurisé délivré
     * par un service d'authentification serveur.
     */

    return {
        success: true,
        message:
            "Compte identifié. La réinitialisation sécurisée du mot de passe doit être confirmée par le service d'authentification."
    };
}

/* =========================================================
   ADMINISTRATION
========================================================= */

function adminLogin(
    code
) {
    const inputCode =
        String(
            code || ""
        ).trim();

    if (!inputCode) {
        return {
            success: false,
            message:
                "Veuillez saisir le code administrateur."
        };
    }

    if (
        inputCode !==
        HYQD_CONFIG.ADMIN_CODE
    ) {
        return {
            success: false,
            message:
                "Code administrateur incorrect."
        };
    }

    sessionStorage.setItem(
        HY
       /* =========================================================
   VALIDATION ADMIN — DÉPÔTS / RETRAITS
========================================================= */

function adminProcessTransaction(
    userId,
    transactionId,
    status
) {
    if (
        !isAdminAuthenticated()
    ) {
        return {
            success: false,
            message:
                "Accès administrateur requis."
        };
    }

    if (
        status !== "approved" &&
        status !== "rejected"
    ) {
        return {
            success: false,
            message:
                "Statut de traitement invalide."
        };
    }

    processInvestmentGainsForUser(
        userId
    );

    const users =
        getUsersRaw();

    const userIndex =
        users.findIndex(
            user =>
                user.id ===
                userId
        );

    if (
        userIndex < 0
    ) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user =
        ensureUserShape(
            users[userIndex]
        );

    const transactionIndex =
        user.transactions.findIndex(
            transaction =>
                transaction.id ===
                transactionId
        );

    if (
        transactionIndex < 0
    ) {
        return {
            success: false,
            message:
                "Transaction introuvable."
        };
    }

    const transaction =
        user.transactions[
            transactionIndex
        ];

    if (
        transaction.status !==
        "pending"
    ) {
        return {
            success: false,
            message:
                "Cette transaction a déjà été traitée."
        };
    }

    if (
        transaction.type !==
            "deposit" &&
        transaction.type !==
            "withdraw"
    ) {
        return {
            success: false,
            message:
                "Ce type d'opération ne peut pas être traité ici."
        };
    }

    /* =====================================================
       VALIDATION D'UN DÉPÔT
    ===================================================== */

    if (
        transaction.type ===
            "deposit" &&
        status ===
            "approved"
    ) {
        const grossAmount =
            roundFCFA(
                transaction.amount
            );

        const fee =
            Number.isFinite(
                Number(
                    transaction.fee
                )
            )
                ? roundFCFA(
                    transaction.fee
                )
                : calculateFee(
                    grossAmount,
                    HYQD_CONFIG
                        .DEPOSIT_FEE_RATE
                );

        const netAmount =
            Number.isFinite(
                Number(
                    transaction.netAmount
                )
            )
                ? roundFCFA(
                    transaction.netAmount
                )
                : Math.max(
                    0,
                    grossAmount - fee
                );

        transaction.grossAmount =
            grossAmount;

        transaction.fee =
            fee;

        transaction.feeRate =
            HYQD_CONFIG
                .DEPOSIT_FEE_RATE;

        transaction.netAmount =
            netAmount;

        /*
         * Le montant réellement ajouté au solde
         * correspond au dépôt moins les frais de 1 %.
         */

        user.balance =
            safeNumber(
                user.balance
            ) +
            netAmount;

        /*
         * Le total des dépôts conserve le montant brut
         * réellement déposé par l'utilisateur.
         */

        user.totalDeposited =
            safeNumber(
                user.totalDeposited
            ) +
            grossAmount;

        /* =================================================
           BONUS DE PARRAINAGE

           10 % uniquement sur le premier dépôt VALIDÉ
           du filleul.
        ================================================= */

        if (
            !user.firstDepositCompleted
        ) {
            user.firstDepositCompleted =
                true;

            user.firstDepositAt =
                nowIso();

            if (
                user.sponsorId
            ) {
                const sponsorIndex =
                    users.findIndex(
                        item =>
                            item.id ===
                            user.sponsorId
                    );

                if (
                    sponsorIndex >= 0 &&
                    sponsorIndex !==
                    userIndex
                ) {
                    const sponsor =
                        ensureUserShape(
                            users[
                                sponsorIndex
                            ]
                        );

                    const bonus =
                        Math.floor(
                            grossAmount *
                            HYQD_CONFIG
                                .REFERRAL_RATE
                        );

                    if (
                        bonus > 0
                    ) {
                        sponsor.balance =
                            safeNumber(
                                sponsor.balance
                            ) +
                            bonus;

                        sponsor.totalReferralBonus =
                            safeNumber(
                                sponsor
                                    .totalReferralBonus
                            ) +
                            bonus;

                        sponsor.transactions
                            .unshift({

                                id:
                                    generateId(
                                        "referral_bonus"
                                    ),

                                type:
                                    "referral_bonus",

                                amount:
                                    bonus,

                                status:
                                    "approved",

                                sourceUserId:
                                    user.id,

                                sourceUserName:
                                    user.fullName,

                                sourceDepositId:
                                    transaction.id,

                                description:
                                    "Bonus de parrainage - 10 % du premier dépôt validé",

                                createdAt:
                                    nowIso(),

                                processedAt:
                                    nowIso()
                            });

                        addNotification(
                            sponsor,
                            "referral_bonus",
                            "Bonus de parrainage",
                            `Votre filleul a effectué son premier dépôt validé. Un bonus de ${formatFCFA(bonus)} a été ajouté à votre solde.`
                        );

                        users[
                            sponsorIndex
                        ] =
                            sponsor;
                    }
                }
            }
        }
    }

    /* =====================================================
       VALIDATION D'UN RETRAIT
    ===================================================== */

    if (
        transaction.type ===
            "withdraw" &&
        status ===
            "approved"
    ) {
        const grossAmount =
            roundFCFA(
                transaction.amount
            );

        const fee =
            Number.isFinite(
                Number(
                    transaction.fee
                )
            )
                ? roundFCFA(
                    transaction.fee
               
