"use strict";

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


function hyqdCleanText(value) {
    return String(value ?? "").trim();
}


function hyqdNormalizeEmail(value) {
    return hyqdCleanText(value).toLowerCase();
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

    return error.message || fallback;
}


function hyqdRpcResult(
    data,
    fallbackMessage
) {

    if (
        data &&
        typeof data === "object" &&
        data.success === false
    ) {
        return data;
    }

    return {
        success: true,
        ...(data && typeof data === "object"
            ? data
            : { data }),
        message:
            data?.message ||
            fallbackMessage
    };
}


/* AUTHENTIFICATION */

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


async function requireSupabaseAuth(
    options = {}
) {

    const redirect =
        Boolean(options?.redirect);

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


/* ADMINISTRATION */

async function getSupabaseCurrentUserRole() {

    try {

        const auth =
            await requireSupabaseAuth();

        if (!auth?.authorized) {
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

    if (!auth?.authorized) {
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


/* MOT DE PASSE */

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
                    { redirectTo }
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


/* PROFIL */

async function getSupabaseProfile(
    userId = null
) {

    try {

        let targetUserId =
            userId;

        if (!targetUserId) {

            const auth =
                await requireSupabaseAuth();

            if (!auth?.authorized) {
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
            data: null,
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

        return hyqdRpcResult(
            data,
            "Profil mis à jour."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


/* PACKS */

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
                    { ascending: true }
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            packs: data || [],
            data: data || []
        };

    } catch (error) {

        return {
            success: false,
            packs: [],
            data: [],
            message: hyqdSafeMessage(error)
        };
    }
}


/* DÉPÔT */

async function requestSupabaseDeposit({
    amount,
    method,
    reference
}) {

    try {

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            throw new Error(
                "Entrez un montant de dépôt valide."
            );
        }

        if (!hyqdCleanText(method)) {
            throw new Error(
                "Sélectionnez un moyen de paiement."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "request_deposit",
                    {
                        p_amount: numericAmount,
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

        return hyqdRpcResult(
            data,
            "Demande de dépôt enregistrée."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Dépôt impossible."
            )
        };
    }
}


/* RETRAIT */

async function requestSupabaseWithdrawal({
    amount,
    method,
    destinationPhone
}) {

    try {

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            throw new Error(
                "Entrez un montant de retrait valide."
            );
        }

        if (!hyqdCleanText(method)) {
            throw new Error(
                "Sélectionnez un moyen de retrait."
            );
        }

        if (!hyqdCleanText(destinationPhone)) {
            throw new Error(
                "Entrez le numéro de destination."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "request_withdrawal",
                    {
                        p_amount: numericAmount,
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

        return hyqdRpcResult(
            data,
            "Demande de retrait enregistrée."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Retrait impossible."
            )
        };
    }
}


/* INVESTISSEMENT */

async function investSupabasePack(packId) {

    try {

        const cleanPackId =
            hyqdCleanText(packId);

        if (!cleanPackId) {
            throw new Error(
                "Pack non défini."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "invest_in_pack",
                    {
                        p_pack_id:
                            cleanPackId
                    }
                );

        if (error) {
            throw error;
        }

        return hyqdRpcResult(
            data,
            "Investissement activé avec succès."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Investissement impossible."
            )
        };
    }
}


/* LECTURE DES DONNÉES DE L’UTILISATEUR */

async function hyqdSelectMine(
    table,
    orderColumn = "created_at"
) {

    try {

        const auth =
            await requireSupabaseAuth();

        if (!auth?.authorized) {
            throw new Error(
                "Utilisateur non connecté."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .from(table)
                .select("*")
                .eq(
                    "user_id",
                    auth.user.id
                )
                .order(
                    orderColumn,
                    { ascending: false }
                );

        if (error) {
            throw error;
        }

        return {
            success: true,
            data: data || []
        };

    } catch (error) {

        return {
            success: false,
            data: [],
            message: hyqdSafeMessage(error)
        };
    }
}


async function getSupabaseDeposits() {

    const result =
        await hyqdSelectMine("deposits");

    return {
        ...result,
        deposits: result.data || []
    };
}


async function getSupabaseWithdrawals() {

    const result =
        await hyqdSelectMine("withdrawals");

    return {
        ...result,
        withdrawals: result.data || []
    };
}


async function getSupabaseInvestments() {

    const result =
        await hyqdSelectMine("investments");

    return {
        ...result,
        investments: result.data || []
    };
}


async function getSupabaseSupportTickets() {

    const result =
        await hyqdSelectMine("support_tickets");

    return {
        ...result,
        tickets: result.data || []
    };
}


async function getSupabaseNotifications() {

    const result =
        await hyqdSelectMine("notifications");

    return {
        ...result,
        notifications: result.data || []
    };
}


/* ASSISTANCE */

async function createSupabaseSupportTicket({
    subject,
    message
}) {

    try {

        const cleanSubject =
            hyqdCleanText(subject);

        const cleanMessage =
            hyqdCleanText(message);

        if (!cleanSubject || !cleanMessage) {
            throw new Error(
                "Renseignez le sujet et le message."
            );
        }

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "create_support_ticket",
                    {
                        p_subject: cleanSubject,
                        p_message: cleanMessage
                    }
                );

        if (error) {
            throw error;
        }

        return hyqdRpcResult(
            data,
            "Ticket envoyé."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(
                error,
                "Envoi impossible."
            )
        };
    }
}


/* NOTIFICATIONS */

async function markSupabaseNotificationRead(
    notificationId
) {

    try {

        const { data, error } =
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

        return hyqdRpcResult(
            data,
            "Notification lue."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


async function markAllSupabaseNotificationsRead() {

    try {

        const { data, error } =
            await HYQD_SUPABASE_CLIENT
                .rpc(
                    "mark_all_notifications_read"
                );

        if (error) {
            throw error;
        }

        return hyqdRpcResult(
            data,
            "Notifications lues."
        );

    } catch (error) {

        return {
            success: false,
            message: hyqdSafeMessage(error)
        };
    }
}


/* DÉPÔTS VALIDÉS DÉFILANTS */

async function getApprovedDepositTicker(
    limit = 20
) {

    try {

        const { data, error } =
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

        const ticker =
            Array.isArray(data)
                ? data
                : (
                    data?.ticker ||
                    data?.deposits ||
                    []
                );

        return {
            success: true,
            ticker,
            deposits: ticker
        };

    } catch (error) {

        return {
            success: false,
            ticker: [],
            deposits: [],
            message: hyqdSafeMessage(error)
        };
    }
}
