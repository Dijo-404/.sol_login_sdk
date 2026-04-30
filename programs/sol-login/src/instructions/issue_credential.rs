use anchor_lang::prelude::*;
use crate::state::Credential;

#[derive(Accounts)]
#[instruction(credential_type: u8, threshold: Option<u32>)]
pub struct IssueCredential<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Credential::LEN,
        seeds = [b"credential", authority.key().as_ref(), &[credential_type]],
        bump,
    )]
    pub credential: Account<'info, Credential>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<IssueCredential>,
    credential_type: u8,
    threshold: Option<u32>,
) -> Result<()> {
    let credential = &mut ctx.accounts.credential;
    credential.wallet = ctx.accounts.authority.key();
    credential.proof_type = credential_type;
    credential.threshold = threshold;
    credential.verified_at = Clock::get()?.unix_timestamp;
    credential.bump = ctx.bumps.credential;
    Ok(())
}
