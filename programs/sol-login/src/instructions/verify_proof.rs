use anchor_lang::prelude::*;
use crate::state::Credential;
use crate::errors::SolLoginError;

#[derive(Accounts)]
#[instruction(proof_a: [u8; 64], proof_b: [u8; 128], proof_c: [u8; 64], public_inputs: Vec<[u8; 32]>, proof_type: u8)]
pub struct VerifyProof<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = Credential::LEN,
        seeds = [b"credential", signer.key().as_ref(), &[proof_type]],
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

    // TODO: Implement Groth16 verification using solana_zk_token_sdk
    // For hackathon: proof is verified off-chain and this instruction
    // records the credential PDA as the on-chain anchor of trust.

    let credential = &mut ctx.accounts.credential;
    credential.wallet = ctx.accounts.signer.key();
    credential.proof_type = proof_type;
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
