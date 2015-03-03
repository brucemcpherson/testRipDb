"use strict";


// get some abstraction handlers
var store = PropertiesService.getUserProperties();


  
function tall() {
  
  
  var handlers = [
    new cDbAbstraction.DbAbstraction ( cDriverMongoLab , {
      siloid:'dbtest',
      dbid:'xliberation',
      driverob:JSON.parse(store.getProperty("mongoLabKeys"))
    }),
    new cDbAbstraction.DbAbstraction ( cDriverParse , {
      siloid:'dbtest',
      dbid:'ripdb',
      driverob:JSON.parse(store.getProperty("parseKeys"))
    }),
    new cDbAbstraction.DbAbstraction ( cDriverScratch , {
      siloid:'dbtest',
      dbid:'ripdb'
    }),
    new cDbAbstraction.DbAbstraction ( cDriverDrive , {
      siloid:'dbtest.json',
      dbid:'/'
    }),
    new cDbAbstraction.DbAbstraction ( cDriverMemory , {
      siloid:'dbtest',
      dbid:'ripdb'
    }),
    new cDbAbstraction.DbAbstraction ( cDriverFusion , {
      siloid:'1FWdacf1G7QGdFvJZdHfn7hoPpbKd3QgspXYxeMOW',
      dbid:'doodle'
    }),
    new cDbAbstraction.DbAbstraction ( cDriverOrchestrate , {
      siloid:'dbtest',
      dbid:'xliberation',
      driverob: JSON.parse(store.getProperty("orchestrateKeys")),
      waitafter:2000
    })
  ];

// -- need this hack provoke fusion auth dialog  
//FusionTables.Query.sqlGet
//FusionTables.Table.insert

  
  currentTest = [];
  
  handlers.forEach (function(d) {
    if(!currentTest.length || currentTest.indexOf(d.getDBName()) !== -1) { 
      test(d);
    }
  });
  
}

function test (handler) {

  assert ( handler.isHappy() , null, "got handler");
  Logger.log('starting ' + handler.getDBName());
  
  // simulate a scriptDB
  var db = new cRipDB.RipDB(handler);
  
  // do the whole thing in a transaction
  //var t = handler.transaction(function(hob) {
  
    // clear existing data
    resultAssert ( handler.remove(), "removing all data");
  
    var m1 = mapAssert(db.save({name:"fred",age:21}), "saving"); 
    var m2 = mapAssert(db.save({name:"mary",age:55}), "saving");
    var m3 = mapAssert(db.save({name:"john",age:34}), "saving");
    var m4 = mapAssert(db.save({name:"fred",age:33}), "saving");
    
    Logger.log('this is m4:'+m4.toJson());
    Logger.log('this is m4id:'+m4.getId());
     
    assert ( db.allOk(db.saveBatch([
        {name:'john',age:37,batch:true},
        {name:'john',age:35,batch:true},
        {name:'john',age:36,batch:true}
      ])),null,"save batch");
     
   
    // load then all by  id
    mapAssert ( db.load ([
      m3.getId(),
      m2.getId(),
      m1.getId()
    ]),"loading by ids");

    Logger.log(mapAssert ( db.load ([
      m4.getId(),
      m1.getId()
    ]),"2ndloading by ids").map(function(d) { return d.toJson();}));;
    
    // do some queries
    dbResultAssert (db.query({name:db.anyOf(['harry','fred'])}).sortBy("name",db.ASCENDING),"q1");
    dbResultAssert (db.query({name:db.anyValue()}).sortBy("name",db.ASCENDING),"q2");
    dbResultAssert (db.query({age:db.between(20,22)}).sortBy("name",db.ASCENDING),"q3");
    dbResultAssert (db.query({age:db.greaterThanOrEqualTo(21),name:db.lessThanOrEqualTo("john")}).sortBy("name",db.ASCENDING),"q4");
    dbResultAssert (db.query({age:db.not(21),name:db.lessThanOrEqualTo("john")}).sortBy("name",db.ASCENDING),"q5");

    
    // delete a lot
    assert ( db.removeByIdBatch([
      m1.getId(),
      m4.getId()
    ]),null,"remove by id");

    
    Logger.log('total count before mary delete'  + db.count());
    
    // get rid of the marys
    var result = dbResultAssert (db.query({name:"mary"}),"m1");
    
    while (result.hasNext()) {
      db.remove(result.next());
    }
  
    Logger.log('total count after remove'  + db.count());
    Logger.log('john count'  + db.count({name:"john"}));
    
  
    // at the end we should only have johns
    var result = resultAssert(db.getHandler().count(),"c1");
    var john = resultAssert(db.getHandler().count({name:"john"}),"c2");
    
    assert (result.data[0].count === john.data[0].count, result, "cm") ;
    
    // update all of the johns to updated
    var result = dbResultAssert (db.query({name:"john"}),"m2");
    while (result.hasNext()) {
      var d = result.next();
      d.updated = new Date().getTime();
      d.changed = "janet";
      db.save(d);
    }
    
    assert ( db.count({changed:"janet"}) === db.count({name:"john"}),null,"janet and johns");

    
    //return hob.allDone();
  //});
  
  //assert (t.transaction.code >=0, t,"t1");

};

function copyKeys() {
  PropertiesService.getUserProperties().setProperty("parseKeys", UserProperties.getProperty("parseKeys"));
  PropertiesService.getUserProperties().setProperty("mongoLabKeys", UserProperties.getProperty("mongoLabKeys"));
  PropertiesService.getUserProperties().setProperty("orchestrateKeys", UserProperties.getProperty("orchestrateKeys"));
}

function assert (what,message,n) {
  var fatal = true;
  if (!Array.isArray(what)) what = [what];
  var good = what.every(function(d) { return d });
  var m = ('time:' + new Date().getTime() + ':assertion:' + n + (good ? ':success':':failure:'+JSON.stringify({message:message,tests:what})));
  if (cUseful.isObject(message) && Array.isArray(message.data)) {
    m+= ":(" + message.data.length + "):code: " + message.handleCode;
  }
  Logger.log(m);
  if (!good && fatal) {
    throw m;
  }
  return message;
}


function resultAssert (result,msg) {
    return assert (result.handleCode >=0 , result,msg );
}

function mapAssert (result,msg) {
    var rap = Array.isArray(result) ? result : [result];
    assert (rap.every(function(d) { return d.isGood() }) , rap[0] , msg);
    return result;
}
function dbResultAssert (result,msg) {
    var rap = Array.isArray(result) ? result : [result];
    assert (rap.every(function(d) { return d.isGood() }) , rap[0].getResult() , msg);
    return result;
}