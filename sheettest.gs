const testSheet = () => {

  // make a copy of the sheet to play with
  const test = makeCopy()

  const handler = new cDbAbstraction.DbAbstraction(cDriverSheet, {
    siloid: test.getSheet().getName(),
    dbid: test.getSheet().getParent().getId(),
    optout: true
  });

  assert ( handler.isHappy() , null, "got handler");
  Logger.log('starting ' + handler.getDBName());

  let result = handler.query()
  assert(result.data.length === test.getNumRows(), null , "all data is there" )

  result = handler.query ({iso_country: 'CA'})
  assert(result.data.length ===test.getData().filter(f=>f.iso_country === 'CA').length, result.data.length, 'query works' )

  result = handler.query ({iso_country: 'CA'}, null , 0 , true)
  assert(result.data.length ===test.getData().filter(f=>f.iso_country === 'CA').length, result.data.length, 'query works' )
  const { driverIds, handleKeys } = result
  assert(result.data.length === driverIds.length, result.data.length, 'right number of driverIds' )
  assert(driverIds.every(f=>test.getData()[f.row-1].iso_country === 'CA'), null, 'driverids match')
  assert(result.data.length === handleKeys.length, result.data.length, 'right number of handleKeys' )

  // do an update
  const update =   handler.update(result.handleKeys, result.data.map(f=>({
    ...f,
    iso_country:'xx'
  })))
  assert(update.data.length === result.data.length, update.data.length, 'update works' )
  assert(result.data.length === handleKeys.length, result.data.length, 'right number of handleKeys' )
  
  // check it happened
  const check = handler.query ({iso_country: 'xx'})
  assert(check.data.length === result.data.length, result.data.length, 'update query checked' )

  // john test
  var r = handler.query ({iso_country:'xx'},undefined,1,true);
  if (r.handleCode < 0) throw r.handleError;
  var result2 = handler.update( r.handleKeys, r.data.map (function(d) {d.timestamp = 'TEST'; return d; }));
  if (result2.handleCode < 0) throw result2.handleError;


}
const makeCopy = () => {

  //make a copy of the sheet
  const fiddler  = bmPreFiddler.PreFiddler()
    .getFiddler({ 
      id: '1h9IGIShgVBVUrUjjawk5MaCEQte_7t32XeEP1Z5jXKQ', 
      sheetName: 'airport list'
    })

  const copy = bmPreFiddler.PreFiddler()
    .getFiddler({ 
      id: fiddler.getSheet().getParent().getId(), 
      sheetName: 'db check',
      createIfMissing: true
    })
  
  copy.setData(fiddler.getData()).dumpValues()
  return copy
}