#!/bin/bash

if [ $# -ne 2 ]; then
	echo "Arguments are missing. ex) ./cc_insu.sh instantiate 1.0.0"
	exit 1
fi

instruction=$1
version=$2

set -ev

#chaincode install
docker exec cli peer chaincode install -n insugrd -v $version -p github.com
#chaincode instatiate
docker exec cli peer chaincode $instruction -n insugrd -v $version -C mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member")'
sleep 5
#chaincode invoke 1231-231
docker exec cli peer chaincode invoke -n insugrd -C mychannel -c '{"Args":["setDiagHash","1231","231", "1sdf1wd1"]}'
sleep 5
#chaincode query 1231-231
docker exec cli peer chaincode query -n insugrd -C mychannel -c '{"Args":["getDiagHash","1231", "231"]}'
#chaincode invoke sent
docker exec cli peer chaincode invoke -n insugrd -C mychannel -c '{"Args":["setStatus","1231", "231"]}'
sleep 5
#chaincode invoke sent
docker exec cli peer chaincode query -n insugrd -C mychannel -c '{"Args":["getStatus","1231", "231"]}'
sleep 5

echo '-------------------------------------END-------------------------------------'
