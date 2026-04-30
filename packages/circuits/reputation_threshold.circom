pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

// Prove that reputationScore >= threshold without revealing the score.
// Public: threshold, commitment
// Private: reputationScore, salt
template ReputationThreshold() {
    signal input reputationScore;
    signal input salt;
    signal input threshold;
    signal input commitment;

    // Assert score >= threshold
    component gte = GreaterEqThan(10);
    gte.in[0] <== reputationScore;
    gte.in[1] <== threshold;
    gte.out === 1;

    // Bind to commitment: commitment = Poseidon(reputationScore, salt)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== reputationScore;
    poseidon.inputs[1] <== salt;
    poseidon.out === commitment;
}

component main {public [threshold, commitment]} = ReputationThreshold();
