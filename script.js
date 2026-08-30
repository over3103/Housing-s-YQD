"use strict";

const HYQD_CONFIG=Object.freeze({
APP_NAME:"Housing's YQD",
ADMIN_CODE:"937854M",
REFERRAL_RATE:.10,
DEPOSIT_FEE_RATE:.01,
WITHDRAW_FEE_RATE:.25,
INVESTMENT_DURATION:180,
MIN_DEPOSIT:1000,
MIN_WITHDRAWAL:1000,
DAY_MS:24*60*60*1000
});

const HYQD_KEYS=Object.freeze({
USERS:"hyqd_users_v4",
CURRENT_USER:"hyqd_current_user_v4",
ADMIN_SESSION:"hyqd_admin_session_v4",
PASSWORD_RESETS:"hyqd_password_resets_v4"
});

const HYQD_INVESTMENT_PACKS=Object.freeze([
Object.freeze({id:"starter",name:"Starter",amount:3000,dailyIncome:800,totalIncome:144000,duration:180}),
Object.freeze({id:"familial",name:"Familial",amount:10000,dailyIncome:3000,totalIncome:540000,duration:180}),
Object.freeze({id:"confort",name:"Confort",amount:20000,dailyIncome:6000,totalIncome:1080000,duration:180}),
Object.freeze({id:"premium",name:"Premium",amount:45000,dailyIncome:14000,totalIncome:2520000,duration:180}),
Object.freeze({id:"prestige",name:"Prestige",amount:100000,dailyIncome:30000,totalIncome:5400000,duration:180}),
Object.freeze({id:"premium-plus",name:"Premium Plus",amount:200000,dailyIncome:65000,totalIncome:11700000,duration:180}),
Object.freeze({id:"elite",name:"Elite",amount:400000,dailyIncome:140000,totalIncome:25200000,duration:180}),
Object.freeze({id:"luxury",name:"Luxury",amount:800000,dailyIncome:290000,totalIncome:52200000,duration:180})
]);

function hyqdGet(key,fallback=null){
try{
const raw=localStorage.getItem(key);
return raw===null?fallback:JSON.parse(raw);
}catch(error){
console.error("Erreur lecture stockage Housing's YQD :",error);
return fallback;
}
}

function hyqdSet(key,value){
try{
localStorage.setItem(key,JSON.stringify(value));
return true;
}catch(error){
console.error("Erreur écriture stockage Housing's YQD :",error);
return false;
}
}

function cloneData(value){
if(value===undefined)return undefined;
return JSON.parse(JSON.stringify(value));
}

function safeNumber(value){
const number=Number(value);
return Number.isFinite(number)?number:0;
}

function roundFCFA(value){
return Math.max(0,Math.round(safeNumber(value)));
}

function generateId(prefix="id"){
if(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function"){
return `${prefix}_${crypto.randomUUID()}`;
}
return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
}

function generateCode(){
const letters=Math.random().toString(36).slice(2,6).toUpperCase();
const numbers=Math.floor(1000+Math.random()*9000);
return `YQD${letters}${numbers}`;
}

function normalizePhone(phone){
let value=String(phone||"")
.trim()
.replace(/\s+/g,"")
.replace(/[^\d+]/g,"");

if(value.startsWith("+225"))value=value.slice(4);
if(value.startsWith("00225"))value=value.slice(5);

return value.replace(/\D/g,"");
}

function isValidIvoryCoastPhone(phone){
return /^\d{8,10}$/.test(normalizePhone(phone));
}

function formatFCFA(amount){
return `${new Intl.NumberFormat("fr-FR").format(roundFCFA(amount))} FCFA`;
}

function escapeHtml(value){
const text=String(value??"");

if(typeof document==="undefined"){
return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

const div=document.createElement("div");
div.textContent=text;
return div.innerHTML;
}

function nowIso(){
return new Date().toISOString();
}

function calculateFee(amount,rate){
return Math.floor(roundFCFA(amount)*safeNumber(rate));
}

function ensureUserShape(user){
if(!user||typeof user!=="object")return user;

user.fullName=String(user.fullName||user.name||"Utilisateur").trim();
user.name=user.fullName;
user.phone=normalizePhone(user.phone);
user.balance=safeNumber(user.balance);
user.totalDeposited=safeNumber(user.totalDeposited);
user.totalWithdrawn=safeNumber(user.totalWithdrawn);
user.totalInvested=safeNumber(user.totalInvested);
user.totalInvestmentIncome=safeNumber(user.totalInvestmentIncome);
user.totalReferralBonus=safeNumber(user.totalReferralBonus);

user.transactions=Array.isArray(user.transactions)?user.transactions:[];
user.investments=Array.isArray(user.investments)?user.investments:[];
user.tickets=Array.isArray(user.tickets)?user.tickets:[];

user.tickets=user.tickets.map(ticket=>{
if(!ticket||typeof ticket!=="object")return ticket;
if(ticket.adminReply&&!ticket.reply)ticket.reply=ticket.adminReply;
if(ticket.reply&&!ticket.adminReply)ticket.adminReply=ticket.reply;
return ticket;
});

user.notifications=Array.isArray(user.notifications)?user.notifications:[];
user.status=user.status||"active";
user.firstDepositCompleted=Boolean(user.firstDepositCompleted);
user.createdAt=user.createdAt||nowIso();

if(!user.referralCode)user.referralCode=generateCode();

return user;
}

function getInvestmentPacks(){
return cloneData(HYQD_INVESTMENT_PACKS);
}

function getPackById(packId){
return HYQD_INVESTMENT_PACKS.find(
pack=>pack.id===String(packId||"")
)||null;
}

function getPackByAmount(amount){
return HYQD_INVESTMENT_PACKS.find(
pack=>Number(pack.amount)===Number(amount)
)||null;
}

function getCanonicalPack(pack){
if(!pack)return null;
if(typeof pack==="string")return getPackById(pack);
return(pack.id&&getPackById(pack.id))||getPackByAmount(pack.amount);
}

function getUsersRaw(){
const users=hyqdGet(HYQD_KEYS.USERS,[]);
if(!Array.isArray(users))return[];
return users.map(ensureUserShape);
}

function saveUsers(users){
const safeUsers=Array.isArray(users)?users.map(ensureUserShape):[];
return hyqdSet(HYQD_KEYS.USERS,safeUsers);
}

function findUserById(userId){
return getUsersRaw().find(user=>user.id===userId)||null;
}

function findUserByPhone(phone){
const normalized=normalizePhone(phone);
return getUsersRaw().find(
user=>normalizePhone(user.phone)===normalized
)||null;
}

function findUserByReferralCode(code){
const referral=String(code||"").trim().toUpperCase();

if(!referral)return null;

return getUsersRaw().find(
user=>String(user.referralCode||"").toUpperCase()===referral
)||null;
}

function registerUser(...args){
let data;

if(args.length===1&&typeof args[0]==="object"&&args[0]!==null){
data=args[0];
}else{
data={
fullName:args[0]||"",
phone:args[1]||"",
password:args[2]||"",
confirmPassword:args[3]??args[2]??"",
referralCode:args[4]||""
};
}

const fullName=String(data.fullName||data.name||"").trim();
const phone=normalizePhone(data.phone);
const password=String(data.password||"");
const confirmPassword=String(data.confirmPassword??password);
const referralCode=String(data.referralCode||"").trim().toUpperCase();

if(fullName.length<3||fullName.split(/\s+/).filter(Boolean).length<2){
return{success:false,message:"Veuillez renseigner votre nom complet."};
}

if(!isValidIvoryCoastPhone(phone)){
return{success:false,message:"Veuillez renseigner un numéro de téléphone valide."};
}

if(password.length<6){
return{success:false,message:"Le mot de passe doit contenir au moins 6 caractères."};
}

if(password!==confirmPassword){
return{success:false,message:"Les mots de passe ne correspondent pas."};
}

const users=getUsersRaw();

if(users.some(user=>normalizePhone(user.phone)===phone)){
return{success:false,message:"Un compte existe déjà avec ce numéro."};
}

const sponsor=referralCode
?users.find(user=>String(user.referralCode||"").toUpperCase()===referralCode)
:null;

if(referralCode&&!sponsor){
return{success:false,message:"Le code de parrainage est invalide."};
}

let personalReferralCode=generateCode();

while(users.some(user=>user.referralCode===personalReferralCode)){
personalReferralCode=generateCode();
}

const user=ensureUserShape({
id:generateId("user"),
fullName,
name:fullName,
phone,
password,
balance:0,
totalDeposited:0,
totalWithdrawn:0,
totalInvested:0,
totalInvestmentIncome:0,
totalReferralBonus:0,
referralCode:personalReferralCode,
referredBy:sponsor?sponsor.referralCode:"",
sponsorId:sponsor?sponsor.id:null,
firstDepositCompleted:false,
transactions:[],
investments:[],
tickets:[],
notifications:[],
status:"active",
createdAt:nowIso()
});

users.unshift(user);
saveUsers(users);
hyqdSet(HYQD_KEYS.CURRENT_USER,user.id);

return{
success:true,
message:"Inscription réussie.",
user:cloneData(user)
};
}

function loginUser(phone,password){
const normalized=normalizePhone(phone);
const users=getUsersRaw();

const user=users.find(
item=>normalizePhone(item.phone)===normalized
);

if(!user){
return{success:false,message:"Compte introuvable."};
}

if(String(user.password)!==String(password)){
return{success:false,message:"Mot de passe incorrect."};
}

if(user.status==="blocked"){
return{success:false,message:"Ce compte est actuellement bloqué."};
}

hyqdSet(HYQD_KEYS.CURRENT_USER,user.id);
processInvestmentGainsForUser(user.id);

return{
success:true,
message:"Connexion réussie.",
user:getCurrentUser()
};
}

function logoutUser(){
localStorage.removeItem(HYQD_KEYS.CURRENT_USER);
return true;
}

function getCurrentUserId(){
return hyqdGet(HYQD_KEYS.CURRENT_USER,null);
}

function getCurrentUser(){
const userId=getCurrentUserId();

if(!userId)return null;

processInvestmentGainsForUser(userId);

const user=getUsersRaw().find(
item=>item.id===userId
);

if(!user){
localStorage.removeItem(HYQD_KEYS.CURRENT_USER);
return null;
}

return cloneData(user);
}

function requireAuth(){
const user=getCurrentUser();

if(!user){
if(typeof window!=="undefined"){
window.location.replace("login.html");
}
return null;
}

return user;
}

function addNotification(
user,
{type="info",title="Information",message=""}={}
){
ensureUserShape(user);

user.notifications.unshift({
id:generateId("notification"),
type,
title:String(title),
message:String(message),
read:false,
createdAt:nowIso()
});
}

function processInvestmentGainsForUser(userId){
if(!userId)return;

const users=getUsersRaw();
const userIndex=users.findIndex(user=>user.id===userId);

if(userIndex<0)return;

const user=ensureUserShape(users[userIndex]);

if(!user.investments.length)return;

let changed=false;
const now=Date.now();

user.investments.forEach(investment=>{
if(!investment)return;

const canonicalPack=
getPackById(investment.packId)
||
getPackByAmount(investment.amount);

if(!canonicalPack)return;

if(investment.dailyIncome!==canonicalPack.dailyIncome){
investment.dailyIncome=canonicalPack.dailyIncome;
changed=true;
}

if(investment.totalIncome!==canonicalPack.totalIncome){
investment.totalIncome=canonicalPack.totalIncome;
changed=true;
}

investment.duration=canonicalPack.duration;

if(typeof investment.creditedDays!=="number"){
investment.creditedDays=0;
changed=true;
}

if(typeof investment.totalIncomeCredited!=="number"){
investment.totalIncomeCredited=
investment.creditedDays*canonicalPack.dailyIncome;
changed=true;
}

if(investment.status==="completed")return;

if(investment.status&&investment.status!=="active")return;

const start=new Date(
investment.startDate||investment.createdAt
).getTime();

if(!Number.isFinite(start))return;

const elapsedFullDays=Math.floor(
Math.max(0,now-start)/HYQD_CONFIG.DAY_MS
);

const payableDays=Math.min(
canonicalPack.duration,
elapsedFullDays
);

const alreadyCredited=Math.max(
0,
Math.floor(safeNumber(investment.creditedDays))
);

const dueDays=payableDays-alreadyCredited;

if(dueDays>0){
const dueAmount=dueDays*canonicalPack.dailyIncome;

const payoutDate=new Date(
start+payableDays*HYQD_CONFIG.DAY_MS
).toISOString();

user.balance+=dueAmount;
user.totalInvestmentIncome+=dueAmount;

investment.totalIncomeCredited=
safeNumber(investment.totalIncomeCredited)+dueAmount;

investment.creditedDays=payableDays;
investment.lastPayoutAt=payoutDate;

user.transactions.unshift({
id:generateId("gain"),
type:"daily_gain",
amount:dueAmount,
unitAmount:canonicalPack.dailyIncome,
days:dueDays,
status:"approved",
investmentId:investment.id,
packId:canonicalPack.id,
packName:canonicalPack.name,
description:dueDays===1
?"Gain journalier crédité"
:`${dueDays} jours de gains crédités`,
createdAt:payoutDate,
processedAt:payoutDate
});

addNotification(user,{
type:"daily_gain",
title:"Gain d'investissement crédité",
message:`${formatFCFA(dueAmount)} ont été ajoutés à votre solde pour le pack ${canonicalPack.name}.`
});

changed=true;
}

if(investment.creditedDays>=canonicalPack.duration){
investment.status="completed";

investment.completedAt=
investment.completedAt
||
new Date(
start+canonicalPack.duration*HYQD_CONFIG.DAY_MS
).toISOString();

changed=true;
}
});

if(changed){
users[userIndex]=user;
saveUsers(users);
}
}

function processAllInvestmentGains(){
getUsersRaw().forEach(
user=>processInvestmentGainsForUser(user.id)
);
}

function investInPack(packInput){
const currentUserId=getCurrentUserId();

if(!currentUserId){
return{success:false,message:"Vous devez être connecté."};
}

const pack=getCanonicalPack(packInput);

if(!pack){
return{
success:false,
message:"Ce pack d'investissement est invalide."
};
}

processInvestmentGainsForUser(currentUserId);

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===currentUserId
);

if(userIndex<0){
return{success:false,message:"Utilisateur introuvable."};
}

const user=ensureUserShape(users[userIndex]);

if(user.balance<pack.amount){
return{
success:false,
message:"Votre solde est insuffisant pour activer ce pack."
};
}

const start=new Date();

const end=new Date(
start.getTime()+pack.duration*HYQD_CONFIG.DAY_MS
);

const investment={
id:generateId("investment"),
packId:pack.id,
packName:pack.name,
amount:pack.amount,
dailyIncome:pack.dailyIncome,
totalIncome:pack.totalIncome,
duration:pack.duration,
creditedDays:0,
totalIncomeCredited:0,
lastPayoutAt:null,
status:"active",
startDate:start.toISOString(),
endDate:end.toISOString(),
createdAt:start.toISOString(),
completedAt:null
};

user.balance-=pack.amount;
user.totalInvested+=pack.amount;

user.investments.unshift(investment);

user.transactions.unshift({
id:generateId("investment_tx"),
type:"investment",
amount:pack.amount,
status:"approved",
investmentId:investment.id,
packId:pack.id,
packName:pack.name,
description:`Activation du pack ${pack.name}`,
createdAt:start.toISOString(),
processedAt:start.toISOString()
});

addNotification(user,{
type:"investment",
title:"Investissement activé",
message:`Votre pack ${pack.name} de ${formatFCFA(pack.amount)} est actif pour 180 jours.`
});

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:"Investissement activé avec succès.",
investment:cloneData(investment)
};
}

function requestDeposit(amount,method,reference){
const userId=getCurrentUserId();

if(!userId){
return{success:false,message:"Vous devez être connecté."};
}

const value=roundFCFA(amount);

if(value<HYQD_CONFIG.MIN_DEPOSIT){
return{
success:false,
message:`Le montant minimum de dépôt est de ${formatFCFA(HYQD_CONFIG.MIN_DEPOSIT)}.`
};
}

const paymentMethod=String(method||"").trim();
const paymentReference=String(reference||"").trim();

if(!paymentMethod){
return{
success:false,
message:"Veuillez sélectionner le moyen de paiement."
};
}

if(paymentReference.length<3){
return{
success:false,
message:"Veuillez renseigner une référence de transaction valide."
};
}

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{success:false,message:"Utilisateur introuvable."};
}

const user=ensureUserShape(users[userIndex]);

const duplicateReference=users.some(
u=>(u.transactions||[]).some(
tx=>
tx.type==="deposit"
&&
String(tx.reference||"").toLowerCase()===
paymentReference.toLowerCase()
&&
tx.status!=="rejected"
)
);

if(duplicateReference){
return{
success:false,
message:"Cette référence de dépôt a déjà été utilisée."
};
}

const fee=calculateFee(
value,
HYQD_CONFIG.DEPOSIT_FEE_RATE
);

const netAmount=Math.max(
0,
value-fee
);

const transaction={
id:generateId("deposit"),
type:"deposit",
amount:value,
fee,
netAmount,
feeRate:HYQD_CONFIG.DEPOSIT_FEE_RATE,
method:paymentMethod,
reference:paymentReference,
status:"pending",
createdAt:nowIso(),
processedAt:null
};

user.transactions.unshift(transaction);

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:`Demande envoyée. Après validation, ${formatFCFA(netAmount)} seront crédités après ${formatFCFA(fee)} de frais (1 %).`,
transaction:cloneData(transaction)
};
}

function createDepositRequest(amount,method,reference){
return requestDeposit(amount,method,reference);
}

function requestWithdrawal(amount,method,phone){
const userId=getCurrentUserId();

if(!userId){
return{success:false,message:"Vous devez être connecté."};
}

processInvestmentGainsForUser(userId);

const value=roundFCFA(amount);

if(value<HYQD_CONFIG.MIN_WITHDRAWAL){
return{
success:false,
message:`Le montant minimum de retrait est de ${formatFCFA(HYQD_CONFIG.MIN_WITHDRAWAL)}.`
};
}

const paymentMethod=String(method||"").trim();
const receivePhone=normalizePhone(phone);

if(!paymentMethod){
return{
success:false,
message:"Veuillez sélectionner le moyen de paiement."
};
}

if(!isValidIvoryCoastPhone(receivePhone)){
return{
success:false,
message:"Veuillez renseigner un numéro de réception valide."
};
}

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{success:false,message:"Utilisateur introuvable."};
}

const user=ensureUserShape(users[userIndex]);

const pendingGross=user.transactions
.filter(
tx=>tx.type==="withdraw"&&tx.status==="pending"
)
.reduce(
(sum,tx)=>sum+safeNumber(tx.amount),
0
);

const available=user.balance-pendingGross;

if(value>available){
return{
success:false,
message:"Solde disponible insuffisant en tenant compte de vos retraits déjà en attente."
};
}

const fee=calculateFee(
value,
HYQD_CONFIG.WITHDRAW_FEE_RATE
);

const netAmount=Math.max(
0,
value-fee
);

const transaction={
id:generateId("withdraw"),
type:"withdraw",
amount:value,
fee,
netAmount,
feeRate:HYQD_CONFIG.WITHDRAW_FEE_RATE,
method:paymentMethod,
phone:receivePhone,
status:"pending",
createdAt:nowIso(),
processedAt:null
};

user.transactions.unshift(transaction);

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:`Demande envoyée. Montant net prévu : ${formatFCFA(netAmount)} après ${formatFCFA(fee)} de frais (25 %).`,
transaction:cloneData(transaction)
};
}

function createWithdrawRequest(amount,method,phone){
return requestWithdrawal(amount,method,phone);
}

function createTicket(subject,message){
const userId=getCurrentUserId();

if(!userId){
return{success:false,message:"Vous devez être connecté."};
}

const cleanSubject=String(subject||"").trim();
const cleanMessage=String(message||"").trim();

if(cleanSubject.length<2){
return{
success:false,
message:"Veuillez renseigner le sujet de votre demande."
};
}

if(cleanMessage.length<5){
return{
success:false,
message:"Veuillez détailler votre demande."
};
}

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{success:false,message:"Utilisateur introuvable."};
}

const user=ensureUserShape(users[userIndex]);

const ticket={
id:generateId("ticket"),
subject:cleanSubject,
message:cleanMessage,
status:"open",
adminReply:"",
reply:"",
createdAt:nowIso(),
repliedAt:null
};

user.tickets.unshift(ticket);

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:"Votre demande a été envoyée à l'assistance.",
ticket:cloneData(ticket)
};
}

function createSupportTicket(subject,message){
return createTicket(subject,message);
}

function requestPasswordReset(phone){
const normalized=normalizePhone(phone);

if(!isValidIvoryCoastPhone(normalized)){
return{
success:false,
message:"Veuillez renseigner un numéro valide."
};
}

const user=findUserByPhone(normalized);

if(!user){
return{
success:false,
message:"Aucun compte n'est associé à ce numéro."
};
}

const resetRequests=hyqdGet(
HYQD_KEYS.PASSWORD_RESETS,
[]
);

const list=Array.isArray(resetRequests)
?resetRequests
:[];

list.unshift({
id:generateId("reset"),
userId:user.id,
phone:normalized,
status:"pending_verification",
createdAt:nowIso()
});

hyqdSet(
HYQD_KEYS.PASSWORD_RESETS,
list.slice(0,50)
);

return{
success:true,
message:"Compte identifié. Pour votre sécurité, la modification du mot de passe nécessite une vérification via le service d’authentification."
};
}

/* =========================================================
   ADMINISTRATION
========================================================= */

function adminLogin(code){
const inputCode=String(code||"").trim();

if(!inputCode){
return{
success:false,
message:"Veuillez saisir le code administrateur."
};
}

if(inputCode!==HYQD_CONFIG.ADMIN_CODE){
return{
success:false,
message:"Code administrateur incorrect."
};
}

sessionStorage.setItem(
HYQD_KEYS.ADMIN_SESSION,
"authenticated"
);

processAllInvestmentGains();

return{
success:true,
message:"Accès administrateur autorisé."
};
}

function authenticateAdmin(code){
return adminLogin(code);
}

function isAdminAuthenticated(){
return sessionStorage.getItem(
HYQD_KEYS.ADMIN_SESSION
)==="authenticated";
}

function adminLogout(){
sessionStorage.removeItem(
HYQD_KEYS.ADMIN_SESSION
);
return true;
}

function getUsers(){
if(isAdminAuthenticated()){
processAllInvestmentGains();
}

return cloneData(
getUsersRaw()
);
}

function adminProcessTransaction(
userId,
transactionId,
status
){
if(!isAdminAuthenticated()){
return{
success:false,
message:"Accès administrateur requis."
};
}

if(!["approved","rejected"].includes(status)){
return{
success:false,
message:"Statut de traitement invalide."
};
}

processInvestmentGainsForUser(userId);

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{
success:false,
message:"Utilisateur introuvable."
};
}

const user=ensureUserShape(
users[userIndex]
);

const transactionIndex=user.transactions.findIndex(
tx=>tx.id===transactionId
);

if(transactionIndex<0){
return{
success:false,
message:"Transaction introuvable."
};
}

const transaction=
user.transactions[transactionIndex];

if(transaction.status!=="pending"){
return{
success:false,
message:"Cette transaction a déjà été traitée."
};
}

if(!["deposit","withdraw"].includes(transaction.type)){
return{
success:false,
message:"Ce type d'opération ne peut pas être traité ici."
};
}

if(
status==="approved"
&&
transaction.type==="deposit"
){
const gross=roundFCFA(
transaction.amount
);

const fee=Number.isFinite(
Number(transaction.fee)
)
?roundFCFA(transaction.fee)
:calculateFee(
gross,
HYQD_CONFIG.DEPOSIT_FEE_RATE
);

const net=Number.isFinite(
Number(transaction.netAmount)
)
?roundFCFA(transaction.netAmount)
:Math.max(0,gross-fee);

transaction.fee=fee;
transaction.netAmount=net;
transaction.feeRate=
HYQD_CONFIG.DEPOSIT_FEE_RATE;

user.balance+=net;
user.totalDeposited+=gross;

if(!user.firstDepositCompleted){
user.firstDepositCompleted=true;

if(user.sponsorId){
const sponsorIndex=users.findIndex(
item=>item.id===user.sponsorId
);

if(
sponsorIndex>=0
&&
sponsorIndex!==userIndex
){
const sponsor=ensureUserShape(
users[sponsorIndex]
);

const bonus=Math.floor(
gross*HYQD_CONFIG.REFERRAL_RATE
);

sponsor.balance+=bonus;
sponsor.totalReferralBonus+=bonus;

sponsor.transactions.unshift({
id:generateId("referral_bonus"),
type:"referral_bonus",
amount:bonus,
status:"approved",
sourceUserId:user.id,
sourceDepositId:transaction.id,
description:"Bonus de parrainage (10 % du premier dépôt validé)",
createdAt:nowIso(),
processedAt:nowIso()
});

addNotification(sponsor,{
type:"referral_bonus",
title:"Bonus de parrainage",
message:`Un bonus de ${formatFCFA(bonus)} a été ajouté à votre solde.`
});

users[sponsorIndex]=sponsor;
}
}
}
}

if(
status==="approved"
&&
transaction.type==="withdraw"
){
const gross=roundFCFA(
transaction.amount
);

const fee=Number.isFinite(
Number(transaction.fee)
)
?roundFCFA(transaction.fee)
:calculateFee(
gross,
HYQD_CONFIG.WITHDRAW_FEE_RATE
);

const net=Number.isFinite(
Number(transaction.netAmount)
)
?roundFCFA(transaction.netAmount)
:Math.max(0,gross-fee);

if(user.balance<gross){
return{
success:false,
message:"Le solde actuel de l'utilisateur est insuffisant pour valider ce retrait."
};
}

transaction.fee=fee;
transaction.netAmount=net;
transaction.feeRate=
HYQD_CONFIG.WITHDRAW_FEE_RATE;

user.balance-=gross;
user.totalWithdrawn+=gross;
}

transaction.status=status;
transaction.processedAt=nowIso();

user.transactions[transactionIndex]=transaction;

addNotification(user,{
type:transaction.type,
title:status==="approved"
?"Opération validée"
:"Opération refusée",

message:transaction.type==="deposit"
?(
status==="approved"
?`Votre dépôt de ${formatFCFA(transaction.amount)} a été validé. Montant net crédité : ${formatFCFA(transaction.netAmount)}.`
:`Votre demande de dépôt de ${formatFCFA(transaction.amount)} a été refusée.`
)
:(
status==="approved"
?`Votre retrait de ${formatFCFA(transaction.amount)} a été validé. Montant net à recevoir : ${formatFCFA(transaction.netAmount)}.`
:`Votre demande de retrait de ${formatFCFA(transaction.amount)} a été refusée.`
)
});

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:status==="approved"
?"Transaction validée avec succès."
:"Transaction refusée avec succès.",
transaction:cloneData(transaction)
};
}

function adminReplyToTicket(
userId,
ticketId,
reply
){
if(!isAdminAuthenticated()){
return{
success:false,
message:"Accès administrateur requis."
};
}

const cleanReply=String(reply||"").trim();

if(cleanReply.length<2){
return{
success:false,
message:"Veuillez saisir une réponse."
};
}

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{
success:false,
message:"Utilisateur introuvable."
};
}

const user=ensureUserShape(
users[userIndex]
);

const ticketIndex=user.tickets.findIndex(
ticket=>ticket.id===ticketId
);

if(ticketIndex<0){
return{
success:false,
message:"Ticket introuvable."
};
}

user.tickets[ticketIndex].adminReply=
cleanReply;

user.tickets[ticketIndex].reply=
cleanReply;

user.tickets[ticketIndex].status=
"answered";

user.tickets[ticketIndex].repliedAt=
nowIso();

addNotification(user,{
type:"support",
title:"Réponse de l'assistance",
message:`L'administration a répondu à votre demande « ${user.tickets[ticketIndex].subject} ».`
});

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:"Réponse envoyée avec succès."
};
}

function getCurrentUserNotifications(){
const user=getCurrentUser();

return user&&Array.isArray(user.notifications)
?cloneData(user.notifications)
:[];
}

function getUnreadNotificationCount(){
return getCurrentUserNotifications()
.filter(notification=>!notification.read)
.length;
}

function markNotificationRead(notificationId){
const userId=getCurrentUserId();

if(!userId)return false;

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0)return false;

const user=ensureUserShape(
users[userIndex]
);

const notification=user.notifications.find(
item=>item.id===notificationId
);

if(!notification)return false;

notification.read=true;

users[userIndex]=user;
saveUsers(users);

return true;
}

function markAllNotificationsRead(){
const userId=getCurrentUserId();

if(!userId)return false;

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0)return false;

const user=ensureUserShape(
users[userIndex]
);

user.notifications.forEach(
notification=>{
notification.read=true;
}
);

users[userIndex]=user;
saveUsers(users);

return true;
}

function getHYQDConfig(){
return cloneData(HYQD_CONFIG);
}

function getHYQDStorageSummary(){
const users=getUsersRaw();

return{
users:users.length,
currentUserId:getCurrentUserId(),
adminAuthenticated:isAdminAuthenticated()
};
}

/* =========================================================
   COMPATIBILITÉ DASHBOARD
========================================================= */

function getCurrentUserTransactions(){
const user=getCurrentUser();

return user&&Array.isArray(user.transactions)
?cloneData(user.transactions)
:[];
}

function getCurrentUserInvestments(){
const user=getCurrentUser();

return user&&Array.isArray(user.investments)
?cloneData(user.investments)
:[];
}

function getCurrentUserTickets(){
const user=getCurrentUser();

return user&&Array.isArray(user.tickets)
?cloneData(user.tickets)
:[];
}

function updateCurrentUserProfile(
dataOrName,
maybePhone
){
const userId=getCurrentUserId();

if(!userId){
return{
success:false,
message:"Vous devez être connecté."
};
}

const data=
dataOrName
&&
typeof dataOrName==="object"
?dataOrName
:{
fullName:dataOrName,
phone:maybePhone
};

const fullName=String(
data.fullName||data.name||""
).trim();

const phone=normalizePhone(
data.phone
);

if(
fullName.length<3
||
fullName.split(/\s+/).filter(Boolean).length<2
){
return{
success:false,
message:"Veuillez renseigner votre nom complet."
};
}

if(!isValidIvoryCoastPhone(phone)){
return{
success:false,
message:"Veuillez renseigner un numéro de téléphone valide."
};
}

const users=getUsersRaw();

const userIndex=users.findIndex(
user=>user.id===userId
);

if(userIndex<0){
return{
success:false,
message:"Utilisateur introuvable."
};
}

const duplicate=users.some(
(user,index)=>
index!==userIndex
&&
normalizePhone(user.phone)===phone
);

if(duplicate){
return{
success:false,
message:"Ce numéro de téléphone est déjà utilisé par un autre compte."
};
}

const user=ensureUserShape(
users[userIndex]
);

user.fullName=fullName;
user.name=fullName;
user.phone=phone;
user.updatedAt=nowIso();

users[userIndex]=user;
saveUsers(users);

return{
success:true,
message:"Profil mis à jour avec succès.",
user:cloneData(user)
};
}

function getCurrentUserReferralInfo(){
const currentUser=getCurrentUser();

if(!currentUser){
return{
referralCode:"",
referralLink:"",
invitedUsers:0,
qualifiedUsers:0,
invitedCount:0,
qualifiedCount:0,
totalReferralBonus:0,
referrals:[]
};
}

const users=getUsersRaw();

const referrals=users
.filter(
user=>
user.id!==currentUser.id
&&
(
user.sponsorId===currentUser.id
||
String(user.referredBy||"").toUpperCase()
===
String(currentUser.referralCode||"").toUpperCase()
)
)
.map(
user=>({
id:user.id,
fullName:user.fullName||user.name||"Utilisateur",
name:user.fullName||user.name||"Utilisateur",
phone:user.phone||"",
createdAt:user.createdAt||null,
qualified:Boolean(user.firstDepositCompleted),
firstDepositCompleted:Boolean(user.firstDepositCompleted),
status:user.firstDepositCompleted
?"qualified"
:"waiting"
})
)
.sort(
(a,b)=>
new Date(b.createdAt||0)
-
new Date(a.createdAt||0)
);

const qualifiedCount=
referrals.filter(item=>item.qualified).length;

const referralCode=
currentUser.referralCode||"";

const referralLink=
typeof window!=="undefined"
?`${window.location.origin}${window.location.pathname.replace(/[^/]*$/,"register.html")}?ref=${encodeURIComponent(referralCode)}`
:`register.html?ref=${encodeURIComponent(referralCode)}`;

return{
referralCode,
referralLink,
invitedUsers:referrals.length,
qualifiedUsers:qualifiedCount,
invitedCount:referrals.length,
qualifiedCount,
totalReferralBonus:safeNumber(
currentUser.totalReferralBonus
),
referrals:cloneData(referrals)
};
}

function maskPhoneNumber(phone){
const normalized=normalizePhone(phone);

if(!normalized)return"*****";

return `*****${normalized.slice(-4)}`;
}

function getApprovedDeposits(limit=20){
const max=Math.max(
1,
Math.min(
100,
Math.floor(safeNumber(limit)||20)
)
);

const deposits=[];

getUsersRaw().forEach(user=>{
(user.transactions||[]).forEach(
transaction=>{
if(
transaction.type!=="deposit"
||
transaction.status!=="approved"
){
return;
}

deposits.push({
...cloneData(transaction),
userId:user.id,
userName:user.fullName||user.name||"Utilisateur",
phone:user.phone||"",
userPhone:user.phone||""
});
}
);
});

return deposits
.sort(
(a,b)=>
new Date(
b.processedAt||b.createdAt||0
)
-
new Date(
a.processedAt||a.createdAt||0
)
)
.slice(0,max);
}

function getNotifications(){
return getCurrentUserNotifications();
}

function markNotificationAsRead(notificationId){
return markNotificationRead(notificationId);
}

function markAllNotificationsAsRead(){
return markAllNotificationsRead();
}
