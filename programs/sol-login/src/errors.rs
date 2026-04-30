use anchor_lang::prelude::*;

#[error_code]
pub enum SolLoginError {
    #[msg("Invalid ZK proof")]
    InvalidProof,
    #[msg("Proof type not supported")]
    UnsupportedProofType,
    #[msg("Credential already issued")]
    CredentialAlreadyIssued,
    #[msg("Unauthorized")]
    Unauthorized,
}
