
(function($,Hammer){
  
  var hammerEventsTest = /^(tap|doubletap|swipe|rotate|p(an|inch|ress))\w*/;
  
  var dataHammerKey = '$.MinJqHammer';
  var proto = $.fnEvent;
  var originalOn = proto.on;
  var originalOff = proto.off;
  
  
  proto.hammer = function(recoginizer, config){
    var ham = this.data(dataHammerKey);
    if( !recoginizer ) return ham;
    if( !ham ){
      var createConfig = $.isObj(recoginizer)? recoginizer : {};
      ham = new Hammer( this, createConfig );
      this.data(dataHammerKey, ham);
    }
    if( $.isString(recoginizer) && $.isObj(config) ){
      ham.get(recoginizer).set(config);
    }
    return this;
  };
  proto.on = function(event, callback, useCapture){
    var newCall = callback;
    if( hammerEventsTest.test(event) ){
      if( !this.data(dataHammerKey) ) this.hammer(true);
      var ham = this.data(dataHammerKey);
      newCall = callback.bind($(this));
      $.putCallback(this, event, callback, newCall);
      ham.on(event, newCall);
    }else{
      return originalOn.apply(this, arguments);
    }
    return proto.off.bind(this, event, newCall, useCapture);
  };
  proto.off = function(event, callback, useCapture){
    if( hammerEventsTest.test(event) ){
      if( !this.data(dataHammerKey) ) this.hammer(true);
      var ham = this.data(dataHammerKey);
      var newCall = $.getCallback(this, event, callback);
      $.removeCallback(this, event, callback);
      return ham.off(event, newCall);
    }else{
      return originalOff.apply(this, arguments);
    }
  };
  
  proto.bind = proto.on;
  proto.unbind = proto.off;
  
  $._normalElementCall('hammer', $.MODE_MIX_GETTER_FIRST, null);
  
  $.blockProperties();
})($$,Hammer);
