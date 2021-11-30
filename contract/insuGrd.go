package main


import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)


func main(){ 
	err := shim.Start(new(InsuGrd))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}


// 체인코드 객체 정의
type InsuGrd struct { 
}

// diagHash - 월드스테이트에 저장할 진단서해시 구조체 
type DiagHash struct {
	ObjectType string `json:"docType"`
	IssuNum string `json:"issuNum"`
	Hash string `json:"hashVal"`
}

// commuLog - 월드스테이트에 저장할 송신 발생기록 구조체 정의
type Status struct { 
	ObjectType string `json:"docType"`
	IssuNum string `json:"issuNum"`
	TransStatus string `json:"sendstat"`
}

// Init
func (i *InsuGrd) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

// Invoke
func (i *InsuGrd) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
// 기능에 따라 분기
	function, args := APIstub.GetFunctionAndParameters()
	if function == "setDiagHash" {
		return i.setDiagHash(APIstub, args)
	} else if function == "getDiagHash" {
		return i.getDiagHash(APIstub, args)
	} else if function == "setStatus" { 
		return i.setStatus(APIstub, args)
	} else if function == "getStatus" {
		return i.getStatus(APIstub, args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}

// setDiagHash - 차트번호+연번호를 key로 하여 진단서 해시값(value) 저장
func (i *InsuGrd) setDiagHash(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	// args[0]: 차트번호 - ex) "1234"
	// args[1]: 연번호 - ex)"123"
	// args[2]: 해시값 - "50e721e49c013f00c62cf59f2163542a9d8df02464efeb615d31051b0fddc326"
	// issuNum: 차트번호+연번호 -> args[0] + args[1]

		if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
		}
	
	var objectType = "Diagnosis"
	myslice := []string{args[0], args[1]}
	var issuNum = strings.Join(myslice, "-")
	var diagHash = DiagHash{ObjectType: objectType, IssuNum: issuNum, Hash: args[2]} 
	diagHashJSONasBytes, _ := json.Marshal(diagHash)
	APIstub.PutState(objectType+issuNum, diagHashJSONasBytes)
	return shim.Success(nil)
}

//getDiagHash - 원장에서 key에 대응하는 value값 조회
func (i *InsuGrd) getDiagHash(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	var issuNum, jsonResp string
	var err error
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting number of the diagnosis to query")
	}
	
	var objectType = "Diagnosis"
	myslice := []string{args[0], args[1]}
	issuNum = strings.Join(myslice, "-")
	valAsbytes, err := APIstub.GetState(objectType+issuNum) 
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + issuNum + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"Diagnosis does not exist: " + issuNum + "\"}"
		return shim.Error(jsonResp)
	}
	return shim.Success(valAsbytes)
}


// setStatus - 발행번호(key)에 해당하는 송신기록(value)을 원장에 저장
func (i *InsuGrd) setStatus(APIstub shim.ChaincodeStubInterface, args [] string) sc.Response {
		if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
		}

	var objectType = "Status"
	myslice := []string{args[0], args[1]}
	var issuNum = strings.Join(myslice, "-")
	var status = Status{IssuNum: issuNum, TransStatus: "Sent"} 
	statusJSONasBytes, _ := json.Marshal(status)
	APIstub.PutState(objectType+issuNum, statusJSONasBytes)
	return shim.Success(nil)
}

// getStatus - 진단서 송신 발생 기록 조회
func (i *InsuGrd) getStatus(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	var issuNum, jsonResp string
	var err error
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting number of the diagnosis to query")
	}

	var objectType = "Status"
	myslice := []string{args[0], args[1]}
	issuNum = strings.Join(myslice, "-")
	valAsbytes, err := APIstub.GetState(objectType+issuNum) 
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + issuNum + "record \"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"Transmission record does not exist: " + issuNum + "\"}"
		return shim.Error(jsonResp)
	}
	return shim.Success(valAsbytes)
}
