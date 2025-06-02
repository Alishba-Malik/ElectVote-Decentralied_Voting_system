import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  CandidateAdded,
  Delegated,
  OwnershipTransferStarted,
  OwnershipTransferred,
  Paused,
  Voted,
  VotingDatesSet
} from "../generated/Vote/Vote"

export function createCandidateAddedEvent(
  id: BigInt,
  name: string,
  party: string
): CandidateAdded {
  let candidateAddedEvent = changetype<CandidateAdded>(newMockEvent())

  candidateAddedEvent.parameters = new Array()

  candidateAddedEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  candidateAddedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  candidateAddedEvent.parameters.push(
    new ethereum.EventParam("party", ethereum.Value.fromString(party))
  )

  return candidateAddedEvent
}

export function createDelegatedEvent(from: Address, to: Address): Delegated {
  let delegatedEvent = changetype<Delegated>(newMockEvent())

  delegatedEvent.parameters = new Array()

  delegatedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  delegatedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return delegatedEvent
}

export function createOwnershipTransferStartedEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferStarted {
  let ownershipTransferStartedEvent =
    changetype<OwnershipTransferStarted>(newMockEvent())

  ownershipTransferStartedEvent.parameters = new Array()

  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferStartedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferStartedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(isPaused: boolean): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("isPaused", ethereum.Value.fromBoolean(isPaused))
  )

  return pausedEvent
}

export function createVotedEvent(voter: Address, candidateID: BigInt): Voted {
  let votedEvent = changetype<Voted>(newMockEvent())

  votedEvent.parameters = new Array()

  votedEvent.parameters.push(
    new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter))
  )
  votedEvent.parameters.push(
    new ethereum.EventParam(
      "candidateID",
      ethereum.Value.fromUnsignedBigInt(candidateID)
    )
  )

  return votedEvent
}

export function createVotingDatesSetEvent(
  startDate: BigInt,
  endDate: BigInt
): VotingDatesSet {
  let votingDatesSetEvent = changetype<VotingDatesSet>(newMockEvent())

  votingDatesSetEvent.parameters = new Array()

  votingDatesSetEvent.parameters.push(
    new ethereum.EventParam(
      "startDate",
      ethereum.Value.fromUnsignedBigInt(startDate)
    )
  )
  votingDatesSetEvent.parameters.push(
    new ethereum.EventParam(
      "endDate",
      ethereum.Value.fromUnsignedBigInt(endDate)
    )
  )

  return votingDatesSetEvent
}
