"use strict";

/* ============================================================
   HOUSING'S YQD - SUPABASE
   Version sécurisée
============================================================ */

const HYQD_SUPABASE_CONFIG = Object.freeze({
    URL: "https://qcvagkialoztluqxpmcq.supabase.co",
    PUBLISHABLE_KEY: "sb_publishable_J_fhucIX6-Fdals6lVQvvA_yCmUkwVy",

    APP_NAME: "Housing's YQD",

    HOME_PAGE: "index.html",
    LOGIN_PAGE: "login.html",
    REGISTER_PAGE: "register.html",
    DASHBOARD_PAGE: "dashboard.html",
    ADMIN_PAGE: "admin.html"
});


/* ============================================================
   INITIALISATION
============================================================ */

function initializeHousingSupabase() {

    if (!window.supabase) {
        throw new Error(
            "La bibliothèque Supabase n'est pas chargée."
        );
    }

    const key = String(
        HYQD_SUPABASE_CONFIG.PUBLISHABLE_KEY || ""
    );

    if (
        key.includes("service_role") ||
        key.startsWith("sb_secret_")
    ) {
        throw new Error(
            "Une clé secrète Supabase ne doit jamais être utilisée dans le navigateur."
        );
    }

    return window.supabase.createClient(
        HYQD_SUPABASE_CONFIG.URL,
        HYQD_SUPABASE_CONFIG.PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
}


const HYQD_SUPABASE_CLIENT =
    initializeHousingSupabase();


window.HYQD_SUPABASE_CLIENT =
    HYQD_SUPABASE_CLIENT;

window.hyqdSupabase =
    HYQD_SUPABASE_CLIENT;

window.housingSupabase =
    HYQD_SUPABASE_CLIENT;


function getHousingSupabaseClient() {
    return HYQD_SUPABASE_CLIENT;
}


/* ============================================================
   UTILITAIRES
============================================================ */

function hyqdCleanText(value) {
    return String(value ?? "").trim();
}


function hyqdNormalizeEmail(value) {
    return hyqdCleanText(value).toLowerCase();
}


function hyqdNormalizePhone(value) {

    let phone = hyqdCleanText(value)
        .replace(/\s+/g, "");

    if (!phone) {
        return "";
    }

    if (phone.startsWith("+225")) {
        return phone;
    }

    phone = phone.replace(/^0+/, "");

    return "+225" + phone;
}


function hyqdSafeMessage(
    error,
    fallback = "Une erreur est survenue."
) {

    if (!error) {
        return fallback;
    }

    if (typeof error === "string") {
        return error;
    }

    if (error.message) {
        return error.message;
    }

    return fallback;
}


function hyqdFormatNumber(value) {

    return new Intl.NumberFormat(
        "fr-FR"
    ).format(
        Number(value || 0)
    );
}


/* ============================================================
   AUTHENTIFICATION
============================================================ */

async function getSupabaseSession() {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .getSession();

        if (error) {
            throw error;
        }

        return {
            success: true,
            session: data?.session || null
        };

    } catch (error) {

        return {
            success: false,
            session: null,
            message: hyqdSafeMessage(error)
        };
    }
}


async function getSupabaseUser() {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .getUser();

        if (error) {
            throw error;
        }

        return {
            success: true,
            user: data?.user || null
        };

    } catch (error) {

        return {
            success: false,
            user: null,
            message: hyqdSafeMessage(error)
        };
    }
}


async function registerSupabaseUser({
    fullName,
    email,
    phone,
    password,
    referralCode
}) {

    try {

        const cleanName =
            hyqdCleanText(fullName);

        const cleanEmail =
            hyqdNormalizeEmail(email);

        const cleanPhone =
            hyqdNormalizePhone(phone);

        const cleanReferral =
            hyqdCleanText(referralCode)
                .toUpperCase();

        if (!cleanName) {
            throw new Error(
                "Entrez votre nom complet."
            );
        }

        if (!cleanEmail) {
            throw new Error(
                "Entrez une adresse e-mail."
            );
        }

        if (!password || password.length < 6) {
            throw new Error(
                "Le mot de passe doit contenir au moins 6 caractères."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .signUp({
                    email: cleanEmail,
                    password,

                    options: {
                        data: {
                            full_name: cleanName,
                            phone: cleanPhone,
                            referral_code_entered:
                                cleanReferral || null
                        }
                    }
                });

        if (error) {
            throw error;
        }

        return {
            success: true,
            user: data?.user || null,
            session: data?.session || null,
            requiresEmailConfirmation:
                !data?.session,
            message:
                data?.session
                    ? "Inscription réussie."
                    : "Inscription réussie. Vérifiez votre e-mail pour confirmer votre compte."
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Inscription impossible."
            )
        };
    }
}


async function loginSupabaseUser(
    email,
    password
) {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .signInWithPassword({
                    email:
                        hyqdNormalizeEmail(email),
                    password
                });

        if (error) {
            throw error;
        }

        return {
            success: true,
            user: data?.user || null,
            session: data?.session || null,
            message: "Connexion réussie."
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Connexion impossible."
            )
        };
    }
}


async function logoutSupabaseUser() {

    try {

        const { error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .signOut();

        if (error) {
            throw error;
        }

        return {
            success: true
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


/* ============================================================
   VÉRIFICATION DE LA SESSION
============================================================ */

async function requireSupabaseAuth(options = {}) {

    const redirect =
        Boolean(options && options.redirect);

    const result =
        await getSupabaseUser();

    if (
        !result.success ||
        !result.user
    ) {

        if (
            redirect &&
            typeof window !== "undefined"
        ) {

            const currentPage =
                window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();

            if (
                currentPage !==
                HYQD_SUPABASE_CONFIG.LOGIN_PAGE
            ) {

                window.location.replace(
                    HYQD_SUPABASE_CONFIG.LOGIN_PAGE +
                    "?auth=required"
                );
            }

            return null;
        }

        return {
            success: false,
            authorized: false,
            reason: "not_authenticated",
            user: null
        };
    }

    /*
       Cette réponse est compatible avec le dashboard
       et l'espace administrateur.
    */

    return Object.assign(
        {},
        result.user,
        {
            success: true,
            authorized: true,
            reason: null,
            user: result.user
        }
    );
}


/* ============================================================
   RÔLES
============================================================ */

async function getSupabaseCurrentUserRole() {

    try {

        const auth =
            await requireSupabaseAuth();

        if (
            !auth ||
            !auth.authorized
        ) {

            return {
                success: false,
                role: null,
                message:
                    "Utilisateur non connecté."
            };
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .from("user_roles")
                .select("role")
                .eq(
                    "user_id",
                    auth.user.id
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

        return {
            success: true,
            role: data?.role || "user"
        };

    } catch (error) {

        return {
            success: false,
            role: null,
            message: hyqdSafeMessage(error)
        };
    }
}


async function requireSupabaseAdmin() {

    const auth =
        await requireSupabaseAuth();

    if (
        !auth ||
        !auth.authorized
    ) {

        return {
            authorized: false,
            reason: "not_authenticated",
            user: null,
            role: null
        };
    }

    const roleResult =
        await getSupabaseCurrentUserRole();

    const role =
        roleResult?.role || "user";

    const authorized =
        role === "admin" ||
        role === "super_admin";

    return {
        authorized,
        reason:
            authorized
                ? null
                : "not_admin",
        user: auth.user,
        role
    };
}


/* ============================================================
   MOT DE PASSE
============================================================ */

async function requestSupabasePasswordReset(
    email
) {

    try {

        const redirectTo =
            new URL(
                "forgot-password.html",
                window.location.href
            ).href;

        const { error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .resetPasswordForEmail(
                    hyqdNormalizeEmail(email),
                    {
                        redirectTo
                    }
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            message:
                "E-mail de réinitialisation envoyé."
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


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

        const { error } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .updateUser({
                    password: newPassword
                });

        if (error) {
            throw error;
        }

        return {
            success: true,
            message:
                "Mot de passe mis à jour."
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


/* ============================================================
   PROFIL
============================================================ */

async function getSupabaseProfile(
    userId = null
) {

    try {

        let targetUserId =
            userId;

        if (!targetUserId) {

            const auth =
                await requireSupabaseAuth();

            if (
                !auth ||
                !auth.authorized
            ) {

                throw new Error(
                    "Utilisateur non connecté."
                );
            }

            targetUserId =
                auth.user.id;
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    targetUserId
                )
                .maybeSingle();

        if (error) {
            throw error;
        }

        return {
            success: true,
            profile: data || null,
            data: data || null
        };

    } catch (error) {

        return {
            success: false,
            profile: null,
            message: hyqdSafeMessage(error)
        };
    }
}


async function updateSupabaseProfile({
    fullName,
    phone
}) {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "update_my_profile",
                    {
                        p_full_name:
                            hyqdCleanText(fullName),

                        p_phone:
                            hyqdNormalizePhone(phone)
                    }
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            data,
            message:
                data?.message ||
                "Profil mis à jour."
        };

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


/* ============================================================
   PACKS D’INVESTISSEMENT
============================================================ */

async function getSupabaseInvestmentPacks() {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .from("investment_packs")
                .select("*")
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
            throw error;
        }

        return {
            success: true,
            packs: data || []
        };

    } catch (error) {

        return {
            success: false,
            packs: [],
            message: hyqdSafeMessage(error)
        };
    }
}
