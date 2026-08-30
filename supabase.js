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

    const key =
        String(
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

    return String(
        value ?? ""
    ).trim();

}


function hyqdNormalizeEmail(value) {

    return hyqdCleanText(value)
        .toLowerCase();

}


function hyqdNormalizePhone(value) {

    let phone =
        hyqdCleanText(value)
            .replace(/\s+/g, "");

    if (!phone) {
        return "";
    }

    if (phone.startsWith("+225")) {
        return phone;
    }

    phone =
        phone.replace(/^0+/, "");

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

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .getSession();

        if (error) {
            throw error;
        }

        return {
            success: true,
            session:
                data?.session || null
        };

    } catch (error) {

        return {
            success: false,
            session: null,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function getSupabaseUser() {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .getUser();

        if (error) {
            throw error;
        }

        return {
            success: true,
            user:
                data?.user || null
        };

    } catch (error) {

        return {
            success: false,
            user: null,
            message:
                hyqdSafeMessage(error)
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

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .signUp({
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
            success: true,
            user:
                data?.user || null,
            session:
                data?.session || null,
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
            message:
                hyqdSafeMessage(
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

        const {
            data,
            error
        } =
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
            user:
                data?.user || null,
            session:
                data?.session || null,
            message:
                "Connexion réussie."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(
                    error,
                    "Connexion impossible."
                )
        };

    }

}


async function logoutSupabaseUser() {

    try {

        const {
            error
        } =
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
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function requireSupabaseAuth() {

    const result =
        await getSupabaseUser();

    if (
        !result.success ||
        !result.user
    ) {
        return {
            authorized: false,
            reason:
                "not_authenticated",
            user: null
        };
    }

    return {
        authorized: true,
        user:
            result.user
    };

}


async function getSupabaseCurrentUserRole() {

    try {

        const auth =
            await requireSupabaseAuth();

        if (!auth.authorized) {

            return {
                success: false,
                role: null,
                message:
                    "Utilisateur non connecté."
            };

        }

        const {
            data,
            error
        } =
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
            role:
                data?.role || "user"
        };

    } catch (error) {

        return {
            success: false,
            role: null,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function requireSupabaseAdmin() {

    const auth =
        await requireSupabaseAuth();

    if (!auth.authorized) {

        return {
            authorized: false,
            reason:
                "not_authenticated",
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
        user:
            auth.user,
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

        const {
            error
        } =
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
            message:
                hyqdSafeMessage(error)
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

        const {
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .auth
                .updateUser({
                    password:
                        newPassword
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
            message:
                hyqdSafeMessage(error)
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

            if (!auth.authorized) {

                throw new Error(
                    "Utilisateur non connecté."
                );
            }

            targetUserId =
                auth.user.id;
        }

        const {
            data,
            error
        } =
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
            profile:
                data || null,
            data:
                data || null
        };

    } catch (error) {

        return {
            success: false,
            profile: null,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function updateSupabaseProfile({
    fullName,
    phone
}) {

    try {

        const {
            data,
            error
        } =
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
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   PACKS
============================================================ */

async function getSupabaseInvestmentPacks() {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from(
                    "investment_packs"
                )
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
            packs:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            packs: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   DEMANDES FINANCIERES
============================================================ */

async function requestSupabaseDeposit({
    amount,
    method,
    reference
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "request_deposit",
                    {
                        p_amount:
                            Number(amount),

                        p_method:
                            hyqdCleanText(method),

                        p_reference:
                            hyqdCleanText(reference) ||
                            null
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
                "Demande de dépôt enregistrée."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function requestSupabaseWithdrawal({
    amount,
    method,
    destinationPhone
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "request_withdrawal",
                    {
                        p_amount:
                            Number(amount),

                        p_method:
                            hyqdCleanText(method),

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
            success: true,
            data,
            message:
                data?.message ||
                "Demande de retrait enregistrée."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function investSupabasePack(
    packId
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "invest_in_pack",
                    {
                        p_pack_id:
                            packId
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
                "Investissement enregistré."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   DONNEES UTILISATEUR
============================================================ */

async function getSupabaseDeposits(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("deposits")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            deposits:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            deposits: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function getSupabaseWithdrawals(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("withdrawals")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            withdrawals:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            withdrawals: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function getSupabaseInvestments(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("investments")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            investments:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            investments: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function getSupabaseReferralRewards(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from(
                    "referral_rewards"
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            rewards:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            rewards: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   SUPPORT
============================================================ */

async function createSupabaseSupportTicket({
    subject,
    message
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "create_support_ticket",
                    {
                        p_subject:
                            hyqdCleanText(subject),

                        p_message:
                            hyqdCleanText(message)
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
                "Ticket envoyé."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function getSupabaseSupportTickets(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from(
                    "support_tickets"
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            tickets:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            tickets: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   NOTIFICATIONS
============================================================ */

async function getSupabaseNotifications(
    limit = 100
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from(
                    "notifications"
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            notifications:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            notifications: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function markSupabaseNotificationRead(
    notificationId
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
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
            success: true,
            data,
            message:
                "Notification lue."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


async function markAllSupabaseNotificationsRead() {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "mark_all_notifications_read"
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            data,
            message:
                "Notifications mises à jour."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   TICKER DES DEPOTS APPROUVES
============================================================ */

async function getApprovedDepositTicker(
    limit = 20
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "get_approved_deposit_ticker",
                    {
                        p_limit:
                            Number(limit)
                    }
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            deposits:
                data || [],
            ticker:
                data || []
        };

    } catch (error) {

        return {
            success: false,
            deposits: [],
            ticker: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - AIDE POUR RATTACHER LES PROFILS
============================================================ */

async function adminAttachProfiles(
    rows
) {

    if (
        !Array.isArray(rows) ||
        !rows.length
    ) {
        return rows || [];
    }

    const userIds =
        [
            ...new Set(
                rows
                    .map(
                        item =>
                            item.user_id
                    )
                    .filter(Boolean)
            )
        ];

    if (!userIds.length) {
        return rows;
    }

    const {
        data: profileRows,
        error
    } =
        await HYQD_SUPABASE_CLIENT
            .from("profiles")
            .select(
                "id, full_name, phone, referral_code"
            )
            .in(
                "id",
                userIds
            );

    if (error) {

        console.warn(
            "Impossible de rattacher les profils :",
            error
        );

        return rows;
    }

    const profileMap =
        new Map(
            (profileRows || [])
                .map(
                    profile => [
                        profile.id,
                        profile
                    ]
                )
        );

    return rows.map(
        row => ({
            ...row,

            profiles:
                profileMap.get(
                    row.user_id
                ) || null
        })
    );
}


/* ============================================================
   ADMIN - UTILISATEURS
============================================================ */

async function adminGetSupabaseProfiles(
    limit = 500
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("profiles")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        return {
            success: true,
            profiles:
                data || []
        };

    } catch (error) {

        console.error(
            "adminGetSupabaseProfiles:",
            error
        );

        return {
            success: false,
            profiles: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - DEPOTS
============================================================ */

async function adminGetSupabaseDeposits(
    limit = 500
) {

    try {

        /*
         * IMPORTANT :
         * On ne fait plus de jointure automatique
         * profiles(...) ici.
         *
         * On lit d'abord les dépôts.
         * Ensuite on rattache les profils.
         */

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("deposits")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        const deposits =
            await adminAttachProfiles(
                data || []
            );

        return {
            success: true,
            deposits
        };

    } catch (error) {

        console.error(
            "adminGetSupabaseDeposits:",
            error
        );

        return {
            success: false,
            deposits: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - RETRAITS
============================================================ */

async function adminGetSupabaseWithdrawals(
    limit = 500
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("withdrawals")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        const withdrawals =
            await adminAttachProfiles(
                data || []
            );

        return {
            success: true,
            withdrawals
        };

    } catch (error) {

        console.error(
            "adminGetSupabaseWithdrawals:",
            error
        );

        return {
            success: false,
            withdrawals: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - INVESTISSEMENTS
============================================================ */

async function adminGetSupabaseInvestments(
    limit = 500
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("investments")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        const investments =
            await adminAttachProfiles(
                data || []
            );

        return {
            success: true,
            investments
        };

    } catch (error) {

        console.error(
            "adminGetSupabaseInvestments:",
            error
        );

        return {
            success: false,
            investments: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - SUPPORT
============================================================ */

async function adminGetSupabaseSupportTickets(
    limit = 500
) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from("support_tickets")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(limit);

        if (error) {
            throw error;
        }

        const tickets =
            await adminAttachProfiles(
                data || []
            );

        return {
            success: true,
            tickets
        };

    } catch (error) {

        console.error(
            "adminGetSupabaseSupportTickets:",
            error
        );

        return {
            success: false,
            tickets: [],
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - TRAITEMENT DEPOT
============================================================ */

async function adminReviewSupabaseDeposit({
    depositId,
    approve,
    note
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "admin_review_deposit",
                    {
                        p_deposit_id:
                            depositId,

                        p_approve:
                            Boolean(approve),

                        p_note:
                            hyqdCleanText(note) ||
                            null
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
                (
                    approve
                        ? "Dépôt approuvé."
                        : "Dépôt refusé."
                )
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - TRAITEMENT RETRAIT
============================================================ */

async function adminReviewSupabaseWithdrawal({
    withdrawalId,
    approve,
    note
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "admin_review_withdrawal",
                    {
                        p_withdrawal_id:
                            withdrawalId,

                        p_approve:
                            Boolean(approve),

                        p_note:
                            hyqdCleanText(note) ||
                            null
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
                (
                    approve
                        ? "Retrait approuvé."
                        : "Retrait refusé."
                )
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ADMIN - REPONSE SUPPORT
============================================================ */

async function adminReplySupabaseSupportTicket({
    ticketId,
    reply,
    close = false
}) {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "admin_reply_support_ticket",
                    {
                        p_ticket_id:
                            ticketId,

                        p_reply:
                            hyqdCleanText(reply),

                        p_close:
                            Boolean(close)
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
                "Réponse envoyée."
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}


/* ============================================================
   ECOUTE AUTH
============================================================ */

function onHousingAuthStateChange(
    callback
) {

    return HYQD_SUPABASE_CLIENT
        .auth
        .onAuthStateChange(
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

}


/* ============================================================
   TEST CONNEXION
============================================================ */

async function testHousingSupabaseConnection() {

    try {

        const {
            data,
            error
        } =
            await HYQD_SUPABASE_CLIENT
                .from(
                    "investment_packs"
                )
                .select(
                    "id,name"
                )
                .limit(1);

        if (error) {
            throw error;
        }

        return {
            success: true,
            data
        };

    } catch (error) {

        return {
            success: false,
            message:
                hyqdSafeMessage(error)
        };

    }

}
