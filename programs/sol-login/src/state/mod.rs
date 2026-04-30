use anchor_lang::prelude::*;

/// PDA storing a verified ZK credential for a wallet.
#[account]
pub struct Credential {
    pub wallet: Pubkey,
    pub proof_type: u8,          // 0=reputation, 1=wallet_age, 2=sybil, 3=social
    pub threshold: Option<u32>,
    pub verified_at: i64,
    pub bump: u8,
}

impl Credential {
    pub const LEN: usize = 8 + 32 + 1 + 5 + 8 + 1;
}

/// PDA storing an identity record (wallet ↔ .sol mapping).
#[account]
pub struct IdentityRecord {
    pub wallet: Pubkey,
    pub domain_hash: [u8; 32],
    pub registered_at: i64,
    pub bump: u8,
}

impl IdentityRecord {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}
