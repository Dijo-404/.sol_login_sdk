pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

// Generate a per-app nullifier to prove uniqueness without revealing identity.
// Public: nullifier, appId
// Private: solDomainHash, userSecret
template SybilNullifier() {
    signal input solDomainHash;
    signal input userSecret;
    signal input appId;
    signal output nullifier;

    // nullifier = Poseidon(solDomainHash, userSecret, appId)
    // Same user cannot generate two different nullifiers for the same app
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== solDomainHash;
    poseidon.inputs[1] <== userSecret;
    poseidon.inputs[2] <== appId;
    nullifier <== poseidon.out;
}

component main {public [appId]} = SybilNullifier();
