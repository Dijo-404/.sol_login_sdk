pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

// Prove that wallet is at least minAgeSeconds old without revealing first tx timestamp.
// Public: minAgeSeconds, currentTimestamp, commitment
// Private: firstTxTimestamp, salt
template WalletAge() {
    signal input firstTxTimestamp;
    signal input salt;
    signal input minAgeSeconds;
    signal input currentTimestamp;
    signal input commitment;

    // age = currentTimestamp - firstTxTimestamp
    signal age;
    age <== currentTimestamp - firstTxTimestamp;

    // Assert age >= minAgeSeconds
    component gte = GreaterEqThan(32);
    gte.in[0] <== age;
    gte.in[1] <== minAgeSeconds;
    gte.out === 1;

    // Bind to commitment
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== firstTxTimestamp;
    poseidon.inputs[1] <== salt;
    poseidon.out === commitment;
}

component main {public [minAgeSeconds, currentTimestamp, commitment]} = WalletAge();
