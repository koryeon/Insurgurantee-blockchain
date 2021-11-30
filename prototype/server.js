// ExpressJS Setup
const express = require('express');
const app = express();

// Hyperledger Bridge
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', 'network' ,'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const crypto = require('crypto');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// use static file
app.use(express.static(path.join(__dirname, 'views')));

// configure app to use body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// main page routing
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/views/main.html');
})

async function cc_call(fn_name, args){
    
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);

    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('insugrd');

    var result;
    
    if(fn_name == 'setStatus')
    {
        c=args[0]; // 차트번호(병록번호)
        s=args[1]; // 연번호
        result = await contract.submitTransaction('setStatus', c, s);
    }
    else if(fn_name == 'getStatus')
    {
        c=args[0]; // 차트번호(병록번호)
        s=args[1]; // 연번호
        result = await contract.evaluateTransaction('getStatus', c, s);
    }
    else if(fn_name == 'setDiagHash')
    {
        c=args[0]; // 차트번호(병록번호)
        s=args[1]; // 연번호
        h=args[2] // 진단서 해시값
        result = await contract.submitTransaction('setDiagHash', c, s, h);
    }
    else if(fn_name == 'getDiagHash')
    {
        c=args[0]; // 차트번호(병록번호)
        s=args[1]; // 연번호
        result = await contract.evaluateTransaction('getDiagHash', c, s);
    }
    else
        result = 'not supported function'

    return result;
}

// setDiagHash - 진단서 해시 저장(병원)
app.post('/hosp', async(req, res)=>{
    const chart = req.body.chart;
    const serial = req.body.serial;
    const name = req.body.name;
    const birthdate = req.body.birthdate;
    const disecode = req.body.disecode;
    const doc_name = req.body.doc_name;
    const secret = chart + serial + name + birthdate + disecode + doc_name;
    const hash = crypto.createHash('sha256').update(secret).digest('hex');
    
    console.log("add diagnosis : " + chart + "-" + serial);

    var args = [chart, serial, hash]
    try {
        await cc_call('setDiagHash', args)
        const myobj = {result: "success"}
        res.status(200).json(myobj)
    } catch(err) {
        console.log(err)
        const myobj = {result: "falied"}
        res.status(200).json(myobj)
    }
})

// setStatus - 진단서 송신 및 송신 내역 저장(병원)
app.post('/send', async(req, res)=>{
    const chart = req.body.chart;
    const serial = req.body.serial;
    
    console.log("send diagnosis : " + chart + "-" + serial);

    var args = [chart, serial]
    try {
        await cc_call('setStatus', args)
        const myobj = {result: "success"}
        res.status(200).json(myobj)
    } catch(err) {
        console.log(err)
        const myobj = {result: "falied"}
        res.status(200).json(myobj)
    }
})

// getStatus - 진단서 송신 여부 확인(보험사)
app.post('/get', async(req, res)=>{
    const chart = req.body.chart;
    const serial = req.body.serial;

    console.log("check transmission : " + chart + "-" + serial);

    var args=[chart, serial];
    try {
        test = await cc_call('getStatus', args)
        getStatus = JSON.parse(test).sendstat
        const myobj = {result: "success", sendstat: getStatus}
        res.status(200).json(myobj)
    } catch(err) {
        console.log(err)
        const myobj = {result: "falied"}
        res.status(200).json(myobj)
    }
})

// getDiagHash - 진단서 해시 및 위조 여부 판별(보험사)
app.post('/insu', async(req, res)=>{
    const chart = req.body.chart;
    const serial = req.body.serial;
    const name = req.body.name;
    const birthdate = req.body.birthdate;
    const disecode = req.body.disecode;
    const doc_name = req.body.doc_name;
    const secret = chart + serial + name + birthdate + disecode + doc_name;
    const hash = crypto.createHash('sha256').update(secret).digest('hex');

    console.log("query diagnosis : " + chart + "-" + serial);

    var args=[chart, serial];
    try {
        test = await cc_call('getDiagHash', args)
        getHash = JSON.parse(test).hashVal
        const myobj = {result: "success", insuHash: hash, hospHash: getHash}
        console.log(myobj)
        res.status(200).json(myobj)
    } catch(err) {
        console.log(err)
        const myobj = {result: "falied"}
        res.status(200).json(myobj)
    }
})

// server start
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);