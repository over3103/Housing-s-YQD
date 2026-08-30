/* =========================================================
   HOUSING'S YQD
   SCRIPT GLOBAL
   Version de démonstration locale

   IMPORTANT :
   Les données sont actuellement stockées dans localStorage.
   Pour la version publique réelle, il faudra utiliser
   Supabase ou un véritable serveur sécurisé.
========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const HYQD_CONFIG = {
    APP_NAME: "Housing's YQD",
    USERS_KEY: "hyqd_users",
    CURRENT_USER_KEY: "hyqd_current_user",
    ADMIN_KEY: "hyqd_admin_authenticated",
    ADMIN_CODE: "937854M",
    DEPOSITS_KEY: "hyqd_deposits",
    WITHDRAWALS_KEY: "hyqd_withdrawals",
    INVESTMENTS_KEY: "hyqd_investments",
    TICKETS_KEY: "hyqd_tickets",
    NOTIFICATIONS_KEY: "hyqd_notifications",
    REFERRAL_REWARDS_KEY: "hyqd_referral_rewards",
    TRANSACTIONS_KEY: "hyqd_transactions"
};


/* =========================================================
   OUTILS LOCAL STORAGE
========================================================= */

function hyqdGet(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (!value) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error("Erreur de lecture :", key, error);

        return fallback;

    }

}


function hyqdSet(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error("Erreur d'enregistrement :", key, error);

        return false;

    }

}


function hyqdRemove(key) {

    localStorage.removeItem(key);

}


/* =========================================================
   UTILITAIRES
========================================================= */

function generateId(prefix = "HYQD") {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );

}


function formatFCFA(amount) {

    const number = Number(amount || 0);

    return number.toLocaleString(
        "fr-FR",
        {
            maximumFractionDigits: 0
        }
    ) + " FCFA";

}


function getCurrentDate() {

    return new Date().toISOString();

}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    try {

        return new Date(date).toLocaleDateString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (error) {

        return "-";

    }

}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;

}


/* =========================================================
   GESTION DES UTILISATEURS
========================================================= */

function getUsers() {

    return hyqdGet(
        HYQD_CONFIG.USERS_KEY,
        []
    );

}


function saveUsers(users) {

    return hyqdSet(
        HYQD_CONFIG.USERS_KEY,
        users
    );

}


function getCurrentUser() {

    return hyqdGet(
        HYQD_CONFIG.CURRENT_USER_KEY,
        null
    );

}


function saveCurrentUser(user) {

    return hyqdSet(
        HYQD_CONFIG.CURRENT_USER_KEY,
        user
    );

}


function findUserById(userId) {

    const users = getUsers();

    return users.find(
        user => user.id === userId
    ) || null;

}


function findUserByPhone(phone) {

    const users = getUsers();

    return users.find(
        user => user.phone === phone
    ) || null;

}


function findUserByReferralCode(code) {

    if (!code) {
        return null;
    }

    const users = getUsers();

    const cleanCode =
        String(code)
            .trim()
            .toUpperCase();

    return users.find(
        user =>
            String(
                user.referralCode || ""
            ).toUpperCase() === cleanCode
    ) || null;

}


function updateUser(updatedUser) {

    const users = getUsers();

    const index =
        users.findIndex(
            user =>
                user.id === updatedUser.id
        );

    if (index === -1) {
        return false;
    }

    users[index] = updatedUser;

    saveUsers(users);

    const currentUser =
        getCurrentUser();

    if (
        currentUser &&
        currentUser.id === updatedUser.id
    ) {

        saveCurrentUser(updatedUser);

    }

    return true;

}


/* =========================================================
   CODE DE PARRAINAGE
========================================================= */

function generateReferralCode(
    fullName = ""
) {

    const cleanName =
        String(fullName)
            .replace(/[^a-zA-Z]/g, "")
            .substring(0, 4)
            .toUpperCase() || "YQD";

    const random =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return cleanName + random;

}


function generateUniqueReferralCode(
    fullName
) {

    let code =
        generateReferralCode(fullName);

    let existing =
        findUserByReferralCode(code);

    while (existing) {

        code =
            generateReferralCode(fullName);

        existing =
            findUserByReferralCode(code);

    }

    return code;

}


/* =========================================================
   INSCRIPTION
========================================================= */

function registerUser({
    fullName,
    phone,
    email = "",
    password,
    confirmPassword,
    referralCode = ""
}) {

    const name =
        String(fullName || "")
            .trim();

    const cleanPhone =
        String(phone || "")
            .trim();

    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();

    const cleanPassword =
        String(password || "");

    const cleanConfirmPassword =
        String(confirmPassword || "");


    if (name.length < 3) {

        return {
            success: false,
            message:
                "Veuillez saisir votre nom complet."
        };

    }


    if (
        cleanPhone.length < 8
    ) {

        return {
            success: false,
            message:
                "Veuillez saisir un numéro de téléphone valide."
        };

    }


    if (
        cleanPassword.length < 6
    ) {

        return {
            success: false,
            message:
                "Le mot de passe doit contenir au moins 6 caractères."
        };

    }


    if (
        cleanPassword !==
        cleanConfirmPassword
    ) {

        return {
            success: false,
            message:
                "Les mots de passe ne correspondent pas."
        };

    }


    const existingUser =
        findUserByPhone(cleanPhone);


    if (existingUser) {

        return {
            success: false,
            message:
                "Ce numéro est déjà enregistré."
        };

    }


    let referrer = null;


    if (
        referralCode &&
        String(referralCode).trim()
    ) {

        referrer =
            findUserByReferralCode(
                referralCode
            );

    }


    const newUser = {

        id:
            generateId("USER"),

        fullName:
            name,

        phone:
            cleanPhone,

        email:
            cleanEmail,

        password:
            cleanPassword,

        balance:
            0,

        totalDeposited:
            0,

        totalWithdrawn:
            0,

        totalInvested:
            0,

        referralCode:
            generateUniqueReferralCode(name),

        referredBy:
            referrer
                ? referrer.id
                : null,

        referralRewardReceived:
            false,

        status:
            "active",

        createdAt:
            getCurrentDate()

    };


    const users =
        getUsers();


    users.push(newUser);


    saveUsers(users);


    saveCurrentUser(newUser);


    return {

        success: true,

        message:
            "Inscription réussie. Bienvenue sur Housing's YQD !",

        user:
            newUser

    };

}


/* =========================================================
   CONNEXION
========================================================= */

function loginUser(
    phone,
    password
) {

    const cleanPhone =
        String(phone || "")
            .trim();

    const cleanPassword =
        String(password || "");


    if (
        !cleanPhone ||
        !cleanPassword
    ) {

        return {

            success: false,

            message:
                "Veuillez renseigner votre numéro et votre mot de passe."

        };

    }


    const user =
        findUserByPhone(
            cleanPhone
        );


    if (!user) {

        return {

            success: false,

            message:
                "Aucun compte ne correspond à ce numéro."

        };

    }


    if (
        user.password !==
        cleanPassword
    ) {

        return {

            success: false,

            message:
                "Mot de passe incorrect."

        };

    }


    if (
        user.status === "blocked"
    ) {

        return {

            success: false,

            message:
                "Votre compte est actuellement suspendu."

        };

    }


    saveCurrentUser(user);


    return {

        success: true,

        message:
            "Connexion réussie.",

        user

    };

}


/* =========================================================
   DÉCONNEXION
========================================================= */

function logoutUser() {

    hyqdRemove(
        HYQD_CONFIG.CURRENT_USER_KEY
    );

    window.location.href =
        "login.html";

}


/* =========================================================
   PROTECTION DES PAGES
========================================================= */

function requireAuth() {

    const user =
        getCurrentUser();


    if (!user) {

        window.location.href =
            "login.html";

        return null;

    }


    const realUser =
        findUserById(
            user.id
        );


    if (!realUser) {

        hyqdRemove(
            HYQD_CONFIG.CURRENT_USER_KEY
        );

        window.location.href =
            "login.html";

        return null;

    }


    if (
        realUser.status === "blocked"
    ) {

        hyqdRemove(
            HYQD_CONFIG.CURRENT_USER_KEY
        );

        window.location.href =
            "login.html";

        return null;

    }


    saveCurrentUser(realUser);


    return realUser;

}


/* =========================================================
   DÉPÔTS
========================================================= */

function getDeposits() {

    return hyqdGet(
        HYQD_CONFIG.DEPOSITS_KEY,
        []
    );

}


function saveDeposits(deposits) {

    return hyqdSet(
        HYQD_CONFIG.DEPOSITS_KEY,
        deposits
    );

}


function requestDeposit({
    userId,
    amount,
    method = "",
    reference = ""
}) {

    const numericAmount =
        Number(amount);


    if (
        !userId ||
        !numericAmount ||
        numericAmount <= 0
    ) {

        return {

            success: false,

            message:
                "Montant invalide."

        };

    }


    const deposit = {

        id:
            generateId("DEP"),

        userId,

        amount:
            numericAmount,

        method:
            method || "Non précisé",

        reference:
            reference || "",

        status:
            "pending",

        createdAt:
            getCurrentDate(),

        validatedAt:
            null

    };


    const deposits =
        getDeposits();


    deposits.unshift(deposit);


    saveDeposits(deposits);


    return {

        success: true,

        message:
            "Votre demande de dépôt a été enregistrée et attend validation."

    };

}


/* =========================================================
   VALIDATION DÉPÔT ADMIN
========================================================= */

function validateDeposit(
    depositId
) {

    const deposits =
        getDeposits();


    const deposit =
        deposits.find(
            item =>
                item.id === depositId
        );


    if (!deposit) {

        return {

            success: false,

            message:
                "Dépôt introuvable."

        };

    }


    if (
        deposit.status !==
        "pending"
    ) {

        return {

            success: false,

            message:
                "Cette demande a déjà été traitée."

        };

    }


    const user =
        findUserById(
            deposit.userId
        );


    if (!user) {

        return {

            success: false,

            message:
                "Utilisateur introuvable."

        };

    }


    deposit.status =
        "approved";


    deposit.validatedAt =
        getCurrentDate();


    saveDeposits(deposits);


    user.balance =
        Number(user.balance || 0) +
        Number(deposit.amount);


    user.totalDeposited =
        Number(user.totalDeposited || 0) +
        Number(deposit.amount);


    updateUser(user);


    processReferralReward(
        user,
        deposit.amount
    );


    addTransaction({

        userId:
            user.id,

        type:
            "deposit",

        amount:
            deposit.amount,

        status:
            "approved",

        description:
            "Dépôt validé"

    });


    return {

        success: true,

        message:
            "Dépôt validé avec succès."

    };

}


function rejectDeposit(
    depositId
) {

    const deposits =
        getDeposits();


    const deposit =
        deposits.find(
            item =>
                item.id === depositId
        );


    if (!deposit) {

        return {

            success: false,

            message:
                "Dépôt introuvable."

        };

    }


    if (
        deposit.status !==
        "pending"
    ) {

        return {

            success: false,

            message:
                "Cette demande a déjà été traitée."

        };

    }


    deposit.status =
        "rejected";


    deposit.validatedAt =
        getCurrentDate();


    saveDeposits(deposits);


    return {

        success: true,

        message:
            "Dépôt refusé."

    };

}


/* =========================================================
   RETRAITS
========================================================= */

function getWithdrawals() {

    return hyqdGet(
        HYQD_CONFIG.WITHDRAWALS_KEY,
        []
    );

}


function saveWithdrawals(
    withdrawals
) {

    return hyqdSet(
        HYQD_CONFIG.WITHDRAWALS_KEY,
        withdrawals
    );

}


function requestWithdrawal({
    userId,
    amount,
    method = ""
}) {

    const user =
        findUserById(userId);


    const numericAmount =
        Number(amount);


    if (!user) {

        return {

            success: false,

            message:
                "Utilisateur introuvable."

        };

    }


    if (
        !numericAmount ||
        numericAmount <= 0
    ) {

        return {

            success: false,

            message:
                "Montant invalide."

        };

    }


    if (
        numericAmount >
        Number(user.balance || 0)
    ) {

        return {

            success: false,

            message:
                "Solde insuffisant."

        };

    }


    const withdrawals =
        getWithdrawals();


    const withdrawal = {

        id:
            generateId("WIT"),

        userId,

        amount:
            numericAmount,

        fee:
            0,

        netAmount:
            numericAmount,

        method:
            method || "Non précisé",

        status:
            "pending",

        createdAt:
            getCurrentDate(),

        validatedAt:
            null

    };


    withdrawals.unshift(
        withdrawal
    );


    saveWithdrawals(
        withdrawals
    );


    return {

        success: true,

        message:
            "Votre demande de retrait attend validation."

    };

}


function validateWithdrawal(
    withdrawalId
) {

    const withdrawals =
        getWithdrawals();


    const withdrawal =
        withdrawals.find(
            item =>
                item.id === withdrawalId
        );


    if (!withdrawal) {

        return {

            success: false,

            message:
                "Retrait introuvable."

        };

    }


    if (
        withdrawal.status !==
        "pending"
    ) {

        return {

            success: false,

            message:
                "Cette demande a déjà été traitée."

        };

    }


    const user =
        findUserById(
            withdrawal.userId
        );


    if (!user) {

        return {

            success: false,

            message:
                "Utilisateur introuvable."

        };

    }


    if (
        Number(user.balance || 0) <
        Number(withdrawal.amount)
    ) {

        return {

            success: false,

            message:
                "Solde utilisateur insuffisant."

        };

    }


    user.balance =
        Number(user.balance || 0) -
        Number(withdrawal.amount);


    user.totalWithdrawn =
        Number(user.totalWithdrawn || 0) +
        Number(withdrawal.amount);


    updateUser(user);


    withdrawal.status =
        "approved";


    withdrawal.validatedAt =
        getCurrentDate();


    saveWithdrawals(
        withdrawals
    );


    addTransaction({

        userId:
            user.id,

        type:
            "withdrawal",

        amount:
            withdrawal.amount,

        status:
            "approved",

        description:
            "Retrait validé"

    });


    return {

        success: true,

        message:
            "Retrait validé avec succès."

    };

}


function rejectWithdrawal(
    withdrawalId
) {

    const withdrawals =
        getWithdrawals();


    const withdrawal =
        withdrawals.find(
            item =>
                item.id === withdrawalId
        );


    if (!withdrawal) {

        return {

            success: false,

            message:
                "Retrait introuvable."

        };

    }


    if (
        withdrawal.status !==
        "pending"
    ) {

        return {

            success: false,

            message:
                "Cette demande a déjà été traitée."

        };

    }


    withdrawal.status =
        "rejected";


    withdrawal.validatedAt =
        getCurrentDate();


    saveWithdrawals(
        withdrawals
    );


    return {

        success: true,

        message:
            "Retrait refusé."

    };

}


/* =========================================================
   INVESTISSEMENTS
========================================================= */

function getInvestments() {

    return hyqdGet(
        HYQD_CONFIG.INVESTMENTS_KEY,
        []
    );

}


function saveInvestments(
    investments
) {

    return hyqdSet(
        HYQD_CONFIG.INVESTMENTS_KEY,
        investments
    );

}


function createInvestment({
    userId,
    packName,
    amount,
    dailyReturn = 0,
    duration = 180,
    houseImage = ""
}) {

    const user =
        findUserById(userId);


    const numericAmount =
        Number(amount);


    if (!user) {

        return {

            success: false,

            message:
                "Utilisateur introuvable."

        };

    }


    if (
        numericAmount <= 0
    ) {

        return {

            success: false,

            message:
                "Montant invalide."

        };

    }


    if (
        Number(user.balance || 0) <
        numericAmount
    ) {

        return {

            success: false,

            message:
                "Solde insuffisant pour cet investissement."

        };

    }


    user.balance =
        Number(user.balance || 0) -
        numericAmount;


    user.totalInvested =
        Number(user.totalInvested || 0) +
        numericAmount;


    updateUser(user);


    const investment = {

        id:
            generateId("INV"),

        userId,

        packName,

        amount:
            numericAmount,

        dailyReturn:
            Number(dailyReturn || 0),

        duration:
            Number(duration || 180),

        daysCompleted:
            0,

        status:
            "active",

        houseImage,

        createdAt:
            getCurrentDate(),

        endDate:
            new Date(
                Date.now() +
                Number(duration || 180) *
                24 *
                60 *
                60 *
                1000
            ).toISOString()

    };


    const investments =
        getInvestments();


    investments.unshift(
        investment
    );


    saveInvestments(
        investments
    );


    addTransaction({

        userId,

        type:
            "investment",

        amount:
            numericAmount,

        status:
            "approved",

        description:
            "Investissement " +
            packName

    });


    return {

        success: true,

        message:
            "Investissement créé avec succès."

    };

}


/* =========================================================
   PARRAINAGE
========================================================= */

function processReferralReward(
    user,
    firstDepositAmount
) {

    if (
        !user.referredBy
    ) {
        return;
    }


    if (
        user.referralRewardReceived
    ) {
        return;
    }


    const referrer =
        findUserById(
            user.referredBy
        );


    if (!referrer) {
        return;
    }


    const reward =
        Number(firstDepositAmount) *
        0.10;


    referrer.balance =
        Number(referrer.balance || 0) +
        reward;


    updateUser(referrer);


    user.referralRewardReceived =
        true;


    updateUser(user);


    const rewards =
        hyqdGet(
            HYQD_CONFIG.REFERRAL_REWARDS_KEY,
            []
        );


    rewards.unshift({

        id:
            generateId("REF"),

        referrerId:
            referrer.id,

        referredUserId:
            user.id,

        amount:
            reward,

        createdAt:
            getCurrentDate()

    });


    hyqdSet(
        HYQD_CONFIG.REFERRAL_REWARDS_KEY,
        rewards
    );


    addTransaction({

        userId:
            referrer.id,

        type:
            "referral",

        amount:
            reward,

        status:
            "approved",

        description:
            "Bonus de parrainage"

    });

}


/* =========================================================
   TRANSACTIONS
========================================================= */

function getTransactions() {

    return hyqdGet(
        HYQD_CONFIG.TRANSACTIONS_KEY,
        []
    );

}


function addTransaction({

    userId,
    type,
    amount,
    status,
    description

}) {

    const transactions =
        getTransactions();


    transactions.unshift({

        id:
            generateId("TRX"),

        userId,

        type,

        amount:
            Number(amount || 0),

        status,

        description:
            description || "",

        createdAt:
            getCurrentDate()

    });


    hyqdSet(
        HYQD_CONFIG.TRANSACTIONS_KEY,
        transactions
    );

}


/* =========================================================
   TICKETS ASSISTANCE
========================================================= */

function getTickets() {

    return hyqdGet(
        HYQD_CONFIG.TICKETS_KEY,
        []
    );

}


function saveTickets(
    tickets
) {

    return hyqdSet(
        HYQD_CONFIG.TICKETS_KEY,
        tickets
    );

}


function createTicket({

    userId,

    subject,

    message

}) {

    if (
        !subject ||
        !message
    ) {

        return {

            success: false,

            message:
                "Veuillez remplir tous les champs."

        };

    }


    const tickets =
        getTickets();


    tickets.unshift({

        id:
            generateId("TICKET"),

        userId,

        subject,

        message,

        reply:
            "",

        status:
            "open",

        createdAt:
            getCurrentDate(),

        updatedAt:
            getCurrentDate()

    });


    saveTickets(
        tickets
    );


    return {

        success: true,

        message:
            "Votre demande a été envoyée."

    };

}


function replyTicket(
    ticketId,
    reply
) {

    const tickets =
        getTickets();


    const ticket =
        tickets.find(
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


    ticket.reply =
        reply;


    ticket.status =
        "answered";


    ticket.updatedAt =
        getCurrentDate();


    saveTickets(
        tickets
    );


    return {

        success: true,

        message:
            "Réponse envoyée."

    };

}


/* =========================================================
   ADMINISTRATION
========================================================= */

function adminLogin(
    code
) {

    if (
        String(code).trim() ===
        HYQD_CONFIG.ADMIN_CODE
    ) {

        sessionStorage.setItem(
            HYQD_CONFIG.ADMIN_KEY,
            "true"
        );


        return {

            success: true,

            message:
                "Code administrateur accepté."

        };

    }


    return {

        success: false,

        message:
            "Code administrateur incorrect."

    };

}


function isAdminAuthenticated() {

    return (
        sessionStorage.getItem(
            HYQD_CONFIG.ADMIN_KEY
        ) === "true"
    );

}


function requireAdminAuth() {

    if (
        !isAdminAuthenticated()
    ) {

        return false;

    }

    return true;

}


function adminLogout() {

    sessionStorage.removeItem(
        HYQD_CONFIG.ADMIN_KEY
    );

    window.location.href =
        "index.html";

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const oldToast =
        document.querySelector(
            ".hyqd-toast"
        );


    if (oldToast) {

        oldToast.remove();

    }


    const toast =
        document.createElement("div");


    toast.className =
        "hyqd-toast hyqd-toast-" +
        type;


    toast.innerHTML = `

        <div class="hyqd-toast-content">

            <span>${escapeHtml(message)}</span>

        </div>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "show"
            );

        },
        50
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        4000
    );

}


/* =========================================================
   AFFICHAGE NUMÉRO MASQUÉ
========================================================= */

function maskPhone(
    phone
) {

    const value =
        String(phone || "");


    if (
        value.length <= 4
    ) {

        return "*****";

    }


    const lastFour =
        value.slice(-4);


    return (
        "*****" +
        lastFour
    );

}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Housing's YQD initialisé."
        );

    }
);
