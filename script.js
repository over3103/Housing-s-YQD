/* =========================================================
   HOUSING'S YQD
   SCRIPT GLOBAL DE LA PLATEFORME

   Gestion :
   - Utilisateurs
   - Inscription
   - Connexion
   - Session
   - Parrainage
   - Dépôts
   - Retraits
   - Investissements
   - Tickets
   - Administration

   VERSION DE DÉVELOPPEMENT

   IMPORTANT :
   localStorage ne constitue pas une sécurité suffisante
   pour une plateforme réelle. Une migration vers Supabase
   ou un serveur sécurisé sera nécessaire avant publication.
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const HYQD_CONFIG = {

    platformName:
        "Housing's YQD",

    adminCode:
        "937854M",

    investmentDuration:
        180,

    referralBonus:
        0.10,

    currency:
        "FCFA"

};


/* =========================================================
   CLÉS DE STOCKAGE
========================================================= */

const STORAGE_KEYS = {

    users:
        "housingYQDUsers",

    currentUser:
        "housingYQDCurrentUser",

    adminSession:
        "housingYQDAdminSession",

    passwordResets:
        "housingYQDPasswordResets"

};


/* =========================================================
   PACKS D'INVESTISSEMENT
========================================================= */

const INVESTMENT_PACKS = [

    {
        id:
            "starter",

        name:
            "Pack Starter",

        amount:
            3000,

        dailyIncome:
            800,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "familial",

        name:
            "Pack Familial",

        amount:
            10000,

        dailyIncome:
            3000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "confort",

        name:
            "Pack Confort",

        amount:
            20000,

        dailyIncome:
            6000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "premium",

        name:
            "Pack Premium",

        amount:
            45000,

        dailyIncome:
            14000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "prestige",

        name:
            "Pack Prestige",

        amount:
            100000,

        dailyIncome:
            30000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "premium-plus",

        name:
            "Pack Premium Plus",

        amount:
            200000,

        dailyIncome:
            65000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "elite",

        name:
            "Pack Elite",

        amount:
            400000,

        dailyIncome:
            140000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
    },

    {
        id:
            "luxury",

        name:
            "Pack Luxury",

        amount:
            800000,

        dailyIncome:
            290000,

        duration:
            180,

        image:
            "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=80"
    }

];


/* =========================================================
   OUTILS GENERAUX
========================================================= */


/* Générer un identifiant */

function generateId(
    prefix = "HYQD"
) {

    return (
        prefix +
        "_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


/* Générer un code */

function generateCode(
    length = 8
) {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let result =
        "";


    for (
        let index = 0;
        index < length;
        index++
    ) {

        result +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

    }


    return result;

}


/* Formater les montants */

function formatFCFA(
    amount
) {

    const value =
        Number(
            amount || 0
        );


    return (
        value.toLocaleString(
            "fr-FR"
        ) +
        " FCFA"
    );

}


/* Masquer numéro */

function maskPhoneNumber(
    phone
) {

    if (
        !phone
    ) {

        return
            "*****";

    }


    const clean =
        String(phone)
            .replace(
                /\D/g,
                ""
            );


    if (
        clean.length < 4
    ) {

        return
            "*****";

    }


    return (
        "*****" +
        clean.slice(
            -4
        )
    );

}


/* Date */

function formatDate(
    value
) {

    if (
        !value
    ) {

        return
            "-";

    }


    try {

        return new Date(
            value
        ).toLocaleString(
            "fr-FR"
        );

    }

    catch (
        error
    ) {

        return
            "-";

    }

}


/* =========================================================
   GESTION UTILISATEURS
========================================================= */


/* Obtenir tous les utilisateurs */

function getUsers() {

    try {

        const users =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEYS.users
                )
            );


        return Array.isArray(
            users
        )

            ? users

            : [];


    }

    catch (
        error
    ) {

        return [];

    }

}


/* Sauvegarder utilisateurs */

function saveUsers(
    users
) {

    localStorage.setItem(
        STORAGE_KEYS.users,
        JSON.stringify(
            users
        )
    );

}


/* Trouver utilisateur */

function findUserById(
    userId
) {

    return getUsers()
        .find(
            function (
                user
            ) {

                return user.id ===
                    userId;

            }
        );

}


/* Trouver téléphone */

function findUserByPhone(
    phone
) {

    const cleanPhone =
        normalizePhone(
            phone
        );


    return getUsers()
        .find(
            function (
                user
            ) {

                return normalizePhone(
                    user.phone
                ) ===
                cleanPhone;

            }
        );

}


/* Trouver code */

function findUserByReferralCode(
    code
) {

    if (
        !code
    ) {

        return null;

    }


    const searchCode =
        String(code)
            .trim()
            .toUpperCase();


    return getUsers()
        .find(
            function (
                user
            ) {

                return String(
                    user.referralCode ||
                    ""
                )
                    .toUpperCase() ===
                    searchCode;

            }
        );

}


/* Mettre à jour utilisateur */

function updateUser(
    updatedUser
) {

    const users =
        getUsers();


    const index =
        users.findIndex(
            function (
                user
            ) {

                return user.id ===
                    updatedUser.id;

            }
        );


    if (
        index === -1
    ) {

        return false;

    }


    users[
        index
    ] =
        updatedUser;


    saveUsers(
        users
    );


    const currentUser =
        getCurrentUser();


    if (
        currentUser &&
        currentUser.id ===
        updatedUser.id
    ) {

        setCurrentUser(
            updatedUser
        );

    }


    return true;

}


/* =========================================================
   TELEPHONE
========================================================= */

function normalizePhone(
    phone
) {

    if (
        !phone
    ) {

        return "";

    }


    let clean =
        String(phone)
            .replace(
                /\D/g,
                ""
            );


    if (
        clean.startsWith(
            "225"
        )
    ) {

        clean =
            clean.substring(
                3
            );

    }


    return clean;

}


/* =========================================================
   SESSION UTILISATEUR
========================================================= */

function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE_KEYS.currentUser
            )
        );

    }

    catch (
        error
    ) {

        return null;

    }

}


function setCurrentUser(
    user
) {

    localStorage.setItem(
        STORAGE_KEYS.currentUser,
        JSON.stringify(
            user
        )
    );

}


function saveCurrentUser(
    user
) {

    setCurrentUser(
        user
    );


    updateUser(
        user
    );

}


function clearCurrentUser() {

    localStorage.removeItem(
        STORAGE_KEYS.currentUser
    );

}


function isLoggedIn() {

    const user =
        getCurrentUser();


    if (
        !user ||
        !user.id
    ) {

        return false;

    }


    const databaseUser =
        findUserById(
            user.id
        );


    return !!databaseUser;

}


/* =========================================================
   INSCRIPTION
========================================================= */

function registerUser(
    data
) {

    const name =
        String(
            data.name ||
            data.fullName ||
            ""
        )
            .trim();


    const phone =
        normalizePhone(
            data.phone
        );


    const password =
        String(
            data.password ||
            ""
        );


    const invitationCode =
        String(
            data.invitationCode ||
            data.referralCode ||
            ""
        )
            .trim()
            .toUpperCase();


    if (
        name.length < 2
    ) {

        return {

            success:
                false,

            message:
                "Veuillez saisir votre nom complet."

        };

    }


    if (
        phone.length < 8
    ) {

        return {

            success:
                false,

            message:
                "Veuillez saisir un numéro de téléphone valide."

        };

    }


    if (
        password.length < 6
    ) {

        return {

            success:
                false,

            message:
                "Le mot de passe doit contenir au moins 6 caractères."

        };

    }


    const users =
        getUsers();


    const existingUser =
        users.find(
            function (
                user
            ) {

                return normalizePhone(
                    user.phone
                ) ===
                phone;

            }
        );


    if (
        existingUser
    ) {

        return {

            success:
                false,

            message:
                "Ce numéro possède déjà un compte."

        };

    }


    let sponsor =
        null;


    if (
        invitationCode
    ) {

        sponsor =
            findUserByReferralCode(
                invitationCode
            );


        if (
            !sponsor
        ) {

            return {

                success:
                    false,

                message:
                    "Le code de parrainage est invalide."

            };

        }

    }


    let personalReferralCode;


    do {

        personalReferralCode =
            "YQD" +
            generateCode(
                6
            );

    }

    while (
        findUserByReferralCode(
            personalReferralCode
        )
    );


    const user = {

        id:
            generateId(
                "USER"
            ),

        name:
            name,

        fullName:
            name,

        phone:
            phone,

        password:
            password,

        balance:
            0,

        totalDeposits:
            0,

        totalWithdrawals:
            0,

        totalInvested:
            0,

        totalReferralBonus:
            0,

        referralCode:
            personalReferralCode,

        sponsorId:
            sponsor
                ? sponsor.id
                : null,

        sponsorCode:
            sponsor
                ? sponsor.referralCode
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

        createdAt:
            new Date()
                .toISOString()

    };


    users.push(
        user
    );


    saveUsers(
        users
    );


    setCurrentUser(
        user
    );


    return {

        success:
            true,

        message:
            "Votre compte a été créé avec succès.",

        user:
            user

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
        normalizePhone(
            phone
        );


    const user =
        getUsers()
            .find(
                function (
                    item
                ) {

                    return normalizePhone(
                        item.phone
                    ) ===
                    cleanPhone;

                }
            );


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Aucun compte n'est associé à ce numéro."

        };

    }


    if (
        user.password !==
        password
    ) {

        return {

            success:
                false,

            message:
                "Mot de passe incorrect."

        };

    }


    setCurrentUser(
        user
    );


    return {

        success:
            true,

        message:
            "Connexion réussie.",

        user:
            user

    };

}


/* =========================================================
   DECONNEXION
========================================================= */

function logoutUser() {

    clearCurrentUser();

}


/* =========================================================
   PROFIL
========================================================= */

function updateUserProfile(
    data
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Session utilisateur introuvable."

        };

    }


    const name =
        String(
            data.name ||
            data.fullName ||
            user.name
        )
            .trim();


    if (
        name.length < 2
    ) {

        return {

            success:
                false,

            message:
                "Nom invalide."

        };

    }


    user.name =
        name;


    user.fullName =
        name;


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Profil mis à jour.",

        user:
            user

    };

}


/* =========================================================
   CHANGEMENT MOT DE PASSE
========================================================= */

function changePassword(
    oldPassword,
    newPassword
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Utilisateur introuvable."

        };

    }


    if (
        user.password !==
        oldPassword
    ) {

        return {

            success:
                false,

            message:
                "Ancien mot de passe incorrect."

        };

    }


    if (
        String(
            newPassword
        ).length < 6
    ) {

        return {

            success:
                false,

            message:
                "Le nouveau mot de passe doit contenir au moins 6 caractères."

        };

    }


    user.password =
        newPassword;


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Mot de passe modifié avec succès."

    };

}


/* =========================================================
   RECUPERATION MOT DE PASSE

   MODE LOCAL DE DEVELOPPEMENT
========================================================= */

function requestPasswordReset(
    phone
) {

    const user =
        findUserByPhone(
            phone
        );


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Aucun compte trouvé avec ce numéro."

        };

    }


    const resetCode =
        generateCode(
            6
        );


    let resetRequests;


    try {

        resetRequests =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEYS.passwordResets
                )
            ) ||
            [];

    }

    catch (
        error
    ) {

        resetRequests =
            [];

    }


    resetRequests =
        resetRequests.filter(
            function (
                request
            ) {

                return request.userId !==
                    user.id;

            }
        );


    resetRequests.push(
        {

            userId:
                user.id,

            code:
                resetCode,

            expiresAt:
                Date.now() +
                (
                    30 *
                    60 *
                    1000
                )

        }
    );


    localStorage.setItem(
        STORAGE_KEYS.passwordResets,
        JSON.stringify(
            resetRequests
        )
    );


    return {

        success:
            true,

        message:
            "Demande enregistrée.",

        developmentCode:
            resetCode

    };

}


function resetPassword(
    phone,
    code,
    newPassword
) {

    const user =
        findUserByPhone(
            phone
        );


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Utilisateur introuvable."

        };

    }


    let resetRequests;


    try {

        resetRequests =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEYS.passwordResets
                )
            ) ||
            [];

    }

    catch (
        error
    ) {

        resetRequests =
            [];

    }


    const request =
        resetRequests.find(
            function (
                item
            ) {

                return item.userId ===
                    user.id;

            }
        );


    if (
        !request
    ) {

        return {

            success:
                false,

            message:
                "Aucune demande de réinitialisation active."

        };

    }


    if (
        Date.now() >
        request.expiresAt
    ) {

        return {

            success:
                false,

            message:
                "Le code a expiré."

        };

    }


    if (
        String(
            request.code
        ).toUpperCase() !==
        String(
            code
        ).trim()
            .toUpperCase()
    ) {

        return {

            success:
                false,

            message:
                "Code incorrect."

        };

    }


    if (
        String(
            newPassword
        ).length < 6
    ) {

        return {

            success:
                false,

            message:
                "Le mot de passe doit contenir au moins 6 caractères."

        };

    }


    user.password =
        newPassword;


    updateUser(
        user
    );


    resetRequests =
        resetRequests.filter(
            function (
                item
            ) {

                return item.userId !==
                    user.id;

            }
        );


    localStorage.setItem(
        STORAGE_KEYS.passwordResets,
        JSON.stringify(
            resetRequests
        )
    );


    return {

        success:
            true,

        message:
            "Votre mot de passe a été modifié."

    };

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function addNotification(
    user,
    title,
    message
) {

    if (
        !Array.isArray(
            user.notifications
        )
    ) {

        user.notifications =
            [];

    }


    user.notifications.unshift(
        {

            id:
                generateId(
                    "NOTIF"
                ),

            title:
                title,

            message:
                message,

            read:
                false,

            createdAt:
                new Date()
                    .toISOString()

        }
    );


}


/* =========================================================
   DEPOT
========================================================= */

function requestDeposit(
    amount,
    method,
    reference
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Veuillez vous connecter."

        };

    }


    const depositAmount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            depositAmount
        ) ||
        depositAmount <= 0
    ) {

        return {

            success:
                false,

            message:
                "Montant invalide."

        };

    }


    const transaction = {

        id:
            generateId(
                "DEP"
            ),

        type:
            "deposit",

        amount:
            depositAmount,

        method:
            method ||
            "Mobile Money",

        reference:
            reference ||
            generateCode(
                10
            ),

        status:
            "pending",

        createdAt:
            new Date()
                .toISOString()

    };


    if (
        !Array.isArray(
            user.transactions
        )
    ) {

        user.transactions =
            [];

    }


    user.transactions.unshift(
        transaction
    );


    addNotification(
        user,
        "Dépôt en attente",
        "Votre demande de dépôt est en cours de vérification."
    );


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Votre demande de dépôt a été envoyée.",

        transaction:
            transaction

    };

}


/* =========================================================
   RETRAIT
========================================================= */

function requestWithdrawal(
    amount,
    method,
    phone
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Veuillez vous connecter."

        };

    }


    const withdrawAmount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            withdrawAmount
        ) ||
        withdrawAmount <= 0
    ) {

        return {

            success:
                false,

            message:
                "Montant invalide."

        };

    }


    if (
        withdrawAmount >
        Number(
            user.balance ||
            0
        )
    ) {

        return {

            success:
                false,

            message:
                "Votre solde disponible est insuffisant."

        };

    }


    const transaction = {

        id:
            generateId(
                "WIT"
            ),

        type:
            "withdraw",

        amount:
            withdrawAmount,

        method:
            method ||
            "Mobile Money",

        phone:
            normalizePhone(
                phone ||
                user.phone
            ),

        status:
            "pending",

        createdAt:
            new Date()
                .toISOString()

    };


    if (
        !Array.isArray(
            user.transactions
        )
    ) {

        user.transactions =
            [];

    }


    user.transactions.unshift(
        transaction
    );


    addNotification(
        user,
        "Retrait en attente",
        "Votre demande de retrait est en cours d'examen."
    );


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Votre demande de retrait a été envoyée.",

        transaction:
            transaction

    };

}


/* =========================================================
   INVESTISSEMENT
========================================================= */

function investInPack(
    packId
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Veuillez vous connecter."

        };

    }


    const pack =
        INVESTMENT_PACKS.find(
            function (
                item
            ) {

                return item.id ===
                    packId;

            }
        );


    if (
        !pack
    ) {

        return {

            success:
                false,

            message:
                "Pack introuvable."

        };

    }


    if (
        Number(
            user.balance ||
            0
        ) <
        pack.amount
    ) {

        return {

            success:
                false,

            message:
                "Votre solde est insuffisant pour cet investissement."

        };

    }


    user.balance =
        Number(
            user.balance
        ) -
        pack.amount;


    user.totalInvested =
        Number(
            user.totalInvested ||
            0
        ) +
        pack.amount;


    const startDate =
        new Date();


    const endDate =
        new Date(
            startDate.getTime() +
            (
                pack.duration *
                24 *
                60 *
                60 *
                1000
            )
        );


    const investment = {

        id:
            generateId(
                "INV"
            ),

        packId:
            pack.id,

        packName:
            pack.name,

        amount:
            pack.amount,

        dailyIncome:
            pack.dailyIncome,

        duration:
            pack.duration,

        image:
            pack.image,

        status:
            "active",

        startDate:
            startDate.toISOString(),

        endDate:
            endDate.toISOString(),

        createdAt:
            new Date()
                .toISOString()

    };


    if (
        !Array.isArray(
            user.investments
        )
    ) {

        user.investments =
            [];

    }


    user.investments.unshift(
        investment
    );


    addNotification(
        user,
        "Investissement activé",
        "Votre investissement " +
        pack.name +
        " est maintenant actif."
    );


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Investissement activé avec succès.",

        investment:
            investment

    };

}


/* =========================================================
   ASSISTANCE
========================================================= */

function createTicket(
    subject,
    message
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return {

            success:
                false,

            message:
                "Veuillez vous connecter."

        };

    }


    const cleanSubject =
        String(
            subject ||
            ""
        )
            .trim();


    const cleanMessage =
        String(
            message ||
            ""
        )
            .trim();


    if (
        cleanSubject.length < 3 ||
        cleanMessage.length < 3
    ) {

        return {

            success:
                false,

            message:
                "Veuillez remplir correctement votre demande."

        };

    }


    const ticket = {

        id:
            generateId(
                "TICKET"
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
            new Date()
                .toISOString()

    };


    if (
        !Array.isArray(
            user.tickets
        )
    ) {

        user.tickets =
            [];

    }


    user.tickets.unshift(
        ticket
    );


    updateUser(
        user
    );


    return {

        success:
            true,

        message:
            "Votre demande a été envoyée.",

        ticket:
            ticket

    };

}


/* =========================================================
   ADMINISTRATION
========================================================= */


/* Authentification */

function authenticateAdmin(
    code
) {

    if (
        String(
            code
        ).trim() !==
        HYQD_CONFIG.adminCode
    ) {

        return {

            success:
                false,

            message:
                "Code administrateur incorrect."

        };

    }


    const session = {

        authenticated:
            true,

        createdAt:
            new Date()
                .toISOString()

    };


    localStorage.setItem(
        STORAGE_KEYS.adminSession,
        JSON.stringify(
            session
        )
    );


    return {

        success:
            true,

        message:
            "Accès administrateur autorisé."

    };

}


/* Vérifier admin */

function isAdminAuthenticated() {

    try {

        const session =
            JSON.parse(
                localStorage.getItem(
                    STORAGE_KEYS.adminSession
                )
            );


        return (
            session &&
            session.authenticated ===
            true
        );

    }

    catch (
        error
    ) {

        return false;

    }

}


/* Déconnexion admin */

function adminLogout() {

    localStorage.removeItem(
        STORAGE_KEYS.adminSession
    );

}


/* =========================================================
   TRAITEMENT TRANSACTION ADMIN
========================================================= */

function adminProcessTransaction(
    userId,
    transactionId,
    action
) {

    if (
        !isAdminAuthenticated()
    ) {

        return {

            success:
                false,

            message:
                "Accès administrateur refusé."

        };

    }


    const users =
        getUsers();


    const userIndex =
        users.findIndex(
            function (
                user
            ) {

                return user.id ===
                    userId;

            }
        );


    if (
        userIndex === -1
    ) {

        return {

            success:
                false,

            message:
                "Utilisateur introuvable."

        };

    }


    const user =
        users[
            userIndex
        ];


    const transaction =
        (
            user.transactions ||
            []
        ).find(
            function (
                item
            ) {

                return item.id ===
                    transactionId;

            }
        );


    if (
        !transaction
    ) {

        return {

            success:
                false,

            message:
                "Transaction introuvable."

        };

    }


    if (
        transaction.status !==
        "pending"
    ) {

        return {

            success:
                false,

            message:
                "Cette transaction a déjà été traitée."

        };

    }


    if (
        action !==
        "approved" &&
        action !==
        "rejected"
    ) {

        return {

            success:
                false,

            message:
                "Action invalide."

        };

    }


    transaction.status =
        action;


    transaction.processedAt =
        new Date()
            .toISOString();


    /* =====================================
       DEPOT
    ====================================== */

    if (
        transaction.type ===
        "deposit" &&
        action ===
        "approved"
    ) {


        user.balance =
            Number(
                user.balance ||
                0
            ) +
            Number(
                transaction.amount
            );


        user.totalDeposits =
            Number(
                user.totalDeposits ||
                0
            ) +
            Number(
                transaction.amount
            );


        /* =================================
           BONUS PARRAINAGE

           Seulement sur le premier dépôt.
        ================================== */

        if (
            user.firstDepositCompleted !==
            true
        ) {


            user.firstDepositCompleted =
                true;


            if (
                user.sponsorId
            ) {


                const sponsorIndex =
                    users.findIndex(
                        function (
                            item
                        ) {

                            return item.id ===
                                user.sponsorId;

                        }
                    );


                if (
                    sponsorIndex !==
                    -1
                ) {


                    const sponsor =
                        users[
                            sponsorIndex
                        ];


                    const bonus =
                        Number(
                            transaction.amount
                        ) *
                        HYQD_CONFIG
                            .referralBonus;


                    sponsor.balance =
                        Number(
                            sponsor.balance ||
                            0
                        ) +
                        bonus;


                    sponsor.totalReferralBonus =
                        Number(
                            sponsor.totalReferralBonus ||
                            0
                        ) +
                        bonus;


                    if (
                        !Array.isArray(
                            sponsor.transactions
                        )
                    ) {

                        sponsor.transactions =
                            [];

                    }


                    sponsor.transactions.unshift(
                        {

                            id:
                                generateId(
                                    "REF"
                                ),

                            type:
                                "referral_bonus",

                            amount:
                                bonus,

                            sourceUserId:
                                user.id,

                            sourceUserName:
                                user.name,

                            status:
                                "approved",

                            createdAt:
                                new Date()
                                    .toISOString()

                        }
                    );


                    addNotification(
                        sponsor,
                        "Bonus de parrainage",
                        "Vous avez reçu " +
                        formatFCFA(
                            bonus
                        ) +
                        " grâce au premier dépôt de votre filleul."
                    );


                    users[
                        sponsorIndex
                    ] =
                        sponsor;


                }


            }


        }


        addNotification(
            user,
            "Dépôt validé",
            "Votre dépôt de " +
            formatFCFA(
                transaction.amount
            ) +
            " a été validé."
        );


    }


    /* =====================================
       RETRAIT
    ====================================== */

    if (
        transaction.type ===
        "withdraw" &&
        action ===
        "approved"
    ) {


        const amount =
            Number(
                transaction.amount
            );


        if (
            Number(
                user.balance ||
                0
            ) <
            amount
        ) {


            transaction.status =
                "pending";


            return {

                success:
                    false,

                message:
                    "Solde utilisateur insuffisant."

            };

        }


        user.balance =
            Number(
                user.balance
            ) -
            amount;


        user.totalWithdrawals =
            Number(
                user.totalWithdrawals ||
                0
            ) +
            amount;


        addNotification(
            user,
            "Retrait validé",
            "Votre retrait de " +
            formatFCFA(
                amount
            ) +
            " a été validé."
        );


    }


    if (
        action ===
        "rejected"
    ) {


        addNotification(
            user,
            transaction.type ===
            "deposit"

                ? "Dépôt refusé"

                : "Retrait refusé",

            "Votre demande de transaction a été refusée."
        );


    }


    users[
        userIndex
    ] =
        user;


    saveUsers(
        users
    );


    const currentUser =
        getCurrentUser();


    if (
        currentUser &&
        currentUser.id ===
        user.id
    ) {

        setCurrentUser(
            user
        );

    }


    return {

        success:
            true,

        message:
            action ===
            "approved"

                ? "Transaction validée."

                : "Transaction refusée."

    };

}


/* =========================================================
   REPONSE ADMIN TICKET
========================================================= */

function adminReplyToTicket(
    userId,
    ticketId,
    reply
) {

    if (
        !isAdminAuthenticated()
    ) {

        return {

            success:
                false,

            message:
                "Accès administrateur refusé."

        };

    }


    const users =
        getUsers();


    const userIndex =
        users.findIndex(
            function (
                user
            ) {

                return user.id ===
                    userId;

            }
        );


    if (
        userIndex === -1
    ) {

        return {

            success:
                false,

            message:
                "Utilisateur introuvable."

        };

    }


    const user =
        users[
            userIndex
        ];


    const ticket =
        (
            user.tickets ||
            []
        ).find(
            function (
                item
            ) {

                return item.id ===
                    ticketId;

            }
        );


    if (
        !ticket
    ) {

        return {

            success:
                false,

            message:
                "Ticket introuvable."

        };

    }


    ticket.adminReply =
        String(
            reply
        ).trim();


    ticket.status =
        "answered";


    ticket.answeredAt =
        new Date()
            .toISOString();


    addNotification(
        user,
        "Réponse de l'assistance",
        "L'administration a répondu à votre demande : " +
        ticket.subject
    );


    users[
        userIndex
    ] =
        user;


    saveUsers(
        users
    );


    const currentUser =
        getCurrentUser();


    if (
        currentUser &&
        currentUser.id ===
        user.id
    ) {

        setCurrentUser(
            user
        );

    }


    return {

        success:
            true,

        message:
            "Réponse envoyée avec succès."

    };

}


/* =========================================================
   SECURISATION DES PAGES
========================================================= */

function protectDashboardPage() {

    const currentPage =
        window.location
            .pathname
            .split(
                "/"
            )
            .pop()
            .toLowerCase();


    const protectedPages = [

        "dashboard.html"

    ];


    if (
        protectedPages.includes(
            currentPage
        )
    ) {


        if (
            !isLoggedIn()
        ) {


            window.location.href =
                "login.html";


        }


    }


}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        protectDashboardPage();


    }
);
