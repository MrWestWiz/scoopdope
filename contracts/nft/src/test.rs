#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, symbol_short, Address, Env, String};

fn setup() -> (Env, NFTContractClient<'static>, Address) {
    let env    = Env::default();
    env.mock_all_auths();
    let id     = env.register(NFTContract, ());
    let client = NFTContractClient::new(&env, &id);
    let admin  = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn mint_course_nft_assigns_owner() {
    let (env, client, admin) = setup();
    let student    = Address::generate(&env);
    let instructor = Address::generate(&env);
    let nft_id = client.mint_course_nft(
        &admin, &student, &instructor,
        &symbol_short!("course1"),
        &String::from_str(&env, "Stellar 101"),
        &1_000_000i128,
        &500u32,
    );
    assert_eq!(client.get_nft_owner(&nft_id), Some(student));
}

#[test]
fn get_nft_metadata_returns_correct_fields() {
    let (env, client, admin) = setup();
    let student    = Address::generate(&env);
    let instructor = Address::generate(&env);
    let nft_id = client.mint_course_nft(
        &admin, &student, &instructor,
        &symbol_short!("course2"),
        &String::from_str(&env, "DeFi Basics"),
        &500_000i128,
        &300u32,
    );
    let meta = client.get_nft_metadata(&nft_id).expect("metadata exists");
    assert_eq!(meta.course_id, symbol_short!("course2"));
    assert_eq!(meta.royalty_basis, 300);
}

#[test]
fn grant_and_revoke_access_works() {
    let (env, client, admin) = setup();
    let student    = Address::generate(&env);
    let instructor = Address::generate(&env);
    let viewer     = Address::generate(&env);
    let nft_id = client.mint_course_nft(
        &admin, &student, &instructor,
        &symbol_short!("c3"), &String::from_str(&env, "C3"),
        &100_000i128, &200u32,
    );
    client.grant_access(&student, &nft_id, &viewer);
    assert!(client.has_access(&nft_id, &viewer));
    client.revoke_access(&student, &nft_id, &viewer);
    assert!(!client.has_access(&nft_id, &viewer));
}

#[test]
fn get_owner_nfts_returns_all_minted_for_owner() {
    let (env, client, admin) = setup();
    let student    = Address::generate(&env);
    let instructor = Address::generate(&env);
    client.mint_course_nft(&admin, &student, &instructor, &symbol_short!("c1"), &String::from_str(&env, "C1"), &100_000i128, &200u32);
    client.mint_course_nft(&admin, &student, &instructor, &symbol_short!("c2"), &String::from_str(&env, "C2"), &200_000i128, &200u32);
    assert_eq!(client.get_owner_nfts(&student).len(), 2);
}
