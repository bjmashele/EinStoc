// const moment = require('moment');
// const database = require('../database');
// const evaluation = require('../evaluator/simulate.js');
// const PreProcess = require('../mlas/preprocess.js');
// const sampleData = require('../mlas/sampleData/aapl6.js').data;
// const Promise = require('../node_modules/bluebird');
// //----------------algorithms------------------
// const Neighbors = require('../mlas/MLs/knn.js');
// const SupportVector = require('../mlas/MLs/svm.js');
// const Forest = require('../mlas/MLs/rf.js');
// const Logistic = require('../mlas/MLs/logistic.js');
const NaiveBayes = require('../mlas/MLs/nb.js');
//--------------neural networks----------------
const NNA1 = require('../mlas/synaptic/synapticAlg1.js');
//--------------------------------------------
let predictions;
var algorithmInstance;


module.exports = function(app) {


  app.post('/api/user', (req, res) => {

    console.log('requested user: ', req.body.userId);
    database.User.findAll({
      where: {
        userId: req.body.userId
      }
    })
    .then((data) => {
      if(data[0]) {
        res.send(data[0]);
      } else {
        database.User.create({
          userId: req.body.userId
        })
        .then(data => {
          res.send(data);
        });
      }
    });
  });

  app.get('/api/data', (req, res) => { // <-- get all simulations created by this user
    database.Simulation.findAll({
      where: {
        UserUserId: req.query.userId
      }
    })
    .then(function(userData) {
      res.send(userData);
    });
  });

  app.post('/api/data', (req, res) => {
    function dateFormat(dateOriginal) {
      var date = new Date(dateOriginal);
      date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return date;
    }

    if (req.body.algorithm === 'Neighbors') {
      algorithmInstance = new Neighbors(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'Forest') {
      algorithmInstance = new Forest(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'Logistic') {
      algorithmInstance = new Logistic(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'Support Vectors') {
      algorithmInstance = new SupportVector(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    } else if (req.body.algorithm === 'Naive Bayes') {
      algorithmInstance = new NaiveBayes(dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker);
    }

    if (req.body.algorithm === 'Neighbors' || req.body.algorithm === 'Forest' || req.body.algorithm === 'Logistic' || req.body.algorithm === 'Support Vectors' || req.body.algorithm === 'Naive Bayes') {
      algorithmInstance.preProcess()
        .then(function() {
          algorithmInstance.train();
        })
        .then(function() {
          algorithmInstance.predict();
        })
        .then(function() {
          return evaluation('d', dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker, algorithmInstance.predictions);
        })
        .then((result) => {
          return database.Simulation.create({ //<------ save in database
            UserUserId: req.userId,
            algorithm: req.body.algorithm,
            frequency: result.frequency,
            startDate: result.startDate,
            endDate: result.endDate,
            tickerSymbol: result.tickerSymbol,
            successRate: result.successRate,
            inclusionError: result.inclusionError,
            exclusionError: result.exclusionError,
            avgReturn: result.avgReturn,
            cummuReturn: result.cummuReturn,
            returnStd: result.returnStd,
            sharpeRatio: result.sharpeRatio,
            benchmarkReturnSelf: result.benchmarkReturnSelf,
            benchmarkReturnMarket: result.benchmarkReturnMarket,
            predictedMoves: result.predictedMoves,
            actualMoves: result.actualMoves,
            totalAssetValues: result.totalAssetValues,
            benchmarkAssetValuesSelf: result.benchmarkAssetValuesSelf,
            benchmarkAssetValuesMarket: result.benchmarkAssetValuesMarket,
            returns: result.returns,
            cashPosition: result.cashPosition,
            stockSharesOwned: result.stockSharesOwned
          });
        })
        .then(result => {
          res.send(result);
        });
      }

//     if (req.body.algorithm === 'Neural Net 1') {
// console.log('neural net');
// console.log(req.body.ticker, dateFormat(req.body.startDate), dateFormat(req.body.endDate));
//       NNA1('AAPL','2016-01-01', '2016-01-10')
//         .then(function(result) {console.log('result', result);})
      // NNA1(req.body.ticker, dateFormat(req.body.startDate), dateFormat(req.body.endDate))
        // .then(function(result) {
        //   return evaluation('d', dateFormat(req.body.startDate), dateFormat(req.body.endDate), req.body.ticker, result);
        // })
        // .then((result) => {
        //   return database.Simulation.create({ //<------ save in database
        //     UserUserId: req.userId,
        //     algorithm: req.body.algorithm,
        //     frequency: result.frequency,
        //     startDate: result.startDate,
        //     endDate: result.endDate,
        //     tickerSymbol: result.tickerSymbol,
        //     successRate: result.successRate,
        //     inclusionError: result.inclusionError,
        //     exclusionError: result.exclusionError,
        //     avgReturn: result.avgReturn,
        //     cummuReturn: result.cummuReturn,
        //     returnStd: result.returnStd,
        //     sharpeRatio: result.sharpeRatio,
        //     benchmarkReturnSelf: result.benchmarkReturnSelf,
        //     benchmarkReturnMarket: result.benchmarkReturnMarket,
        //     predictedMoves: result.predictedMoves,
        //     actualMoves: result.actualMoves,
        //     totalAssetValues: result.totalAssetValues,
        //     benchmarkAssetValuesSelf: result.benchmarkAssetValuesSelf,
        //     benchmarkAssetValuesMarket: result.benchmarkAssetValuesMarket,
        //     returns: result.returns,
        //     cashPosition: result.cashPosition,
        //     stockSharesOwned: result.stockSharesOwned
        //   });
        // })
        // .then(result => {
        //   res.send(result);
        // })
    //     .error(err => console.log('err', err));
    // }
  });

};