import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { CandidateAdded } from "../generated/schema"
import { CandidateAdded as CandidateAddedEvent } from "../generated/Vote/Vote"
import { handleCandidateAdded } from "../src/vote"
import { createCandidateAddedEvent } from "./vote-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let id = BigInt.fromI32(234)
    let name = "Example string value"
    let party = "Example string value"
    let newCandidateAddedEvent = createCandidateAddedEvent(id, name, party)
    handleCandidateAdded(newCandidateAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("CandidateAdded created and stored", () => {
    assert.entityCount("CandidateAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CandidateAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "name",
      "Example string value"
    )
    assert.fieldEquals(
      "CandidateAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "party",
      "Example string value"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
