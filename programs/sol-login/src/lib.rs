use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;

use instructions::*;

// REPLACE before deploy: run `anchor build && solana-keygen new -o target/deploy/sol_login-keypair.json`,
// then `solana address -k target/deploy/sol_login-keypair.json` and paste the resulting pubkey here.
// See docs/anchor-deploy.md for the full deployment workflow.
declare_id!("So1LoG1nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod sol_login {
    use super::*;

    /// Verify a Groth16 ZK proof and issue a credential PDA.
    pub fn verify_proof(
        ctx: Context<VerifyProof>,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_inputs: Vec<[u8; 32]>,
        proof_type: u8,
    ) -> Result<()> {
        instructions::verify_proof::handler(ctx, proof_a, proof_b, proof_c, public_inputs, proof_type)
    }

    /// Issue a verified credential to a wallet.
    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        credential_type: u8,
        threshold: Option<u32>,
    ) -> Result<()> {
        instructions::issue_credential::handler(ctx, credential_type, threshold)
    }
}
