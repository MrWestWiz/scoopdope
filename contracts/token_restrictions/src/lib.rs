#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

#[contracttype]
pub enum DataKey {
    Admin,
    Whitelist(Address),
    Blacklist(Address),
    TransferLimit(Address),
    PendingApprovals(Address, Address),
    Vesting(Address),
    LockUp(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct VestingSchedule {
    pub total: i128,
    pub start_ledger: u32,
    pub cliff_ledger: u32,
    pub end_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct LockUp {
    pub amount: i128,
    pub unlock_ledger: u32,
}

const WHITELIST_ADD: Symbol = symbol_short!("wl_add");
const BLACKLIST_ADD: Symbol = symbol_short!("bl_add");
const LIMIT_SET: Symbol = symbol_short!("limit");
const APPROVAL_REQ: Symbol = symbol_short!("appr");
const VESTING_SET: Symbol = symbol_short!("vest");
const LOCKUP_SET: Symbol = symbol_short!("lock");

#[contract]
pub struct TokenRestrictionsContract;

#[contractimpl]
impl TokenRestrictionsContract {
    pub fn initialize(env: Env, admin: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Admin),
            "Already initialized"
        );
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn add_to_whitelist(env: Env, admin: Address, account: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can manage whitelist");
        env.storage()
            .instance()
            .set(&DataKey::Whitelist(account.clone()), &true);
        env.events()
            .publish((WHITELIST_ADD, symbol_short!("addr")), account);
    }

    pub fn remove_from_whitelist(env: Env, admin: Address, account: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can manage whitelist");
        env.storage()
            .instance()
            .remove(&DataKey::Whitelist(account.clone()));
        env.events()
            .publish((WHITELIST_ADD, symbol_short!("rmv")), account);
    }

    pub fn is_whitelisted(env: Env, account: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Whitelist(account))
            .unwrap_or(false)
    }

    pub fn add_to_blacklist(env: Env, admin: Address, account: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can manage blacklist");
        env.storage()
            .instance()
            .set(&DataKey::Blacklist(account.clone()), &true);
        env.events()
            .publish((BLACKLIST_ADD, symbol_short!("addr")), account);
    }

    pub fn remove_from_blacklist(env: Env, admin: Address, account: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can manage blacklist");
        env.storage()
            .instance()
            .remove(&DataKey::Blacklist(account.clone()));
        env.events()
            .publish((BLACKLIST_ADD, symbol_short!("rmv")), account);
    }

    pub fn is_blacklisted(env: Env, account: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Blacklist(account))
            .unwrap_or(false)
    }

    pub fn set_transfer_limit(env: Env, admin: Address, account: Address, limit: i128) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can set limits");
        assert!(limit > 0, "Limit must be positive");
        env.storage()
            .instance()
            .set(&DataKey::TransferLimit(account.clone()), &limit);
        env.events()
            .publish((LIMIT_SET, symbol_short!("addr")), (account, limit));
    }

    pub fn get_transfer_limit(env: Env, account: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TransferLimit(account))
            .unwrap_or(i128::MAX)
    }

    pub fn request_transfer_approval(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "Amount must be positive");
        env.storage()
            .instance()
            .set(&DataKey::PendingApprovals(from.clone(), to.clone()), &true);
        env.events()
            .publish((APPROVAL_REQ, symbol_short!("xfer")), (from, to, amount));
    }

    pub fn approve_transfer(env: Env, admin: Address, from: Address, to: Address) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can approve transfers");
        env.storage()
            .instance()
            .remove(&DataKey::PendingApprovals(from.clone(), to.clone()));
        env.events()
            .publish((APPROVAL_REQ, symbol_short!("appr")), (from, to));
    }

    pub fn is_transfer_approved(env: Env, from: Address, to: Address) -> bool {
        !env.storage()
            .instance()
            .get::<_, bool>(&DataKey::PendingApprovals(from, to))
            .unwrap_or(true)
    }

    // Vesting

    pub fn set_vesting(env: Env, admin: Address, account: Address, schedule: VestingSchedule) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can set vesting");
        assert!(schedule.total > 0, "Total must be positive");
        assert!(schedule.cliff_ledger >= schedule.start_ledger, "Cliff before start");
        assert!(schedule.end_ledger > schedule.cliff_ledger, "End before cliff");
        env.storage()
            .instance()
            .set(&DataKey::Vesting(account.clone()), &schedule);
        env.events()
            .publish((VESTING_SET, symbol_short!("set")), account);
    }

    pub fn get_vesting(env: Env, account: Address) -> Option<VestingSchedule> {
        env.storage()
            .instance()
            .get(&DataKey::Vesting(account))
    }

    pub fn vested_amount(env: Env, account: Address) -> i128 {
        let schedule: VestingSchedule = match env.storage().instance().get(&DataKey::Vesting(account)) {
            Some(s) => s,
            None => return 0,
        };
        let now = env.ledger().sequence();
        if now < schedule.cliff_ledger {
            return 0;
        }
        if now >= schedule.end_ledger {
            return schedule.total;
        }
        let elapsed = (now - schedule.start_ledger) as i128;
        let duration = (schedule.end_ledger - schedule.start_ledger) as i128;
        schedule.total * elapsed / duration
    }

    // Lock-up

    pub fn set_lockup(env: Env, admin: Address, account: Address, lockup: LockUp) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == stored_admin, "Only admin can set lockup");
        assert!(lockup.amount > 0, "Amount must be positive");
        env.storage()
            .instance()
            .set(&DataKey::LockUp(account.clone()), &lockup);
        env.events()
            .publish((LOCKUP_SET, symbol_short!("set")), account);
    }

    pub fn get_lockup(env: Env, account: Address) -> Option<LockUp> {
        env.storage()
            .instance()
            .get(&DataKey::LockUp(account))
    }

    pub fn is_locked(env: Env, account: Address) -> bool {
        let lockup: LockUp = match env.storage().instance().get(&DataKey::LockUp(account)) {
            Some(l) => l,
            None => return false,
        };
        env.ledger().sequence() < lockup.unlock_ledger
    }
}
