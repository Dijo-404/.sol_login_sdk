pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

// Prove ownership of a social account without revealing the handle.
// Public: socialCommitment, platformId
// Private: socialHandleHash, walletHash, salt
template SocialOwnership() {
    signal input socialHandleHash;
    signal input walletHash;
    signal input salt;
    signal input platformId;
    signal input socialCommitment;

    // socialCommitment = Poseidon(socialHandleHash, walletHash, salt, platformId)
    component poseidon = Poseidon(4);
    poseidon.inputs[0] <== socialHandleHash;
    poseidon.inputs[1] <== walletHash;
    poseidon.inputs[2] <== salt;
    poseidon.inputs[3] <== platformId;
    poseidon.out === socialCommitment;
}

component main {public [socialCommitment, platformId]} = SocialOwnership();
