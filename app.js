var express = require('express');
var app = express();
var http    = require('http');
var jsalert=require('js-alert');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

app.set("view engine", "ejs");
console.log("Starting the fun..");
app.use(express.static(__dirname + "/public")); 
app.use(bodyParser.urlencoded({extended:true}));

/////////////////////////////////////////////

//////// to find the trader with id = 1 and find it's commodity Id
// var commodityId;

// var options = {
//     host: 'localhost',
//     port: 3200,
//     path: '/api/org.example.trading.Trader/a1',
//     method: 'GET'
// };

// var req=http.request(options,function(res){
//     console.log('STATUS: '+res.statusCode);
//     console.log('HEADERS: ' + JSON.stringify(res.headers));
//     res.on('data', function(chunk){
//         console.log('BODY: '+chunk);
//         var result = JSON.parse(chunk);
//         console.log(result);
//         var produce = result.produce[0];
//         var i = 0;
//         while(produce[i]!= '#') i++;
//         commodityId = produce.substr(i+1,4); //gives the commodityId
//         console.log('commodity id : ' + commodityId); 
//         options.path = `/api/org.example.trading.Commodity/${commodityId}`;
//         console.log(options.path);
//     });
// });

// req.on('error', (e) => {
//     console.error(`problem with request: ${e.message}`);
// });

// req.end();

////// Find the produce for the given comm Id


// var req=http.request(options,function(res){
//     console.log('STATUS: '+res.statusCode);
//     console.log('HEADERS: ' + JSON.stringify(res.headers));
//     res.on('data', function(chunk){
//         console.log('BODY: '+chunk);
//         var result = JSON.parse(chunk);
//         console.log(result);
//     });
// });

// req.on('error', (e) => {
//     console.error(`problem with request: ${e.message}`);
// });

// req.end();  

////////////////////////////////////////////

app.get('/', function(req,res){
    res.render('home');
});
app.get('/retailer/retailer_page', function(req,res){
    res.render('retailer_page');
});

app.get('/farmer/farmer_login', function(req,res){
    res.render('farmer_login');
});

app.get('/government/gov_login', function(req, res){
    res.render('gov_login');
});

app.post('/gov_page', function(req,res){
    res.render('gov_page');
});

//Add Token
app.post('/add_token', function(req, res){
    console.log(req.body);
    var numToken=req.body.numToken;
    var notificationMessage = "Added Token "+numToken;
    //console.log(req.body);
    var obj={
        "$class": "org.example.empty.addTokens",
        "government": "G1",
        "amount": numToken,
      }
      console.log(obj);
      fetch('http://localhost:3000/api/org.example.empty.addTokens/',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body:JSON.stringify(obj)
    }).then(response => {
        console.log("Added Token");
        return response.json();
    }).catch(err => {console.log(err);});

    //res.render('notificationPage',{notificationMessage:notificationMessage});
    res.render('gov_page');
});

//Adding a purchase
app.post('/retailer_page', function(req,res){
    console.log(req.body);
    var farmer_details = req.body;
    var UR="org.example.empty.Farmer#";
    var obj={
        "$class": "org.example.empty.purchase",
        "quantity": farmer_details.quantity,  
        "farmer": ""+UR+farmer_details.AadharId
    //"transactionId": "string",
    };
    //console.log(obj);
    fetch('http://localhost:3000/api/org.example.empty.purchase/',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body:JSON.stringify(obj)
    }).then(response => {
        //console.log("Added Purchase");
        return response.json();
    }).catch(err => {console.log(err);});

    //create a subsidy
    //GET THE CURRENT ARRAY INDEX FROM FARMER and create new unique subsidy id
    let farmer_info;
    var newIndex;
    var newSubsidyId;
    fetch(`http://localhost:3000/api/org.example.empty.Farmer/${farmer_details.AadharId}`)
    .then(function(response) {
        return response.json();
    }).then(function(myJson) {
        var get_farmer_info=myJson;
       // console.log(get_farmer_info);
        console.log(get_farmer_info.currArrayIndex);
        newIndex=get_farmer_info.currArrayIndex+1;
        newSubsidyId=farmer_details.AadharId+'.'+newIndex;
        console.log(newSubsidyId);
        return newSubsidyId;
    }).then((newSubsidyId) => {
         //Add new subsidy with new id created
        var obj1={
            "$class": "org.example.empty.Subsidy",
            "sid": newSubsidyId,
            "amount": farmer_details.quantity,
            "owner": "resource:org.example.empty.Government#G1"
        };
        console.log(obj1);
          fetch('http://localhost:3000/api/org.example.empty.Subsidy/',{
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body:JSON.stringify(obj1)
            }).then(response => {
                console.log("Added Subsidy");
                return obj1;
                //return response.json();
            }).then((obj1)=> {
                //Adding subsidy transfer transaction
                var obj2={
                    "$class": "org.example.empty.subsidyTransfer",
                    "farmer": farmer_details.AadharId,
                    "government": "G1",
                    "subsidy": newSubsidyId
                };
                fetch('http://localhost:3000/api/org.example.empty.subsidyTransfer/',{
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body:JSON.stringify(obj2)
                }).then(response => {
                    console.log("Transferred subsidy");
                    return response.json();
                }).catch(err => {console.log(err);});
            }).then(function(){
				fetch(`http://localhost:3000/api/org.example.empty.Farmer/${farmer_details.AadharId}`)
                .then(function(response) {
                    return response.json();
                }).then(function(myJson) {
                    const Nexmo = require('nexmo')
                    const nexmo = new Nexmo({
                    apiKey: '010ba075',
                    apiSecret: '6MHcx8MzNUIZYC9N'
                    })

                    const from = 'Nexmo'
                    const to = '918830618513'
                    const text = 'Hello from FSS! Fertilizer purchase successful from you Aadhar ID '+farmer_details.AadharId+'. Current subsidy balance: '+myJson.balance;

                    nexmo.message.sendSms(from, to, text)
                });
            	res.render('retailer_page.ejs',{success:true});
            }) 
            
            
            .catch(err => {console.log(err);});

         }).catch(error => console.log(error));
    
});



app.post('/bank/checkBalance', function(req,res){
    fetch(`http://localhost:3000/api/org.example.empty.Farmer/${req.body.aadhar}`)
  .then(function(response) {
    return response.json();
  })
//   .then(json => console.log(json))
  .then(function(myJson) {
    console.log(JSON.stringify(myJson));
    res.render('bank_page.ejs', {farmerData: myJson,balanceAvailable:true});
  });
});

app.post('/bank/redeem',async function(req,res){
    console.log("***********************"+req.body.id+"******************");
    var UR="resource:org.example.empty.Farmer#"
    let obj={
        "$class": "org.example.empty.redeem",
  "redeemAmount": req.body.amount,
  "farmer": UR+req.body.id};
    await console.log(obj);
    fetch('http://localhost:3000/api/org.example.empty.redeem/',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify(obj)})
  .then(function(response) {
    return response.json();
  })
//   .then(json => console.log(json))
  .then(function(myJson) {
    console.log(JSON.stringify(myJson));
    fetch(`http://localhost:3000/api/org.example.empty.Farmer/${req.body.id}`)
  .then(function(response) {
    return response.json();
  }).then(function(myJson){
    console.log(JSON.stringify(myJson));
    res.render('bank_page.ejs', {farmerData: myJson,balanceAvailable:true});
    });
  });
});


app.get('/bank/bank_page', function(req,res){
    res.render('bank_page',{balanceAvailable:false});
});

// app.get('/grant_subsidy', function(req, res){
//     var notificationMessage = 'Subsidy granted successfully!!';
//     res.render('notificationPage',{notificationMessage:notificationMessage});
// });

app.post('/farmer_login', function(req,res){
    res.render('farmer_page');
});

app.listen(3500, function(){
    console.log("Server is listening on 3500");
});
