"use strict";

/* ============================================================
   HOUSING'S YQD
   SUPABASE.JS
   VERSION SECURISEE
   ============================================================ */


/* ============================================================
   1. CONFIGURATION
============================================================ */

const HYQD_SUPABASE_CONFIG = Object.freeze({

    URL:
        "https://qcvagkialoztluqxpmcq.supabase.co",

    PUBLISHABLE_KEY:
        "sb_publishable_J_fhucIX6-Fdals6lVQvvA_yCmUkwVy",

    APP_NAME:
        "Housing's YQD",

    HOME_PAGE:
        "index.html",

    LOGIN_PAGE:
        "login.html",

    REGISTER_PAGE:
        "register.html",

    DASHBOARD_PAGE:
        "dashboard.html",

    ADMIN_PAGE:
        "admin.html"

});


let HYQD_SUPABASE_CLIENT = null;


/* ============================================================
   2. OUTILS
============================================================ */

function hyqdCleanText(value) {

    return String(
        value ?? ""
    )
        .trim();

}


function hyqdNormalizeEmail(value) {

    return hyqdCleanText(
        value
    ).toLowerCase();

}


function hyqdNormalizePhone(value) {

    let phone =
        hyqdCleanText(
            value
        )
            .replace(
                /\s+/g,
                ""
            );


    if (
        phone &&
        !phone.startsWith("+")
    ) {

        phone =
            "+225" +
            phone.replace(
                /^0+/,
                ""
            );

    }


    return phone;

}


function hyqdSafeMessage(
    error,
    fallback =
        "Une erreur est survenue."
) {

    if (!error) {

        return fallback;

    }


    const message =
        error.message ||
        error.error_description ||
        error.details ||
        error.hint ||
        fallback;


    const lower =
        String(
            message
        ).toLowerCase();


    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "Adresse email ou mot de passe incorrect.";

    }


    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "Votre adresse email n'a pas encore été confirmée.";

    }


    if (
        lower.includes(
            "user already registered"
        )
    ) {

        return "Un compte existe déjà avec cette adresse email.";

    }


    if (
        lower.includes(
            "rate limit"
        )
    ) {

        return "Trop de tentatives. Veuillez réessayer plus tard.";

    }


    return String(
        message
    );

}


function hyqdFormatNumber(
    value
) {

    const number =
        Number(
            value || 0
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* ============================================================
   3. INITIALISATION SUPABASE
============================================================ */

function initializeHousingSupabase() {

    if (
        HYQD_SUPABASE_CLIENT
    ) {

        return HYQD_SUPABASE_CLIENT;

    }


    const url =
        hyqdCleanText(
            HYQD_SUPABASE_CONFIG.URL
        );


    const key =
        hyqdCleanText(
            HYQD_SUPABASE_CONFIG.PUBLISHABLE_KEY
        );


    if (
        !url ||
        !key
    ) {

        throw new Error(
            "Configuration Supabase incomplète."
        );

    }


    if (
        key.includes(
            "service_role"
        ) ||
        key.startsWith(
            "sb_secret_"
        )
    ) {

        throw new Error(
            "Une clé secrète Supabase ne doit jamais être utilisée dans le navigateur."
        );

    }


    if (
        typeof window.supabase ===
        "undefined"
    ) {

        throw new Error(
            "La bibliothèque Supabase n'est pas chargée."
        );

    }


    if (
        typeof window.supabase.createClient !==
        "function"
    ) {

        throw new Error(
            "Supabase createClient est indisponible."
        );

    }


    HYQD_SUPABASE_CLIENT =
        window.supabase.createClient(
            url,
            key,
            {

                auth: {

                    persistSession:
                        true,

                    autoRefreshToken:
                        true,

                    detectSessionInUrl:
                        true

                }

            }
        );


    window.HYQD_SUPABASE_CLIENT =
        HYQD_SUPABASE_CLIENT;


    window.hyqdSupabase =
        HYQD_SUPABASE_CLIENT;


    window.housingSupabase =
        HYQD_SUPABASE_CLIENT;


    return HYQD_SUPABASE_CLIENT;

}


/* ============================================================
   4. CLIENT
============================================================ */

function getHousingSupabaseClient() {

    return initializeHousingSupabase();

}


/* ============================================================
   5. SESSION
============================================================ */

async function getSupabaseSession() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            session:
                data?.session ||
                null,

            user:
                data?.session?.user ||
                null

        };


    } catch (error) {

        console.error(
            "getSupabaseSession:",
            error
        );


        return {

            success:
                false,

            session:
                null,

            user:
                null,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de vérifier la session."
                )

        };

    }

}


/* ============================================================
   6. UTILISATEUR AUTH
============================================================ */

async function getSupabaseUser() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            user:
                data?.user ||
                null

        };


    } catch (error) {

        return {

            success:
                false,

            user:
                null,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de récupérer l'utilisateur."
                )

        };

    }

}


/* ============================================================
   7. INSCRIPTION
============================================================ */

async function registerSupabaseUser({

    fullName,
    email,
    phone,
    password,
    referralCode

}) {

    try {

        const client =
            initializeHousingSupabase();


        const cleanName =
            hyqdCleanText(
                fullName
            );


        const cleanEmail =
            hyqdNormalizeEmail(
                email
            );


        const cleanPhone =
            hyqdNormalizePhone(
                phone
            );


        const cleanReferral =
            hyqdCleanText(
                referralCode
            ).toUpperCase();


        if (
            cleanName.length < 2
        ) {

            throw new Error(
                "Veuillez saisir votre nom complet."
            );

        }


        if (!cleanEmail) {

            throw new Error(
                "Veuillez saisir votre adresse email."
            );

        }


        if (
            !password ||
            password.length < 6
        ) {

            throw new Error(
                "Le mot de passe doit contenir au moins 6 caractères."
            );

        }


        const {
            data,
            error
        } =
            await client.auth.signUp({

                email:
                    cleanEmail,

                password,

                options: {

                    data: {

                        full_name:
                            cleanName,

                        phone:
                            cleanPhone,

                        referral_code_entered:
                            cleanReferral || null

                    }

                }

            });


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            user:
                data?.user ||
                null,

            session:
                data?.session ||
                null,

            requiresEmailConfirmation:
                !data?.session,

            message:
                data?.session
                    ? "Compte créé avec succès."
                    : "Compte créé. Vérifiez votre adresse email."

        };


    } catch (error) {

        console.error(
            "registerSupabaseUser:",
            error
        );


        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de créer le compte."
                )

        };

    }

}


/* ============================================================
   8. CONNEXION
============================================================ */

async function loginSupabaseUser(
    email,
    password
) {

    try {

        const client =
            initializeHousingSupabase();


        const cleanEmail =
            hyqdNormalizeEmail(
                email
            );


        if (
            !cleanEmail ||
            !password
        ) {

            throw new Error(
                "Veuillez saisir votre email et votre mot de passe."
            );

        }


        const {
            data,
            error
        } =
            await client.auth.signInWithPassword({

                email:
                    cleanEmail,

                password

            });


        if (error) {

            throw error;

        }


        if (
            !data?.session ||
            !data?.user
        ) {

            throw new Error(
                "La connexion n'a pas pu être établie."
            );

        }


        return {

            success:
                true,

            session:
                data.session,

            user:
                data.user,

            message:
                "Connexion réussie."

        };


    } catch (error) {

        console.error(
            "loginSupabaseUser:",
            error
        );


        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de vous connecter."
                )

        };

    }

}


/* ============================================================
   9. DECONNEXION
============================================================ */

async function logoutSupabaseUser() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            error
        } =
            await client.auth.signOut();


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            message:
                "Déconnexion réussie."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de vous déconnecter."
                )

        };

    }

}


/* ============================================================
   10. PROFIL
============================================================ */

async function getSupabaseProfile(
    userId = null
) {

    try {

        const client =
            initializeHousingSupabase();


        let targetUserId =
            userId;


        if (!targetUserId) {

            const authResult =
                await getSupabaseUser();


            targetUserId =
                authResult?.user?.id;

        }


        if (!targetUserId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "profiles"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    targetUserId
                )
                .single();


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            profile:
                data,

            data

        };


    } catch (error) {

        return {

            success:
                false,

            profile:
                null,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de récupérer votre profil."
                )

        };

    }

}


/* ============================================================
   11. MODIFIER PROFIL VIA RPC
============================================================ */

async function updateSupabaseProfile({

    fullName,
    phone

}) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "update_my_profile",
                {

                    p_full_name:
                        hyqdCleanText(
                            fullName
                        ),

                    p_phone:
                        hyqdNormalizePhone(
                            phone
                        )

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            message:
                data?.message ||
                "Profil mis à jour."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible de modifier votre profil."
                )

        };

    }

}


/* ============================================================
   12. ROLE
============================================================ */

async function getSupabaseCurrentUserRole() {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "user_roles"
                )
                .select(
                    "role"
                )
                .eq(
                    "user_id",
                    userId
                )
                .single();


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            role:
                data?.role ||
                "user"

        };


    } catch (error) {

        return {

            success:
                false,

            role:
                null,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   13. PROTECTION PAGE AUTHENTIFIEE
============================================================ */

async function requireSupabaseAuth() {

    const sessionResult =
        await getSupabaseSession();


    if (
        !sessionResult.success ||
        !sessionResult.session ||
        !sessionResult.user
    ) {

        return {

            success:
                false,

            authenticated:
                false,

            session:
                null,

            user:
                null

        };

    }


    return {

        success:
            true,

        authenticated:
            true,

        session:
            sessionResult.session,

        user:
            sessionResult.user

    };

}


/* ============================================================
   14. PROTECTION ADMIN
============================================================ */

async function requireSupabaseAdmin() {

    const authResult =
        await requireSupabaseAuth();


    if (!authResult.success) {

        return {

            success:
                false,

            authorized:
                false,

            reason:
                "not_authenticated"

        };

    }


    const roleResult =
        await getSupabaseCurrentUserRole();


    const role =
        roleResult?.role;


    const authorized =
        role === "admin" ||
        role === "super_admin";


    return {

        success:
            authorized,

        authorized,

        role,

        user:
            authResult.user,

        session:
            authResult.session,

        reason:
            authorized
                ? null
                : "not_admin"

    };

}


/* ============================================================
   15. RESET MOT DE PASSE
============================================================ */

async function requestSupabasePasswordReset(
    email
) {

    try {

        const client =
            initializeHousingSupabase();


        const redirectUrl =
            new URL(
                "forgot-password.html",
                window.location.href
            ).href;


        const {
            error
        } =
            await client.auth.resetPasswordForEmail(
                hyqdNormalizeEmail(
                    email
                ),
                {

                    redirectTo:
                        redirectUrl

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            message:
                "Un email de réinitialisation vous a été envoyé."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   16. CHANGER MOT DE PASSE
============================================================ */

async function updateSupabasePassword(
    newPassword
) {

    try {

        if (
            !newPassword ||
            newPassword.length < 6
        ) {

            throw new Error(
                "Le nouveau mot de passe doit contenir au moins 6 caractères."
            );

        }


        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.auth.updateUser({

                password:
                    newPassword

            });


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            user:
                data?.user,

            message:
                "Mot de passe modifié avec succès."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   17. PACKS
============================================================ */

async function getSupabaseInvestmentPacks() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "investment_packs"
                )
                .select(
                    "*"
                )
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "sort_order",
                    {

                        ascending:
                            true

                    }
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            packs:
                data || [],

            data:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            packs:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   18. DEPOT SECURISE
============================================================ */

async function requestSupabaseDeposit({

    amount,
    method,
    reference = ""

}) {

    try {

        const client =
            initializeHousingSupabase();


        const cleanAmount =
            hyqdFormatNumber(
                amount
            );


        if (
            cleanAmount < 1000
        ) {

            throw new Error(
                "Le dépôt minimum est de 1 000 FCFA."
            );

        }


        const {
            data,
            error
        } =
            await client.rpc(
                "request_deposit",
                {

                    p_amount:
                        cleanAmount,

                    p_method:
                        hyqdCleanText(
                            method
                        ),

                    p_reference:
                        hyqdCleanText(
                            reference
                        ) || null

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            deposit:
                data,

            message:
                data?.message ||
                "Demande de dépôt enregistrée."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible d'enregistrer le dépôt."
                )

        };

    }

}


/* ============================================================
   19. RETRAIT SECURISE
============================================================ */

async function requestSupabaseWithdrawal({

    amount,
    method,
    destinationPhone

}) {

    try {

        const client =
            initializeHousingSupabase();


        const cleanAmount =
            hyqdFormatNumber(
                amount
            );


        if (
            cleanAmount < 1000
        ) {

            throw new Error(
                "Le retrait minimum est de 1 000 FCFA."
            );

        }


        const {
            data,
            error
        } =
            await client.rpc(
                "request_withdrawal",
                {

                    p_amount:
                        cleanAmount,

                    p_method:
                        hyqdCleanText(
                            method
                        ),

                    p_destination_phone:
                        hyqdNormalizePhone(
                            destinationPhone
                        )

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            withdrawal:
                data,

            message:
                data?.message ||
                "Demande de retrait enregistrée."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible d'enregistrer le retrait."
                )

        };

    }

}


/* ============================================================
   20. INVESTIR
============================================================ */

async function investSupabasePack(
    packId
) {

    try {

        const client =
            initializeHousingSupabase();


        const cleanPackId =
            hyqdCleanText(
                packId
            );


        if (!cleanPackId) {

            throw new Error(
                "Pack invalide."
            );

        }


        const {
            data,
            error
        } =
            await client.rpc(
                "invest_in_pack",
                {

                    p_pack_id:
                        cleanPackId

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            investment:
                data,

            message:
                data?.message ||
                "Investissement activé."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible d'effectuer cet investissement."
                )

        };

    }

}


/* ============================================================
   21. MES DEPOTS
============================================================ */

async function getSupabaseDeposits(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "deposits"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            deposits:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            deposits:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   22. MES RETRAITS
============================================================ */

async function getSupabaseWithdrawals(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "withdrawals"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            withdrawals:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            withdrawals:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   23. MES INVESTISSEMENTS
============================================================ */

async function getSupabaseInvestments(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "investments"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            investments:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            investments:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   24. BONUS DE PARRAINAGE
============================================================ */

async function getSupabaseReferralRewards(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "referral_rewards"
                )
                .select(
                    "*"
                )
                .eq(
                    "sponsor_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            rewards:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            rewards:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   25. CREER TICKET ASSISTANCE
============================================================ */

async function createSupabaseSupportTicket({

    subject,
    message

}) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "create_support_ticket",
                {

                    p_subject:
                        hyqdCleanText(
                            subject
                        ),

                    p_message:
                        hyqdCleanText(
                            message
                        )

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            message:
                data?.message ||
                "Votre demande a été envoyée."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Impossible d'envoyer votre demande."
                )

        };

    }

}


/* ============================================================
   26. MES TICKETS
============================================================ */

async function getSupabaseSupportTickets(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "support_tickets"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            tickets:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            tickets:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   27. NOTIFICATIONS
============================================================ */

async function getSupabaseNotifications(
    limit = 100
) {

    try {

        const client =
            initializeHousingSupabase();


        const userResult =
            await getSupabaseUser();


        const userId =
            userResult?.user?.id;


        if (!userId) {

            throw new Error(
                "Utilisateur non authentifié."
            );

        }


        const {
            data,
            error
        } =
            await client
                .from(
                    "notifications"
                )
                .select(
                    "*"
                )
                .eq(
                    "user_id",
                    userId
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            notifications:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            notifications:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   28. NOTIFICATION LUE
============================================================ */

async function markSupabaseNotificationRead(
    notificationId
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "mark_notification_read",
                {

                    p_notification_id:
                        notificationId

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   29. TOUT LIRE
============================================================ */

async function markAllSupabaseNotificationsRead() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "mark_all_notifications_read"
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   30. TICKER DEPOTS VALIDES
============================================================ */

async function getApprovedDepositTicker(
    limit = 20
) {

    try {

        const client =
            initializeHousingSupabase();


        const safeLimit =
            Math.min(
                Math.max(
                    Number(
                        limit
                    ) || 20,
                    1
                ),
                50
            );


        const {
            data,
            error
        } =
            await client.rpc(
                "get_approved_deposit_ticker",
                {

                    p_limit:
                        safeLimit

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            deposits:
                data || [],

            ticker:
                data || []

        };


    } catch (error) {

        console.warn(
            "getApprovedDepositTicker:",
            error
        );


        return {

            success:
                false,

            deposits:
                [],

            ticker:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   31. VALIDATION DEPOT ADMIN
============================================================ */

async function adminReviewSupabaseDeposit({

    depositId,
    approve,
    note = ""

}) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "admin_review_deposit",
                {

                    p_deposit_id:
                        depositId,

                    p_approve:
                        Boolean(
                            approve
                        ),

                    p_note:
                        hyqdCleanText(
                            note
                        ) || null

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            message:
                data?.message ||
                "Dépôt traité."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   32. VALIDATION RETRAIT ADMIN
============================================================ */

async function adminReviewSupabaseWithdrawal({

    withdrawalId,
    approve,
    note = ""

}) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "admin_review_withdrawal",
                {

                    p_withdrawal_id:
                        withdrawalId,

                    p_approve:
                        Boolean(
                            approve
                        ),

                    p_note:
                        hyqdCleanText(
                            note
                        ) || null

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            message:
                data?.message ||
                "Retrait traité."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   33. REPONSE ASSISTANCE ADMIN
============================================================ */

async function adminReplySupabaseSupportTicket({

    ticketId,
    reply,
    close = false

}) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client.rpc(
                "admin_reply_support_ticket",
                {

                    p_ticket_id:
                        ticketId,

                    p_reply:
                        hyqdCleanText(
                            reply
                        ),

                    p_close:
                        Boolean(
                            close
                        )

                }
            );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            data,

            message:
                data?.message ||
                "Réponse enregistrée."

        };


    } catch (error) {

        return {

            success:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   34. ADMIN : PROFILS
============================================================ */

async function adminGetSupabaseProfiles(
    limit = 500
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "profiles"
                )
                .select(
                    "*"
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            profiles:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            profiles:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   35. ADMIN : DEPOTS
============================================================ */

async function adminGetSupabaseDeposits(
    limit = 500
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "deposits"
                )
                .select(
                    `
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        phone,
                        referral_code
                    )
                    `
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            deposits:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            deposits:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   36. ADMIN : RETRAITS
============================================================ */

async function adminGetSupabaseWithdrawals(
    limit = 500
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "withdrawals"
                )
                .select(
                    `
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        phone
                    )
                    `
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            withdrawals:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            withdrawals:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   37. ADMIN : INVESTISSEMENTS
============================================================ */

async function adminGetSupabaseInvestments(
    limit = 500
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "investments"
                )
                .select(
                    `
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        phone
                    )
                    `
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            investments:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            investments:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   38. ADMIN : ASSISTANCE
============================================================ */

async function adminGetSupabaseSupportTickets(
    limit = 500
) {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "support_tickets"
                )
                .select(
                    `
                    *,
                    profiles:user_id (
                        id,
                        full_name,
                        phone
                    )
                    `
                )
                .order(
                    "created_at",
                    {

                        ascending:
                            false

                    }
                )
                .limit(
                    limit
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            tickets:
                data || []

        };


    } catch (error) {

        return {

            success:
                false,

            tickets:
                [],

            error,

            message:
                hyqdSafeMessage(
                    error
                )

        };

    }

}


/* ============================================================
   39. AUTH STATE
============================================================ */

function onHousingAuthStateChange(
    callback
) {

    const client =
        initializeHousingSupabase();


    const {
        data
    } =
        client.auth.onAuthStateChange(

            (
                event,
                session
            ) => {

                if (
                    typeof callback ===
                    "function"
                ) {

                    callback(
                        event,
                        session
                    );

                }

            }

        );


    return data?.subscription ||
        null;

}


/* ============================================================
   40. TEST CONNEXION
============================================================ */

async function testHousingSupabaseConnection() {

    try {

        const client =
            initializeHousingSupabase();


        const {
            data,
            error
        } =
            await client
                .from(
                    "investment_packs"
                )
                .select(
                    "id"
                )
                .limit(
                    1
                );


        if (error) {

            throw error;

        }


        return {

            success:
                true,

            connected:
                true,

            data

        };


    } catch (error) {

        return {

            success:
                false,

            connected:
                false,

            error,

            message:
                hyqdSafeMessage(
                    error,
                    "Connexion Supabase impossible."
                )

        };

    }

}


/* ============================================================
   41. EXPOSITION DES FONCTIONS
============================================================ */

window.HYQD_SUPABASE_CONFIG =
    HYQD_SUPABASE_CONFIG;


window.initializeHousingSupabase =
    initializeHousingSupabase;


window.getHousingSupabaseClient =
    getHousingSupabaseClient;


window.getSupabaseSession =
    getSupabaseSession;


window.getSupabaseUser =
    getSupabaseUser;


window.registerSupabaseUser =
    registerSupabaseUser;


window.loginSupabaseUser =
    loginSupabaseUser;


window.logoutSupabaseUser =
    logoutSupabaseUser;


window.getSupabaseProfile =
    getSupabaseProfile;


window.updateSupabaseProfile =
    updateSupabaseProfile;


window.getSupabaseCurrentUserRole =
    getSupabaseCurrentUserRole;


window.requireSupabaseAuth =
    requireSupabaseAuth;


window.requireSupabaseAdmin =
    requireSupabaseAdmin;


window.requestSupabasePasswordReset =
    requestSupabasePasswordReset;


window.updateSupabasePassword =
    updateSupabasePassword;


window.getSupabaseInvestmentPacks =
    getSupabaseInvestmentPacks;


window.requestSupabaseDeposit =
    requestSupabaseDeposit;


window.requestSupabaseWithdrawal =
    requestSupabaseWithdrawal;


window.investSupabasePack =
    investSupabasePack;


window.getSupabaseDeposits =
    getSupabaseDeposits;


window.getSupabaseWithdrawals =
    getSupabaseWithdrawals;


window.getSupabaseInvestments =
    getSupabaseInvestments;


window.getSupabaseReferralRewards =
    getSupabaseReferralRewards;


window.createSupabaseSupportTicket =
    createSupabaseSupportTicket;


window.getSupabaseSupportTickets =
    getSupabaseSupportTickets;


window.getSupabaseNotifications =
    getSupabaseNotifications;


window.markSupabaseNotificationRead =
    markSupabaseNotificationRead;


window.markAllSupabaseNotificationsRead =
    markAllSupabaseNotificationsRead;


window.getApprovedDepositTicker =
    getApprovedDepositTicker;


window.adminReviewSupabaseDeposit =
    adminReviewSupabaseDeposit;


window.adminReviewSupabaseWithdrawal =
    adminReviewSupabaseWithdrawal;


window.adminReplySupabaseSupportTicket =
    adminReplySupabaseSupportTicket;


window.adminGetSupabaseProfiles =
    adminGetSupabaseProfiles;


window.adminGetSupabaseDeposits =
    adminGetSupabaseDeposits;


window.adminGetSupabaseWithdrawals =
    adminGetSupabaseWithdrawals;


window.adminGetSupabaseInvestments =
    adminGetSupabaseInvestments;


window.adminGetSupabaseSupportTickets =
    adminGetSupabaseSupportTickets;


window.onHousingAuthStateChange =
    onHousingAuthStateChange;


window.testHousingSupabaseConnection =
    testHousingSupabaseConnection;


/* ============================================================
   42. INITIALISATION AUTOMATIQUE
============================================================ */

try {

    initializeHousingSupabase();

    console.info(
        "Housing's YQD : Supabase initialisé."
    );

} catch (error) {

    console.error(
        "Housing's YQD : erreur Supabase.",
        error
    );

}
