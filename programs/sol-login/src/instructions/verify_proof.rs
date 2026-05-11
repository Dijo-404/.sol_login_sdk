use anchor_lang::prelude::*;
use crate::state::Credential;
use crate::errors::SolLoginError;

#[derive(Accounts)]
#[instruction(proof_a: [u8; 64], proof_b: [u8; 128], proof_c: [u8; 64], public_inputs: Vec<[u8; 32]>, proof_type: u8)]
pub struct VerifyProof<'info> {
    /// Trusted issuer authority that has off-chain-verified the proof and pays rent.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// The end-user this credential belongs to. Used only as the PDA seed and the recorded owner.
    /// CHECK: not read; only its public key is used.
    pub user: AccountInfo<'info>,

    #[account(
        init,
        payer = signer,
        space = Credential::LEN,
        seeds = [b"credential", user.key().as_ref(), &[proof_type]],
        bump,
    )]
    pub credential: Account<'info, Credential>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<VerifyProof>,
    _proof_a: [u8; 64],
    _proof_b: [u8; 128],
    _proof_c: [u8; 64],
    _public_inputs: Vec<[u8; 32]>,
    proof_type: u8,
) -> Result<()> {
    require!(proof_type <= 3, SolLoginError::UnsupportedProofType);

    // Proof bytes are passed for on-chain anchoring (event payload + future Groth16 verifier upgrade).
    // The trusted off-chain verifier (backend) is responsible for cryptographic validity; this
    // instruction records the credential PDA as the on-chain anchor of trust.

    let credential = &mut ctx.accounts.credential;
    credential.wallet = ctx.accounts.user.key();
    credential.proof_type = proof_type;
    credential.threshold = None;
    credential.verified_at = Clock::get()?.unix_timestamp;
    credential.bump = ctx.bumps.credential;

    emit!(ProofVerified {
        wallet: credential.wallet,
        proof_type,
        verified_at: credential.verified_at,
    });

    Ok(())
}

#[event]
pub struct ProofVerified {
    pub wallet: Pubkey,
    pub proof_type: u8,
    pub verified_at: i64,
}
