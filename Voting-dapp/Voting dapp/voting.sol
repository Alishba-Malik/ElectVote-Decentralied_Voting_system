// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Dv0TE{
    //data structure
    struct Candidate{
        string name;
        uint id;
        string party;
        uint voteCount;
    }
    //State Variables
    address public Owner;
    uint256 public CountCandidates;
    uint256 public votingStart;
    uint256 public votingEnd;
    //Mappings
    mapping(uint=> Candidate) public candidates;
    mapping(address=>bool) public voters;
    //Events
    event CandidateAdded(uint id, string name, string party);
    event voted(address indexed voter, uint CandidateID);
    event VotingDateset(uint StartDate, uint EndDate);
    //Modifiers
    modifier isOwner{
        require(msg.sender==Owner, "Only owner can perform this action.");
    _;
    }
    modifier votingActive{
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting is not active.");
        _;
    }
    //constructor
    constructor (){
        Owner = msg.sender ;
    }
    //functions
    // Admin only
    function addCandidate(string memory name, string memory party) public isOwner returns (uint) {
        require(bytes(name).length > 0, "Candidate Name cannot be empty.");
        require(bytes(party).length > 0, "Candidate's party name cannot be empty.");
        CountCandidates++;
        candidates[CountCandidates] = Candidate(name,CountCandidates, party, 0);

        emit CandidateAdded(CountCandidates,name, party);
        return CountCandidates;
    }
    // for public
    function vote(uint CandidateID) public votingActive{
        require(CandidateID > 0 && CandidateID <= CountCandidates, "Invalid Candidate ID.");
        require(!voters[msg.sender], "You have already voted.");
        voters[msg.sender] = true;
        candidates[CandidateID].voteCount++;

        emit voted(msg.sender, CandidateID);
    }
    function checkVote() public view returns(bool){
        return voters[msg.sender];
    }
//getCandidate
    function getCandidate(uint CandidateID) public view returns(string memory, uint, string memory, uint){
        require(CandidateID > 0 && CandidateID <= CountCandidates, "Invalid Candidate ID.");
        //candidate is a struct object
        Candidate memory candidate = candidates[CandidateID];
        return (candidate.name, candidate.id, candidate.party, candidate.voteCount);
    }
// setDates
    function setDates(uint256 _startDate, uint256 _endDate) public isOwner{
        require(votingStart == 0 && votingEnd == 0, "Voting Dates already set.");
        require(_startDate > block.timestamp, "Voting has not been started yet.");
        require(_endDate > _startDate, "End date must be after the start date.");

        votingStart = _startDate;
        votingEnd = _endDate;

        emit VotingDateset(votingStart, votingEnd);

    }
// getDates
    function getDates() public view returns(uint256, uint256){
        return (votingStart, votingEnd);
    }
// getWinner
    function getWinner() public view isOwner returns (string memory, string memory, uint) {
        require(block.timestamp > votingEnd, "Voting period is not over.");

        uint highestVotes = 0;
        uint winnerId = 0;

        for (uint i = 1; i <= CountCandidates; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }

        require(winnerId != 0, "No votes cast.");

        Candidate memory winner = candidates[winnerId];
        return (winner.name, winner.party, winner.voteCount);
    }

}