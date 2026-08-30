"use strict";

/* ============================================================
   HOUSING'S YQD
   SUPABASE CLIENT - V1
   ============================================================

   Ce fichier contient UNIQUEMENT la connexion publique
   à Supabase et les fonctions d'authentification/profil.

   IMPORTANT :
   - SUPABASE_URL : autorisé côté navigateur
   - PUBLISHABLE KEY : autorisée côté navigateur
   - SERVICE_ROLE / SECRET KEY : INTERDITES ici
   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const HYQD_SUPABASE_CONFIG = Object.freeze({

    /*
     * Exemple :
     * https://abcdefghijk.supabase.co
     */
    URL: "VOTRE_URL_SUPABASE_ICI",

    /*
     * Utiliser UNIQUEMENT la Publishable Key.
     *
     * Elle commence généralement par :
     * sb_publishable_...
     *
     * Ne jamais mettre ici :
     * - service_role
     * - sb_secret_
     * - mot de passe PostgreSQL
     */
    PUBLISHABLE_KEY: "VOTRE_CLE_PUBLISHABLE_ICI",

    APP_NAME: "Housing's YQD",

    LOGIN_PAGE: "login.html",

    REGISTER_PAGE: "register.html",

    DASHBOARD_PAGE: "dashboard.html",

    HOME_PAGE: "index.html"

});


/* ============================================================
   2. VERIFICATIONS INITIALES
   ============================================================ */

function hyqdSupabaseConfigurationIsValid() {

    const url =
        String(
            HYQD_SUPABASE_CONFIG.URL || ""
        ).trim();

    const key =
        String(
            HYQD_SUPABASE_CONFIG.PUBLISHABLE_KEY || ""
        ).trim();


    if (
        !url ||
        url === "VOTRE_URL_SUPABASE_ICI"
    ) {

        console.error(
            "[Housing's YQD] URL Supabase non configurée."
        );

        return false;
    }


    if (
        !key ||
        key === "VOTRE_CLE_PUBLISHABLE_ICI"
    ) {

        console.error(
            "[Housing's YQD] Publishable Key Supabase non configurée."
        );

        return false;
    }


    if (
        key.includes("service_role") ||
        key.startsWith("sb_secret_")
    ) {

        console.error(
            "[Housing's YQD] ERREUR DE SECURITE : une clé secrète ne doit jamais être placée dans supabase.js."
        );

        return false;
    }


    return true;
}


/* ============================================================
   3. CLIENT SUPABASE
   ============================================================ */

let hyqdSupabase = null;


function initializeHousingSupabase() {

    if (hyqdSupabase) {

        return hyqdSupabase;
    }


    if (!hyqdSupabaseConfigurationIsValid()) {

        return null;
    }


    if (
        typeof window === "undefined" ||
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "[Housing's YQD] La bibliothèque Supabase JS n'est pas chargée."
        );

        return null;
    }


    try {

        hyqdSupabase =
            window.supabase.createClient(

                HYQD_SUPABASE_CONFIG.URL,

                HYQD_SUPABASE_CONFIG.PUBLISHABLE_KEY,

                {

                    db: {

                        schema: "public"

                    },

                    auth: {

                        autoRefreshToken: true,

                        persistSession: true,

                        detectSessionInUrl: true

                    }

                }

            );


        console.info(
            "[Housing's YQD] Client Supabase initialisé."
        );


        return hyqdSupabase;

    } catch (error) {

        console.error(
            "[Housing's YQD] Impossible d'initialiser Supabase :",
            error
        );

        return null;
    }
}


initializeHousingSupabase();


/* ============================================================
   4. OUTILS
   ============================================================ */

function hyqdCleanText(value) {

    return String(
        value ?? ""
    )
        .trim()
        .replace(/\s+/g, " ");
}


function hyqdNormalizeEmail(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
}


function hyqdNormalizePhone(value) {

    let phone =
        String(
            value ?? ""
        )
            .trim()
            .replace(/[^\d+]/g, "");


    if (!phone) {

        return "";
    }


    if (phone.startsWith("00225")) {

        phone =
            "+225" +
            phone.substring(5);
    }


    if (
        phone.startsWith("225") &&
        !phone.startsWith("+")
    ) {

        phone =
            "+" +
            phone;
    }


    if (
        !phone.startsWith("+225") &&
        /^\d{10}$/.test(phone)
    ) {

        phone =
            "+225" +
            phone;
    }


    return phone;
}


function hyqdGenerateFallbackReferralCode(
    userId = ""
) {

    const base =
        String(userId || "")
            .replace(/-/g, "")
            .substring(0, 8)
            .toUpperCase();


    return (
        base ||
        Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()
    );
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
        String(
            error.message ||
            error.error_description ||
            error.msg ||
            ""
        ).trim();


    return (
        message ||
        fallback
    );
}


/* ============================================================
   5. SESSION
   ============================================================ */

async function getSupabaseSession() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            session: null,
            message:
                "Supabase n'est pas configuré."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client.auth.getSession();


        if (error) {

            return {
                success: false,
                session: null,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de lire la session."
                    )
            };
        }


        return {
            success: true,
            session:
                data?.session || null
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            session: null,
            message:
                "Impossible de vérifier la session."
        };
    }
}


async function getSupabaseUser() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            user: null,
            message:
                "Supabase n'est pas configuré."
        };
    }


    try {

        /*
         * getUser() valide réellement
         * l'utilisateur auprès de Supabase Auth.
         */

        const {
            data,
            error
        } =
            await client.auth.getUser();


        if (error) {

            return {
                success: false,
                user: null,
                message:
                    hyqdSafeMessage(
                        error,
                        "Session utilisateur invalide."
                    )
            };
        }


        return {
            success: true,
            user:
                data?.user || null
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            user: null,
            message:
                "Impossible de récupérer l'utilisateur."
        };
    }
}


/* ============================================================
   6. INSCRIPTION
   ============================================================ */

async function registerSupabaseUser({
    fullName,
    email,
    phone,
    password,
    referralCode = ""
} = {}) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "La connexion Supabase n'est pas configurée."
        };
    }


    fullName =
        hyqdCleanText(fullName);

    email =
        hyqdNormalizeEmail(email);

    phone =
        hyqdNormalizePhone(phone);

    password =
        String(password || "");

    referralCode =
        String(referralCode || "")
            .trim()
            .toUpperCase();


    if (
        fullName.length < 2
    ) {

        return {
            success: false,
            message:
                "Veuillez saisir votre nom complet."
        };
    }


    if (
        !email ||
        !email.includes("@")
    ) {

        return {
            success: false,
            message:
                "Veuillez saisir une adresse email valide."
        };
    }


    if (
        !phone ||
        !phone.startsWith("+225")
    ) {

        return {
            success: false,
            message:
                "Veuillez saisir un numéro ivoirien valide précédé de +225."
        };
    }


    if (
        password.length < 8
    ) {

        return {
            success: false,
            message:
                "Le mot de passe doit contenir au moins 8 caractères."
        };
    }


    try {

        /*
         * Si un code de parrainage est fourni,
         * on vérifie qu'il existe AVANT l'inscription.
         *
         * ATTENTION :
         * avec les policies actuelles, la recherche publique
         * de profils n'est volontairement pas autorisée.
         *
         * Nous traiterons donc définitivement le parrainage
         * côté serveur dans l'étape suivante.
         */


        const {
            data,
            error
        } =
            await client.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        full_name:
                            fullName,

                        phone,

                        referral_code_entered:
                            referralCode || null

                    }

                }

            });


        if (error) {

            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Inscription impossible."
                    )
            };
        }


        const user =
            data?.user || null;

        const session =
            data?.session || null;


        if (!user) {

            return {
                success: false,
                message:
                    "Le compte n'a pas pu être créé."
            };
        }


        /*
         * Le trigger SQL handle_new_user()
         * crée automatiquement :
         *
         * - profiles
         * - user_roles
         * - referral_code
         */


        return {

            success: true,

            user,

            session,

            emailConfirmationRequired:
                !session,

            message:
                session
                    ?
                    "Compte créé avec succès."
                    :
                    "Compte créé. Consultez votre email pour confirmer votre inscription."

        };

    } catch (error) {

        console.error(
            "[Housing's YQD] Erreur inscription :",
            error
        );


        return {
            success: false,
            message:
                "Impossible de créer le compte pour le moment."
        };
    }
}


/* ============================================================
   7. CONNEXION
   ============================================================ */

async function loginSupabaseUser(
    email,
    password
) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "La connexion Supabase n'est pas configurée."
        };
    }


    email =
        hyqdNormalizeEmail(email);

    password =
        String(password || "");


    if (!email) {

        return {
            success: false,
            message:
                "Veuillez saisir votre adresse email."
        };
    }


    if (!password) {

        return {
            success: false,
            message:
                "Veuillez saisir votre mot de passe."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client.auth.signInWithPassword({

                email,

                password

            });


        if (error) {

            let message =
                hyqdSafeMessage(
                    error,
                    "Connexion impossible."
                );


            const lower =
                message.toLowerCase();


            if (
                lower.includes(
                    "invalid login credentials"
                )
            ) {

                message =
                    "Email ou mot de passe incorrect.";
            }


            if (
                lower.includes(
                    "email not confirmed"
                )
            ) {

                message =
                    "Veuillez confirmer votre adresse email avant de vous connecter.";
            }


            return {
                success: false,
                message
            };
        }


        if (
            !data?.user ||
            !data?.session
        ) {

            return {
                success: false,
                message:
                    "La session n'a pas pu être créée."
            };
        }


        /*
         * Vérification supplémentaire :
         * profil encore actif ?
         */

        const profileResult =
            await getSupabaseProfile(
                data.user.id
            );


        if (
            profileResult.success &&
            profileResult.profile &&
            profileResult.profile.is_active === false
        ) {

            await client.auth.signOut();


            return {
                success: false,
                message:
                    "Ce compte est désactivé. Contactez l'assistance."
            };
        }


        return {

            success: true,

            user:
                data.user,

            session:
                data.session,

            profile:
                profileResult.profile || null,

            message:
                "Connexion réussie."

        };

    } catch (error) {

        console.error(
            "[Housing's YQD] Erreur connexion :",
            error
        );


        return {
            success: false,
            message:
                "Impossible de vous connecter pour le moment."
        };
    }
}


/* ============================================================
   8. DECONNEXION
   ============================================================ */

async function logoutSupabaseUser() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Supabase n'est pas configuré."
        };
    }


    try {

        const {
            error
        } =
            await client.auth.signOut();


        if (error) {

            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Déconnexion impossible."
                    )
            };
        }


        return {
            success: true,
            message:
                "Déconnexion réussie."
        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            message:
                "Une erreur est survenue pendant la déconnexion."
        };
    }
}


/* ============================================================
   9. PROFIL
   ============================================================ */

async function getSupabaseProfile(
    userId = null
) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            profile: null,
            message:
                "Supabase n'est pas configuré."
        };
    }


    try {

        if (!userId) {

            const current =
                await getSupabaseUser();


            if (
                !current.success ||
                !current.user
            ) {

                return {
                    success: false,
                    profile: null,
                    message:
                        "Utilisateur non connecté."
                };
            }


            userId =
                current.user.id;
        }


        const {
            data,
            error
        } =
            await client
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    phone,
                    referral_code,
                    referred_by,
                    balance,
                    total_deposited,
                    total_withdrawn,
                    total_invested,
                    total_referral_bonus,
                    first_deposit_rewarded,
                    is_active,
                    created_at,
                    updated_at
                `)
                .eq(
                    "id",
                    userId
                )
                .single();


        if (error) {

            return {
                success: false,
                profile: null,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de charger le profil."
                    )
            };
        }


        return {
            success: true,
            profile: data
        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            profile: null,
            message:
                "Impossible de charger le profil."
        };
    }
}


/* ============================================================
   10. MISE A JOUR DU PROFIL
   ============================================================ */

async function updateSupabaseProfile({
    fullName,
    phone
} = {}) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Supabase n'est pas configuré."
        };
    }


    const authResult =
        await getSupabaseUser();


    if (
        !authResult.success ||
        !authResult.user
    ) {

        return {
            success: false,
            message:
                "Vous devez être connecté."
        };
    }


    fullName =
        hyqdCleanText(fullName);

    phone =
        hyqdNormalizePhone(phone);


    if (
        fullName.length < 2
    ) {

        return {
            success: false,
            message:
                "Nom complet invalide."
        };
    }


    if (
        !phone ||
        !phone.startsWith("+225")
    ) {

        return {
            success: false,
            message:
                "Numéro de téléphone invalide."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client
                .from("profiles")
                .update({

                    /*
                     * On ne permet volontairement PAS
                     * à cette fonction de modifier :
                     *
                     * balance
                     * total_deposited
                     * total_withdrawn
                     * total_invested
                     * total_referral_bonus
                     * is_active
                     * role
                     */

                    full_name:
                        fullName,

                    phone

                })
                .eq(
                    "id",
                    authResult.user.id
                )
                .select(`
                    id,
                    full_name,
                    phone,
                    referral_code,
                    balance,
                    total_deposited,
                    total_withdrawn,
                    total_invested,
                    total_referral_bonus,
                    is_active,
                    created_at,
                    updated_at
                `)
                .single();


        if (error) {

            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de modifier le profil."
                    )
            };
        }


        /*
         * On met aussi à jour les metadata Auth
         * afin de conserver des informations cohérentes.
         */

        await client.auth.updateUser({

            data: {

                full_name:
                    fullName,

                phone

            }

        });


        return {

            success: true,

            profile: data,

            message:
                "Profil mis à jour avec succès."

        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            message:
                "Impossible de modifier le profil."
        };
    }
}


/* ============================================================
   11. ROLE UTILISATEUR
   ============================================================ */

async function getSupabaseCurrentUserRole() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            role: null
        };
    }


    const authResult =
        await getSupabaseUser();


    if (
        !authResult.success ||
        !authResult.user
    ) {

        return {
            success: false,
            role: null,
            message:
                "Utilisateur non connecté."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client
                .from("user_roles")
                .select("role")
                .eq(
                    "user_id",
                    authResult.user.id
                )
                .single();


        if (error) {

            return {
                success: false,
                role: null,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de vérifier le rôle."
                    )
            };
        }


        return {

            success: true,

            role:
                data?.role || "user"

        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            role: null,
            message:
                "Impossible de vérifier le rôle."
        };
    }
}


/* ============================================================
   12. PROTECTION DES PAGES UTILISATEUR
   ============================================================ */

async function requireSupabaseAuth({
    redirect = true
} = {}) {

    const result =
        await getSupabaseUser();


    if (
        !result.success ||
        !result.user
    ) {

        if (redirect) {

            window.location.replace(
                HYQD_SUPABASE_CONFIG.LOGIN_PAGE
            );

        }


        return null;
    }


    return result.user;
}


/* ============================================================
   13. PROTECTION ADMIN
   ============================================================ */

async function requireSupabaseAdmin({
    redirect = true
} = {}) {

    const user =
        await requireSupabaseAuth({
            redirect
        });


    if (!user) {

        return null;
    }


    const roleResult =
        await getSupabaseCurrentUserRole();


    const isAdmin =
        roleResult.success &&
        (
            roleResult.role === "admin" ||
            roleResult.role === "super_admin"
        );


    if (!isAdmin) {

        if (redirect) {

            window.location.replace(
                HYQD_SUPABASE_CONFIG.DASHBOARD_PAGE
            );

        }


        return null;
    }


    return {

        user,

        role:
            roleResult.role

    };
}


/* ============================================================
   14. RESET MOT DE PASSE
   ============================================================ */

async function requestSupabasePasswordReset(
    email
) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Supabase n'est pas configuré."
        };
    }


    email =
        hyqdNormalizeEmail(email);


    if (!email) {

        return {
            success: false,
            message:
                "Veuillez saisir votre adresse email."
        };
    }


    try {

        /*
         * IMPORTANT :
         *
         * Le lien doit correspondre à une URL autorisée
         * dans Supabase :
         * Authentication > URL Configuration.
         */

        const resetUrl =
            new URL(
                "forgot-password.html",
                window.location.href
            ).href;


        const {
            error
        } =
            await client.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            resetUrl
                    }
                );


        if (error) {

            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible d'envoyer l'email."
                    )
            };
        }


        return {
            success: true,
            message:
                "Si cette adresse correspond à un compte, les instructions de réinitialisation ont été envoyées."
        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            message:
                "Impossible d'envoyer la demande de réinitialisation."
        };
    }
}


/* ============================================================
   15. NOUVEAU MOT DE PASSE
   ============================================================ */

async function updateSupabasePassword(
    newPassword
) {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Supabase n'est pas configuré."
        };
    }


    newPassword =
        String(
            newPassword || ""
        );


    if (
        newPassword.length < 8
    ) {

        return {
            success: false,
            message:
                "Le nouveau mot de passe doit contenir au moins 8 caractères."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client.auth.updateUser({

                password:
                    newPassword

            });


        if (error) {

            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de modifier le mot de passe."
                    )
            };
        }


        return {

            success: true,

            user:
                data?.user || null,

            message:
                "Votre mot de passe a été modifié avec succès."

        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            message:
                "Impossible de modifier le mot de passe."
        };
    }
}


/* ============================================================
   16. PACKS
   ============================================================ */

async function getSupabaseInvestmentPacks() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            packs: []
        };
    }


    try {

        const {
            data,
            error
        } =
            await client
                .from("investment_packs")
                .select(`
                    id,
                    name,
                    amount,
                    daily_income,
                    duration_days,
                    total_income,
                    image_url,
                    sort_order,
                    is_active
                `)
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (error) {

            return {
                success: false,
                packs: [],
                message:
                    hyqdSafeMessage(
                        error,
                        "Impossible de charger les packs."
                    )
            };
        }


        return {

            success: true,

            packs:
                Array.isArray(data)
                    ? data
                    : []

        };

    } catch (error) {

        console.error(error);


        return {
            success: false,
            packs: [],
            message:
                "Impossible de charger les packs."
        };
    }
}


/* ============================================================
   17. SURVEILLER LES CHANGEMENTS DE SESSION
   ============================================================ */

function onHousingAuthStateChange(
    callback
) {

    const client =
        initializeHousingSupabase();


    if (
        !client ||
        typeof callback !== "function"
    ) {

        return null;
    }


    const {
        data
    } =
        client.auth.onAuthStateChange(
            (
                event,
                session
            ) => {

                try {

                    callback(
                        event,
                        session
                    );

                } catch (error) {

                    console.error(
                        "[Housing's YQD] Erreur auth callback :",
                        error
                    );
                }

            }
        );


    return (
        data?.subscription ||
        null
    );
}


/* ============================================================
   18. DIAGNOSTIC
   ============================================================ */

async function testHousingSupabaseConnection() {

    const client =
        initializeHousingSupabase();


    if (!client) {

        return {
            success: false,
            message:
                "Configuration Supabase absente ou invalide."
        };
    }


    try {

        const {
            data,
            error
        } =
            await client
                .from("investment_packs")
                .select(
                    "id,name,amount"
                )
                .limit(1);


        if (error) {

            console.error(
                "[Housing's YQD] Test Supabase échoué :",
                error
            );


            return {
                success: false,
                message:
                    hyqdSafeMessage(
                        error,
                        "Connexion Supabase impossible."
                    )
            };
        }


        console.info(
            "[Housing's YQD] Connexion Supabase OK.",
            data
        );


        return {
            success: true,
            message:
                "Connexion Supabase opérationnelle."
        };

    } catch (error) {

        console.error(
            "[Housing's YQD] Test Supabase :",
            error
        );


        return {
            success: false,
            message:
                "Connexion Supabase impossible."
        };
    }
}


/* ============================================================
   19. EXPORT GLOBAL
   ============================================================ */

/*
 * Comme Housing's YQD fonctionne actuellement avec
 * plusieurs fichiers HTML classiques et sans bundler,
 * nous exposons les fonctions globalement.
 */

window.HYQD_SUPABASE_CONFIG =
    HYQD_SUPABASE_CONFIG;

window.hyqdSupabase =
    hyqdSupabase;

window.initializeHousingSupabase =
    initializeHousingSupabase;

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

window.onHousingAuthStateChange =
    onHousingAuthStateChange;

window.testHousingSupabaseConnection =
    testHousingSupabaseConnection;


/* ============================================================
   FIN SUPABASE.JS
   ============================================================ */
