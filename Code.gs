

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
