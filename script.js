/* =========================================================
   HOUSING'S YQD — SCRIPT GLOBAL
   Version synchronisée
========================================================= */

"use strict";

const HYQD_CONFIG = {
    APP_NAME: "Housing's YQD",
    ADMIN_CODE: "937854M",
    REFERRAL_RATE: 0.10,
    INVESTMENT_DURATION: 180
};

const HYQD_KEYS = {
    USERS: "hyqd_users_v4",
    CURRENT_USER: "hyqd_current_user_v4",
    ADMIN_SESSION: "hyqd_admin_session_v4",
    PASSWORD_RESETS: "hyqd_password_resets_v4"
};


/* =========================================================
   OUTILS
========================================================= */

function hyqdGet(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(error);
        return fallback;
    }
}

function hyqdSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix = "HYQD") {
    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 10)
    );
}

function generateCode(length = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }

    return result;
}

function normalizePhone(phone) {
    let clean = String(phone || "").replace(/\D/g, "");

    if (clean.startsWith("225")) {
        clean = clean.slice(3);
    }

    return clean;
}

function formatFCFA(amount) {
    return (
        Number(amount || 0).toLocaleString("fr-FR") +
        " FCFA"
    );
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   UTILISATEURS
========================================================= */

function getUsers() {
    const users = hyqdGet(HYQD_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
    hyqdSet(HYQD_KEYS.USERS, users);
}

function getCurrentUser() {
    const sessionUser = hyqdGet(
        HYQD_KEYS.CURRENT_USER,
        null
    );

    if (!sessionUser || !sessionUser.id) {
        return null;
    }

    const databaseUser = getUsers().find(
        user => user.id === sessionUser.id
    );

    return databaseUser || null;
}

function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(HYQD_KEYS.CURRENT_USER);
        return;
    }

    hyqdSet(HYQD_KEYS.CURRENT_USER, {
        id: user.id
    });
}

function saveCurrentUser(user) {
    if (!user) return false;

    const result = updateUser(user);

    if (result) {
        setCurrentUser(user);
    }

    return result;
}

function findUserById(id) {
    return getUsers().find(
        user => user.id === id
    ) || null;
}

function findUserByPhone(phone) {
    const normalized = normalizePhone(phone);

    return getUsers().find(
        user =>
            normalizePhone(user.phone) === normalized
    ) || null;
}

function findUserByReferralCode(code) {
    const normalized = String(code || "")
        .trim()
        .toUpperCase();

    if (!normalized) return null;

    return getUsers().find(
        user =>
            String(user.referralCode || "")
                .toUpperCase() === normalized
    ) || null;
}

function updateUser(updatedUser) {
    const users = getUsers();

    const index = users.findIndex(
        user => user.id === updatedUser.id
    );

    if (index === -1) {
        return false;
    }

    users[index] = updatedUser;
    saveUsers(users);

    return true;
}


/* =========================================================
   INSCRIPTION
========================================================= */

function registerUser(data, phoneArg, passwordArg, referralArg) {

    /*
       Compatibilité :
       registerUser({...})

       et ancienne forme :
       registerUser(name, phone, password, referral)
    */

    let formData;

    if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
    ) {
        formData = data;
    } else {
        formData = {
            fullName: data,
            phone: phoneArg,
            password: passwordArg,
            confirmPassword: passwordArg,
            referralCode: referralArg
        };
    }

    const fullName = String(
        formData.fullName ||
        formData.name ||
        ""
    ).trim();

    const phone = normalizePhone(
        formData.phone
    );

    const password = String(
        formData.password || ""
    );

    const confirmPassword = String(
        formData.confirmPassword ||
        formData.password ||
        ""
    );

    const referralCode = String(
        formData.referralCode ||
        formData.invitationCode ||
        ""
    )
        .trim()
        .toUpperCase();

    if (fullName.length < 3) {
        return {
            success: false,
            message:
                "Veuillez renseigner votre nom complet."
        };
    }

    if (fullName.split(/\s+/).length < 2) {
        return {
            success: false,
            message:
                "Veuillez saisir votre nom et votre prénom."
        };
    }

    if (phone.length < 8) {
        return {
            success: false,
            message:
                "Veuillez saisir un numéro de téléphone valide."
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
                "Les deux mots de passe ne correspondent pas."
        };
    }

    if (findUserByPhone(phone)) {
        return {
            success: false,
            message:
                "Un compte existe déjà avec ce numéro."
        };
    }

    let sponsor = null;

    if (referralCode) {
        sponsor = findUserByReferralCode(
            referralCode
        );

        if (!sponsor) {
            return {
                success: false,
                message:
                    "Le code d'invitation renseigné est invalide."
            };
        }
    }

    let personalCode;

    do {
        personalCode =
            "YQD" + generateCode(6);
    } while (
        findUserByReferralCode(personalCode)
    );

    const newUser = {
        id: generateId("USER"),
        fullName,
        name: fullName,
        phone,
        password,

        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalInvested: 0,
        totalReferralBonus: 0,

        referralCode: personalCode,

        referredBy: sponsor
            ? sponsor.referralCode
            : null,

        sponsorId: sponsor
            ? sponsor.id
            : null,

        firstDepositCompleted: false,

        transactions: [],
        investments: [],
        tickets: [],
        notifications: [],

        status: "active",

        createdAt:
            new Date().toISOString()
    };

    const users = getUsers();

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    return {
        success: true,
        message:
            "Inscription réussie. Bienvenue sur Housing's YQD.",
        user: newUser
    };
}


/* =========================================================
   CONNEXION
========================================================= */

function loginUser(phone, password) {
    const user = findUserByPhone(phone);

    if (!user) {
        return {
            success: false,
            message:
                "Aucun compte n'est associé à ce numéro."
        };
    }

    if (String(user.password) !== String(password)) {
        return {
            success: false,
            message:
                "Mot de passe incorrect."
        };
    }

    setCurrentUser(user);

    return {
        success: true,
        message:
            "Connexion réussie.",
        user
    };
}

function logoutUser() {
    localStorage.removeItem(
        HYQD_KEYS.CURRENT_USER
    );
}

function requireAuth() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href =
            "login.html";
        return null;
    }

    return user;
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function addNotification(user, title, message) {
    if (!Array.isArray(user.notifications)) {
        user.notifications = [];
    }

    user.notifications.unshift({
        id: generateId("NOTIFICATION"),
        title,
        message,
        read: false,
        createdAt:
            new Date().toISOString()
    });
}


/* =========================================================
   DÉPÔTS
========================================================= */

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

function requestDeposit(
    amount,
    method,
    reference
) {
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message:
                "Votre session a expiré."
        };
    }

    const value = Number(amount);

    if (
        !Number.isFinite(value) ||
        value < 1000
    ) {
        return {
            success: false,
            message:
                "Le montant minimum est de 1 000 FCFA."
        };
    }

    if (!method) {
        return {
            success: false,
            message:
                "Veuillez sélectionner la méthode de dépôt."
        };
    }

    if (!String(reference || "").trim()) {
        return {
            success: false,
            message:
                "Veuillez saisir la référence de transaction."
        };
    }

    const transaction = {
        id: generateId("DEP"),
        type: "deposit",
        amount: value,
        method,
        reference:
            String(reference).trim(),
        status: "pending",
        createdAt:
            new Date().toISOString()
    };

    user.transactions =
        Array.isArray(user.transactions)
            ? user.transactions
            : [];

    user.transactions.unshift(
        transaction
    );

    addNotification(
        user,
        "Demande de dépôt",
        "Votre dépôt de " +
        formatFCFA(value) +
        " est en attente de validation."
    );

    updateUser(user);

    return {
        success: true,
        message:
            "Demande de dépôt envoyée. Elle doit maintenant être validée par l'administration.",
        transaction
    };
}


/* =========================================================
   RETRAITS
========================================================= */

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

function requestWithdrawal(
    amount,
    method,
    phone
) {
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message:
                "Votre session a expiré."
        };
    }

    const value = Number(amount);

    if (
        !Number.isFinite(value) ||
        value < 1000
    ) {
        return {
            success: false,
            message:
                "Veuillez saisir un montant valide."
        };
    }

    if (value > Number(user.balance || 0)) {
        return {
            success: false,
            message:
                "Votre solde disponible est insuffisant."
        };
    }

    if (!method) {
        return {
            success: false,
            message:
                "Veuillez sélectionner la méthode de retrait."
        };
    }

    const transaction = {
        id: generateId("WITHDRAW"),
        type: "withdraw",
        amount: value,
        method,
        phone: normalizePhone(
            phone || user.phone
        ),
        status: "pending",
        createdAt:
            new Date().toISOString()
    };

    user.transactions =
        Array.isArray(user.transactions)
            ? user.transactions
            : [];

    user.transactions.unshift(
        transaction
    );

    addNotification(
        user,
        "Demande de retrait",
        "Votre retrait est en attente de validation."
    );

    updateUser(user);

    return {
        success: true,
        message:
            "Votre demande de retrait a été envoyée.",
        transaction
    };
}


/* =========================================================
   INVESTISSEMENTS
========================================================= */

function investInPack(pack) {
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message:
                "Veuillez vous reconnecter."
        };
    }

    if (!pack || !pack.amount) {
        return {
            success: false,
            message:
                "Pack d'investissement invalide."
        };
    }

    const amount = Number(pack.amount);

    if (
        Number(user.balance || 0) < amount
    ) {
        return {
            success: false,
            message:
                "Votre solde est insuffisant pour ce pack."
        };
    }

    const startDate = new Date();

    const endDate = new Date(
        startDate.getTime() +
        HYQD_CONFIG.INVESTMENT_DURATION *
        24 * 60 * 60 * 1000
    );

    const investment = {
        id: generateId("INVEST"),
        packId:
            pack.id || generateId("PACK"),
        packName:
            pack.name || "Pack Housing's YQD",
        amount,
        duration:
            HYQD_CONFIG.INVESTMENT_DURATION,
        image:
            pack.image || "",
        status: "active",
        createdAt:
            startDate.toISOString(),
        startDate:
            startDate.toISOString(),
        endDate:
            endDate.toISOString()
    };

    user.balance =
        Number(user.balance || 0) -
        amount;

    user.totalInvested =
        Number(user.totalInvested || 0) +
        amount;

    user.investments =
        Array.isArray(user.investments)
            ? user.investments
            : [];

    user.investments.unshift(
        investment
    );

    addNotification(
        user,
        "Investissement activé",
        investment.packName +
        " a été activé."
    );

    updateUser(user);

    return {
        success: true,
        message:
            "Votre investissement a été activé avec succès.",
        investment
    };
}


/* =========================================================
   ASSISTANCE
========================================================= */

function createSupportTicket(
    subject,
    message
) {
    return createTicket(
        subject,
        message
    );
}

function createTicket(
    subject,
    message
) {
    const user = getCurrentUser();

    if (!user) {
        return {
            success: false,
            message:
                "Veuillez vous reconnecter."
        };
    }

    const cleanSubject =
        String(subject || "").trim();

    const cleanMessage =
        String(message || "").trim();

    if (
        cleanSubject.length < 3 ||
        cleanMessage.length < 3
    ) {
        return {
            success: false,
            message:
                "Veuillez renseigner correctement votre demande."
        };
    }

    const ticket = {
        id: generateId("TICKET"),
        subject: cleanSubject,
        message: cleanMessage,
        status: "open",
        adminReply: "",
        createdAt:
            new Date().toISOString()
    };

    user.tickets =
        Array.isArray(user.tickets)
            ? user.tickets
            : [];

    user.tickets.unshift(ticket);

    updateUser(user);

    return {
        success: true,
        message:
            "Votre demande d'assistance a été envoyée.",
        ticket
    };
}


/* =========================================================
   ADMIN
========================================================= */

function authenticateAdmin(code) {
    return adminLogin(code);
}

function adminLogin(code) {
    if (
        String(code || "").trim() !==
        HYQD_CONFIG.ADMIN_CODE
    ) {
        return {
            success: false,
            message:
                "Code administrateur incorrect."
        };
    }

    sessionStorage.setItem(
        HYQD_KEYS.ADMIN_SESSION,
        "authenticated"
    );

    return {
        success: true,
        message:
            "Accès administrateur autorisé."
    };
}

function isAdminAuthenticated() {
    return (
        sessionStorage.getItem(
            HYQD_KEYS.ADMIN_SESSION
        ) === "authenticated"
    );
}

function adminLogout() {
    sessionStorage.removeItem(
        HYQD_KEYS.ADMIN_SESSION
    );
}


/* =========================================================
   VALIDATION ADMIN
========================================================= */

function adminProcessTransaction(
    userId,
    transactionId,
    decision
) {
    if (!isAdminAuthenticated()) {
        return {
            success: false,
            message:
                "Session administrateur non autorisée."
        };
    }

    const users = getUsers();

    const userIndex =
        users.findIndex(
            user => user.id === userId
        );

    if (userIndex === -1) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user = users[userIndex];

    user.transactions =
        Array.isArray(user.transactions)
            ? user.transactions
            : [];

    const transaction =
        user.transactions.find(
            item =>
                item.id === transactionId
        );

    if (!transaction) {
        return {
            success: false,
            message:
                "Transaction introuvable."
        };
    }

    if (transaction.status !== "pending") {
        return {
            success: false,
            message:
                "Cette transaction a déjà été traitée."
        };
    }

    if (
        decision !== "approved" &&
        decision !== "rejected"
    ) {
        return {
            success: false,
            message:
                "Décision administrative invalide."
        };
    }

    if (decision === "rejected") {
        transaction.status = "rejected";
        transaction.processedAt =
            new Date().toISOString();

        addNotification(
            user,
            "Transaction refusée",
            transaction.type === "deposit"
                ? "Votre demande de dépôt a été refusée."
                : "Votre demande de retrait a été refusée."
        );

        users[userIndex] = user;
        saveUsers(users);

        return {
            success: true,
            message:
                "Transaction refusée."
        };
    }


    /* -------------------------
       VALIDATION DÉPÔT
    ------------------------- */

    if (transaction.type === "deposit") {
        transaction.status = "approved";
        transaction.processedAt =
            new Date().toISOString();

        user.balance =
            Number(user.balance || 0) +
            Number(transaction.amount || 0);

        user.totalDeposited =
            Number(user.totalDeposited || 0) +
            Number(transaction.amount || 0);

        addNotification(
            user,
            "Dépôt validé",
            "Votre dépôt de " +
            formatFCFA(transaction.amount) +
            " a été validé."
        );


        /* BONUS PREMIER DÉPÔT */

        if (!user.firstDepositCompleted) {
            user.firstDepositCompleted = true;

            if (user.sponsorId) {
                const sponsorIndex =
                    users.findIndex(
                        item =>
                            item.id ===
                            user.sponsorId
                    );

                if (sponsorIndex !== -1) {
                    const sponsor =
                        users[sponsorIndex];

                    const bonus =
                        Math.round(
                            Number(
                                transaction.amount
                            ) *
                            HYQD_CONFIG
                                .REFERRAL_RATE
                        );

                    sponsor.balance =
                        Number(
                            sponsor.balance || 0
                        ) + bonus;

                    sponsor.totalReferralBonus =
                        Number(
                            sponsor.totalReferralBonus ||
                            0
                        ) + bonus;

                    sponsor.transactions =
                        Array.isArray(
                            sponsor.transactions
                        )
                            ? sponsor.transactions
                            : [];

                    sponsor.transactions.unshift({
                        id:
                            generateId("BONUS"),
                        type:
                            "referral_bonus",
                        amount:
                            bonus,
                        status:
                            "approved",
                        sourceUserId:
                            user.id,
                        createdAt:
                            new Date()
                                .toISOString()
                    });

                    addNotification(
                        sponsor,
                        "Bonus de parrainage",
                        "Vous avez reçu " +
                        formatFCFA(bonus) +
                        " de bonus de parrainage."
                    );

                    users[sponsorIndex] =
                        sponsor;
                }
            }
        }
    }


    /* -------------------------
       VALIDATION RETRAIT
    ------------------------- */

    if (transaction.type === "withdraw") {
        const amount =
            Number(transaction.amount || 0);

        if (
            Number(user.balance || 0) <
            amount
        ) {
            return {
                success: false,
                message:
                    "Le solde actuel de l'utilisateur est insuffisant."
            };
        }

        transaction.status = "approved";
        transaction.processedAt =
            new Date().toISOString();

        user.balance =
            Number(user.balance || 0) -
            amount;

        user.totalWithdrawn =
            Number(user.totalWithdrawn || 0) +
            amount;

        addNotification(
            user,
            "Retrait validé",
            "Votre retrait de " +
            formatFCFA(amount) +
            " a été validé."
        );
    }

    users[userIndex] = user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Transaction validée avec succès."
    };
}


/* =========================================================
   RÉPONSE ADMINISTRATEUR
========================================================= */

function adminReplyToTicket(
    userId,
    ticketId,
    reply
) {
    if (!isAdminAuthenticated()) {
        return {
            success: false,
            message:
                "Accès administrateur refusé."
        };
    }

    const users = getUsers();

    const index =
        users.findIndex(
            user => user.id === userId
        );

    if (index === -1) {
        return {
            success: false,
            message:
                "Utilisateur introuvable."
        };
    }

    const user = users[index];

    const ticket =
        (user.tickets || []).find(
            item =>
                item.id === ticketId
        );

    if (!ticket) {
        return {
            success: false,
            message:
                "Ticket introuvable."
        };
    }

    if (!String(reply || "").trim()) {
        return {
            success: false,
            message:
                "Veuillez saisir une réponse."
        };
    }

    ticket.adminReply =
        String(reply).trim();

    ticket.status =
        "answered";

    ticket.answeredAt =
        new Date().toISOString();

    addNotification(
        user,
        "Assistance",
        "L'administration a répondu à votre demande."
    );

    users[index] = user;

    saveUsers(users);

    return {
        success: true,
        message:
            "Réponse envoyée avec succès."
    };
}


/* =========================================================
   MOT DE PASSE OUBLIÉ
   VERSION LOCALE DE DÉMONSTRATION
========================================================= */

function requestPasswordReset(phone) {
    const user =
        findUserByPhone(phone);

    if (!user) {
        return {
            success: false,
            message:
                "Aucun compte trouvé avec ce numéro."
        };
    }

    return {
        success: true,
        message:
            "Compte identifié. La réinitialisation sécurisée sera reliée au service d'authentification."
    };
}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const page =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        if (
            page === "dashboard.html" &&
            !getCurrentUser()
        ) {
            window.location.href =
                "login.html";
        }
    }
);
