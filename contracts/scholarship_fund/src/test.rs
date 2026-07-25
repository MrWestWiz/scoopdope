#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup() -> (Env, ScholarshipFundContractClient<'static>, Address) {
    let env    = Env::default();
    env.mock_all_auths();
    let id     = env.register(ScholarshipFundContract, ());
    let client = ScholarshipFundContractClient::new(&env, &id);
    let admin  = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn donate_increases_fund_balance() {
    let (_, client, _) = setup();
    let donor = Address::generate(&client.env);
    client.donate(&donor, &1_000_000);
    assert_eq!(client.get_fund_balance(), 1_000_000);
    assert_eq!(client.get_donor_total(&donor), 1_000_000);
}

#[test]
fn apply_and_approve_then_distribute() {
    let (_, client, admin) = setup();
    let donor   = Address::generate(&client.env);
    let student = Address::generate(&client.env);
    client.donate(&donor, &5_000_000);
    let app_id = client.apply_for_scholarship(&student, &1_000_000);
    client.approve_application(&admin, &app_id);
    let before = client.get_fund_balance();
    client.distribute_scholarship(&admin, &app_id);
    let after = client.get_fund_balance();
    assert_eq!(before - after, 1_000_000);
}

#[test]
fn reject_application_does_not_disburse() {
    let (_, client, admin) = setup();
    let donor   = Address::generate(&client.env);
    let student = Address::generate(&client.env);
    client.donate(&donor, &2_000_000);
    let app_id = client.apply_for_scholarship(&student, &500_000);
    client.reject_application(&admin, &app_id);
    assert_eq!(client.get_fund_balance(), 2_000_000);
}

#[test]
fn get_application_returns_correct_data() {
    let (_, client, _) = setup();
    let student = Address::generate(&client.env);
    let app_id  = client.apply_for_scholarship(&student, &750_000);
    let app     = client.get_application(&app_id).expect("application exists");
    assert_eq!(app.student, student);
    assert_eq!(app.amount_requested, 750_000);
    assert_eq!(app.status, 0); // pending
}

#[test]
#[should_panic]
fn distribute_before_approve_panics() {
    let (_, client, admin) = setup();
    let donor   = Address::generate(&client.env);
    let student = Address::generate(&client.env);
    client.donate(&donor, &2_000_000);
    let app_id = client.apply_for_scholarship(&student, &500_000);
    client.distribute_scholarship(&admin, &app_id); // not approved yet
}
