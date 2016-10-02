
(function (window, document) {
  
  //===========================================================================
  //          Polyfills
  
  // Array.isArray: como no site da MDN (Mozilla)
  function _isClass(arg, strKlass){
    return Object.prototype.toString.call(arg) === strKlass;
  }
  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return _isClass(arg,'[object Array]');
    };
  }
  
  
  
  //===========================================================================
  //          Function prototype
  
  var FunctionProto = window.Function.prototype;
  if( !FunctionProto.bind ) FunctionProto.bind = function(that){
    var me = this, arr = Array.prototype.slice(arguments,1);
    return function(){
      return me.apply( that, arr );
    };
  };
  
  
  
  
  
  
  //===========================================================================
  //          EventTarget prototype
  
  var onCallbacksKey = 'onCallbacks';
  
  // EventTarget para a maioria dos navegadores
  // Node para o IE!
  var EventTypeProto = (window.EventTarget || window.Node).prototype;
  EventTypeProto.off = function (eventName, callback, useCapture) {
    var newCallback = callback;
    if( $.isElement(this) ){
      var data = this.data(onCallbacksKey);
      var key = eventName + useCapture;
      if( !data || !data[key] ) return null;
      var i = 0, found = false;
      for(; i < data[key].from.length; i++){
        if( data[key].from[i] === callback ){
          found = true;
          data[key].from.splice(i,1);
          break;
        }
      }
      if( !found ) return null;
      newCallback = data[key].to[i];
      data[key].to.splice(i,1);
      this.data(onCallbacksKey, data);
    }
    return this.removeEventListener(eventName, newCallback, useCapture);
  };
  EventTypeProto.on = function (eventName, callback, useCapture) {
    var newCallback = callback;
    if( $.isElement(this) ){
      newCallback = callback.bind( $(this) );
      var data = this.data(onCallbacksKey);
      if( !data ) data = {};
      var key = eventName + useCapture;
      if( !data[key] ) data[key] = { from:[], to:[] };
      data[key].from.push( callback );
      data[key].to.push( newCallback );
      this.data(onCallbacksKey, data);
    }
    this.addEventListener(eventName, newCallback, useCapture);
    return EventTypeProto.off.bind(this, eventName, callback, useCapture);
  };
  EventTypeProto.one = function (eventName, callback, useCapture, times) {
    if (!times)
      times = 1;
    else if (times < 1)
      return function () {};
    var _retirar = null;
    var _func = function () {
      callback();
      if (!--times)
        _retirar();
    };
    return _retirar = this.on(eventName, _func, useCapture);
  };
  
  EventTypeProto.bind = EventTypeProto.on;
  EventTypeProto.unbind = EventTypeProto.off;
  
  var ORI_addEventListener = EventTypeProto.addEventListener ,
      ORI_removeEventListener = EventTypeProto.removeEventListener ;
  
  EventTypeProto.addEventListener = function(eventName, callback, useCapture){
    useCapture = !!useCapture;
    if( !this.$_listeners ) this.$_listeners = {};
    if( !this.$_listeners[eventName] ) this.$_listeners[eventName] = [];
    this.$_listeners[eventName].push( [eventName, callback, useCapture] );
    ORI_addEventListener.call(this, eventName, callback, useCapture);
  };
  EventTypeProto.removeEventListener = function(eventName, callback, useCapture){
    useCapture = !!useCapture;
    if( this.$_listeners && this.$_listeners[eventName] ){
      var temp = this.$_listeners[eventName];
      for(var i = 0; i < temp.length; i++){
        var arr = temp[i];
        if( arr[0] === eventName && arr[1] === callback && arr[2] === useCapture ){
          temp.splice(i, 1);
          break;
        }
      }
    }
    ORI_removeEventListener.call(this, eventName, callback, useCapture);
  };
  
  
  
  
  //===========================================================================
  //          Element prototype

  var ElementProto = window.Element.prototype;
  var matchesSelector = ElementProto.matches
                        || ElementProto.matchesSelector
                        || ElementProto.webkitMatchesSelector
                        || ElementProto.mozMatchesSelector
                        || ElementProto.msMatchesSelector
                        || ElementProto.oMatchesSelector;
  if(!ElementProto.matches) ElementProto.matches = function( str ){ return matchesSelector.call(this,str); };
  ElementProto.is = function(strOrObj){
    if( $.is$(strOrObj) && strOrObj.length ) return this === strOrObj[0];
    if( $.isString(strOrObj) ) return this.matches(strOrObj);
    return this === strOrObj;
  };
  
  ElementProto.find = function (str) {
    var nodeList = this.querySelectorAll(str), len = nodeList.length;
    var arr = [];
    for (var i = 0; i < len; i++)
      arr.push(nodeList[i]);
    return $(arr);
  };
  
  if ('classList' in ElementProto) {
    ElementProto.hasClass = function () {
      return this.classList.contains.apply(this.classList, arguments );
    };
    ElementProto.addClass = function () {
      this.classList.add.apply(this.classList, arguments );
      return this;
    };
    ElementProto.removeClass = function () {
      this.classList.remove.apply(this.classList, arguments );
      return this;
    };
  } else {
    ElementProto.hasClass = function (str) {
      return new RegExp('\\b' + str + '\\b').test(this.className);
    };
    ElementProto.addClass = function () {
      var i = arguments.length, str;
      while( i-- ){
        str = arguments[i];
        if( !this.hasClass(str) ) this.className += ' ' + str;
      }
      return this;
    };
    ElementProto.removeClass = function (str) {
      var i = arguments.length, str;
      while( i-- ){
        str = arguments[i];
        this.className = this.className.replace(new RegExp('\\b'+ str+'\\b', 'g'), '');
      }
      return this;
    };
  }
  ElementProto.toggleClass = function(){
    var i = 0, len = arguments.length, str;
    for(; i < len; i++){
      str = arguments[i];
      if (this.hasClass(str))
        this.removeClass(str);
      else
        this.addClass(str);
    }
    return this;
  };
  
  ElementProto.after = function(/*...val*/){
    var el, lenArg = arguments.length, j = 0, parent = this.parent(), next = this.next();
    for(; j < lenArg; j++){ 
      el = arguments[j-1];
      if( $.is$(el) ){
        var len = el.length, i = len;
        while( i-- ) parent.insertBefore( el[len-i-1], next );
      }else if( $.isFunc(el) ){
        parent.insertBefore( el(), next );
      }else{
        parent.insertBefore( _elStr(el)? _createElFromStr(el) : el, next );
      }
    }
  };
  ElementProto.append = function(/*...el*/){
    var el, lenArg = arguments.length, j = 0;
    for(; j < lenArg; j++){
      el = arguments[j];
      if( $.is$(el) ){
        var len = el.length, i = len;
        while( i-- ) this.appendChild( el[len-i-1] );
      }else if( $.isFunc(el) ){
        this.appendChild( el() );
      }else{
        this.appendChild( _elStr(el)? _createElFromStr(el) : el );
      }
    }
    return this;
  };
  ElementProto.attr = function( str, val ){
    if( $.isObj(str) ){
      for( var g in str ){
        this.setAttribute( g, str[g] );
      }
      return this;
    }
    if( $.isUndef(val) ) return this.getAttribute( str );
    this.setAttribute( str, val );
    return this;
  };
  ElementProto.before = function(/*...el*/){
    var el, lenArg = arguments.length, j = lenArg, parent = this.parent();
    for(; j > 0; j--){ 
      el = arguments[j-1];
      if( $.is$(el) ){
        var len = el.length, i = len;
        while( i-- ) parent.insertBefore( el[len-i-1], this );
      }else if( $.isFunc(el) ){
        parent.insertBefore( el(), this );
      }else{
        parent.insertBefore( _elStr(el)? _createElFromStr(el) : el, this );
      }
    }
  };
  ElementProto.clone = function( val ){
    return this.cloneNode( val );
  };
  ElementProto.css = function( obj, val ){
    if( $.isString(obj) ){
      if( $.isUndef(val) ) 
        return window.getComputedStyle(this)[obj];
      this.style[obj] = val;
      return this;
    }
    for( var g in obj ){
      this.style[g] = obj[g];
    }
    return this;
  };
  ElementProto.data = function( keyOrObj, val ){
    if( !this._data ) this._data = {};
    if( $.isObj(keyOrObj) ){
      for(var g in keyOrObj){
        this._data[g] = keyOrObj[g];
      }
    }else if( $.isUndef(val) ){
      return this._data[keyOrObj] || (this._data[keyOrObj] = _getDataAttr(this, keyOrObj));
    }else{
      this._data[keyOrObj] = val;
    }
    return this;
  };
  ElementProto.detach = function(str){
    this.remove(str);
    return this;
  };
  ElementProto.empty = function(){
    while(this.hasChildNodes()) {
      this.removeChild(this.firstChild);
    }
    return this;
  };
  ElementProto.html = function (str){
    if( $.isUndef(str) ) return this.innerHTML;
    this.innerHTML = str;
    return this;
  };
  ElementProto.next = function( str ){
    if(!str) return this.nextElementSibling;
    var el = this;
    while(el){
      if( el.matches(str) ) return el;
      el = el.nextSibling;
    }
    return null;
  };
  ElementProto.parent = function(){
    return this.parentNode;
  };
  ElementProto.parents = function(){
    var arr = [], el = this.parent(), temp;
    while( (temp = el.parentNode) ){
      arr.push(el);
      el = temp;
    }
    return $(arr);
  };
  ElementProto.prepend = function( /*...el*/ ){
    var el, lenArg = arguments.length, j = lenArg;
    for(; j > 0; j--){
      el = arguments[j-1];
      if( $.is$(el) ){
        var len = el.length, i = len;
        while( i-- ) this.insertBefore( el[len-i-1], this.firstChild );
      }else if( $.isFunc(el) ){
        this.insertBefore( el(), this.firstChild );
      }else{
        this.insertBefore( _elStr(el)? _createElFromStr(el) : el, this.firstChild );
      }
    }
    return this;
  };
  ElementProto.prop = function( key, val ){
    if( $.isUndef(val) ){
      return !!this[key];
    }
    this[key] = !!val;
    return this;
  };
  ElementProto.replaceWith = function( el ){
    el = _elStr(el)? _createElFromStr(el) : el;
    this.parent().replaceChild( el, this );
    return el;
  };
  
  var selfRemove = ElementProto.remove || function(){
    this.parentNode.removeChild( this );
  };
  ElementProto.remove = function( str ){
    if(!str) selfRemove.call(this);
    else this.find(str).remove();
    return this;
  };
  ElementProto.removeAttr = function(){
    var len = arguments.length;
    while( len-- > -1 ) this.removeAttribute(arguments[len]);
    return this;
  };
  ElementProto.removeData = function( strOrArr ){
    if( this._data ) {
      if( $.isString(strOrArr) ){
        strOrArr = strOrArr.split(/\s+/);
      }
      for(var g in strOrArr){
        var str = strOrArr[g];
        delete this._data[str];
        this.removeAttribute( _toDataAttrStr(str) );
      }
    }
    return this;
  };
  
  ElementProto.text = function (str){
    if( $.isUndef(str) ) return this.textContent;
    this.textContent = str;
    return this;
  };
  ElementProto.val = function( strOrFunc ){
    var nodeName = this.nodeName;
    if( $.isUndef(strOrFunc) ){
      var val;
      if( nodeName === 'INPUT' || nodeName === 'TEXTAREA' ){
        val = this.value;
      }else if( nodeName === 'SELECT' ){
        if( this.type === 'select-multiple' ){
          val = [];
          var sels = this.selectedOptions, len = sels.length, i = 0;
          for(; i < len; i++) val.push( sels[i].value );
        }else{
          val = this.value;
        }
      }
      else val = this.text();
      return val;
    }else{
      function __v(){ return ; }
      var vals = $.isFunc(strOrFunc)?strOrFunc():strOrFunc,
          valsStr = '';
      if( $.isArray(vals) ) valsStr = vals.length? vals[0] : '';
      else valsStr = vals;
      
      if( nodeName === 'INPUT' || nodeName === 'TEXTAREA' ){
        this.value = valsStr;
      }else if( nodeName === 'SELECT' ){
        if( this.type === 'select-multiple' ){
          var sels = this.options, len = sels.length, i = 0;
          if( !$.isArray(vals) ) vals = [ vals ];
          
          for(i = 0; i < len; i++) sels[i].selected = false;
          for(var j = 0; j < vals.length; j++){
            for(i = 0; i < len; i++){
              var el = sels[i];
              if( el.value === vals[j] ) el.selected = true;
            }
          }
        }else{
          this.value = valsStr;
        }
      }
      else this.text( __v() );
    }
    return this;
  };
  ElementProto.wrap = function( param ){
    var wrapEl, parent = this.parent() ;
    if( $.is$(param) ){
      if( !param.length ) return this;
      param = param[0];
    }
    
    if( $.isString(param) ){
      wrapEl = _createElFromStr( param ).firstChild;
    }else if( _isClass(param, '[object Text]') ){
      wrapEl = _createElFromStr( param.textContent ).firstChild;
    }else{
      wrapEl = param;
    }
    
    if( parent ){
      this.replaceWith( wrapEl );
    }
    wrapEl.append(this);
    return this;
  };
  
  
  ElementProto.position = function(){
    var parent = this.parent();
    return {
      top: this.offsetTop,
      left: this.offsetLeft,
      right: parent.offsetWidth? parent.offsetWidth - this.offsetLeft - this.offsetWidth : 0,
      bottom: parent.offsetHeight? parent.offsetHeight - this.offsetTop - this.offsetHeight : 0
    };
  };
  ElementProto.offset = function( str ){
    var parents = this.parents(), res = this.position(), g, pos;
    for(g in parents){
      if( str && parents[g].is(str) ) break;
      if( !parents[g].position ) continue;
      pos = parents[g].position();
      res.top += pos.top;
      res.left += pos.left;
      res.right += pos.right;
      res.bottom += pos.bottom;
    }
    return res;
  };
  
  
  //===========================================================================
  //          $ function

  function $(param) {
    if (!$.is$(this)){
      if($.isFunc(param)){ 
        $.ready(param);
        return $;
      }
      return new $(param);
    }
    if ($.is$(param))
      return param;
    if ( $.isString(param) )
      return ElementProto.find.call(document, param);
    if ( $.isUndef(param) )
      param = [];
    if (!$.isArray(param))
      param = [param];

    for (var g in param)
      this.push(param[g]);
    if (!this.length)
      this.length = 0;

    _defineProperty(this, 5, 'length');
    return this;
  };
  var proto = ($.prototype = new Array());
  $.fn = proto;
  //$.constructor = Array;
  
  $.blockProperties = function(){
    for(var g in proto){ 
      _defineProperty(proto, 5, g);
    }
  };
  
    // Adicionar funções auxiliares:
  $.is$ = function(val){ return val instanceof $; };
  $.isArray = function(val){ return Array.isArray(val); };
  $.isDate = function(val){ return _isClass(val,'[object Date]'); };
  $.isDef = function(val){ return !$.isUndef(val); };
  $.isFunc = function(val){ return (typeof val === 'function'); };
  $.isNumber = function(val){ return !isNaN(parseFloat(val)) && isFinite(val); };
  $.isObj = function(val){ return !!(val && (typeof val === 'object') && !$.isArray(val)); };
  $.isString = function(val){ return (typeof val === 'string'); };
  $.isUndef = function(val){ return (typeof val === 'undefined'); };
  $.isElement = function(val){ return val instanceof window.Element; };
  
  $.ready = function( func ){
    document.on('DOMContentLoaded', func, false);
  };
  
  $.copy = function( target ){
    //if( arguments.length < 1 ) return {};
    if( arguments.length === 1 ){
      var newObj;
      if( $.isDate(target) ){
        newObj = new Date(target);
      }else if( $.isObj(target) ){
        newObj = {};
        $.copy( newObj, target );
      }else if( $.isArray(target) ){
        newObj = [];
        $.copy( newObj, target );
      }else{
        newObj = target;
      }
      return newObj;
    };
    //if( !$.isObj(target) ) target = {};
    for(var i = 1; i < arguments.length; i++){
      _copy_Lvl( target, arguments[i] );
    }
    return target;
  };
  function _copy_Lvl( to, from, prop ){
    if( $.isDate(from) && prop ){
      to[prop] = new Date(from);
    }else if( $.isObj(from) ){
      if( prop ){
        if( !$.isObj(to[prop]) ) to[prop] = {};
        to = to[prop];
      }
      for(var g in from){
        _copy_Lvl( to, from[g], g );
      }
    }else if( $.isArray(from) ){
      if( prop ){
        // copia de vator para vetor
        if( !$.isArray(to[prop]) ) to[prop] = [];
        to = to[prop];
        for(var i = 0; i < from.length; i++) to.push( $.copy(from[i]) );
      }else{
        // copia de vetor para obj, com index como chave
        for(var i = 0; i < from.length; i++) to[i] = $.copy(from[i]);
      }
    }else if(prop){
      to[prop] = from;
    }
  }
  
  /*
   * Implementação baseada na lib "axios"
   * 
   * config:
   *  method
   *  url
   *  async
   *  user
   *  password
   *  data: o que será enviado
   *  headers: obj com cabeçalhos adicionais
   *  withCredentials: para CORS, indica se deve ser enviado cookies, padrão TRUE
   */
  $.ajax = function(url, config){
    if( $.isObj(url) ) config = url;
    else{
      if(!config) config = {};
      config.url = url;
    }
    if(!config.method) config.method = config.data ? 'POST' : 'GET';
    if( $.isUndef(config.async) ) config.async = true;
    if( $.isUndef(config.withCredentials) ) config.withCredentials = true;
    
    var data;
    if(config.data){
      if( $.isObj(config.data) || $.isArray(config.data) || $.isDate(config.data) ){
        data = JSON.stringfy(config.data);
      }else{
        data = config.data;
      }
    }
    
    if( $.isUndef(config.async) ) config.async = true;
    config.withCredentials = !!config.withCredentials;
    if( !config.Authorization && 
      !($.isUndef(config.user) && $.isUndef(config.password)) ){
      config.Authorization = 'Basic '+ btoa( (config.user||'')+':'+(config.password||'') );
    }
    
    var xhr = new XMLHttpRequest(),
        loadEv = 'onreadystatechange',
        xDmn = false;
      
    if( window.XDomainRequest && !('withCredentials' in xhr) ){
      xhr = new window.XDomainRequest();
      loadEv = 'onload';
      xDmn = true;
    }
    xhr.withCredentials = config.withCredentials;
    xhr.timeout = config.timeout;
    
    if (config.responseType) {
      try {
        xhr.responseType = config.responseType;
      } catch (e) {
        if (xhr.responseType !== 'json') {
          throw e;
        }
      }
    }
    if( $.isObj(config.headers) ){
      for(var g in config.headers){
        xhr.setRequestHeader( g, config.headers[g] );
      }
    }
    
    
    var nProm = (window.Q && window.Q.Promise) ? window.Q.Promise 
                : window.Promise ? 
                    window.Promise 
                  : function(fn){ fn(); }; // <--  ???
    
    return new nProm(function(resolve, reject, progress){
      xhr.open( config.method.toUpperCase(), 
                config.url, 
                config.async );

      xhr[loadEv] = function(){
        // xhr.readyState === 2 // cabeçalhos recebidos (carregando)
        // xhr.readyState === 3 // carregando
        // xhr.readyState === 4 // concluido
        if(!xhr || (xhr.readyState !== 4 && !xDmn) || xhr.status === 0){
          return;
        }

        var responseHeaders = 'getAllResponseHeaders' in xhr ? parseHeaders(xhr.getAllResponseHeaders()) : null;
        var responseData = !config.responseType || config.responseType === 'text' ? xhr.responseText : xhr.response;
        var response = {
          data: responseData,
          // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
          status: xhr.status === 1223 ? 204 : xhr.status,
          statusText: xhr.status === 1223 ? 'No Content' : xhr.statusText,
          headers: responseHeaders,
          config: config,
          request: xhr
        };
        
        resolve(response);
        xhr = null;
      };
      xhr.onerror = function(){
        reject.apply(null, arguments);
        xhr = null;
      };
      xhr.ontimeout = function(){
        reject.apply(null, arguments);
        xhr = null;
      };
      if(progress) xhr.addEventListener('progress', function(){
        progress.apply(null, arguments);
      });
      if(progress) if(xhr.upload) xhr.upload.addEventListener('progress', function(){
        progress.apply(null, arguments);
      });

      xhr.send( config.data );
    });
  };
  function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;
    var hSplit = headers.split('\n');

    if (!headers) { return parsed; }
    
    for(var g in hSplit){
      var line = hSplit[g];
      i = line.indexOf(':');
      key = line.substr(0, i).trim.toLowerCase();
      val = line.substr(i + 1).trim;

      if (key) {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
    return parsed;
  }
  
  $.get = function(url, config){ 
    if(!config) config = {}; 
    config.method = 'GET';
    config.url = url;
    return $.ajax(url, config);
  };
  $.post = function(url, data, config){ 
    if(!config) config = {}; 
    config.method = 'POST';
    config.url = url;
    config.data = data;
    return $.ajax(url, config);
  };
  $.put = function(url, data, config){ 
    if(!config) config = {}; 
    config.method = 'PUT';
    config.url = url;
    config.data = data;
    return $.ajax(url, config);
  };
  $.delete = function(url, data, config){ 
    if(!config) config = {}; 
    config.method = 'DELETE';
    config.url = url;
    config.data = data;
    return $.ajax(url, config);
  };
  
  
  
  // Sobreescrevendo algumas funções do protótipo de Array:
  var 
      pushFunc = proto.push;
  
  proto.push = function(){
    var i = 0, len = arguments.length, el, g;
    for(; i < len; i++){
      el = arguments[i];
      if( $.is$(el) ){
        for(g in el) pushFunc.call(this, el[g] );
      }else{
        pushFunc.call(this, el);
      }
    }
    return this.length;
  };
  
  
  // !!!  Atenção: as linhas comentadas, com traços, estão pendentes!  !!!
  
    // modes:
  var 
    GETTER = 1,
    SETTER = 2,
    GETTER_FIRST = 3,
    MIX = 4,
    MIX_GETTER_FIRST = 5;
    
  var funcs = [
      ['addClass'         ,SETTER             ],
      ['after'            ,GETTER_FIRST       ,null],
      ['append'           ,SETTER             ],
      ['attr'             ,MIX_GETTER_FIRST   ,null],
      ['before'           ,GETTER_FIRST       ,null],
      ['bind'             ,SETTER             ],
      //['children'         ,GETTER             ],
      ['clone'            ,GETTER             ],
      //['contents'         ,GETTER             ],
      ['css'              ,MIX_GETTER_FIRST   ,null],
      ['data'             ,MIX_GETTER_FIRST   ,null],
      ['detach'           ,SETTER             ],
      ['empty'            ,SETTER             ],
      //['eq'               ,GETTER             ],
      ['find'             ,GETTER             ],
      ['hasClass'         ,GETTER_FIRST       ,false],
      ['html'             ,MIX_GETTER_FIRST   ,''],
      ['is'               ,GETTER_FIRST       ,false],
      ['next'             ,GETTER_FIRST       ,null],
      ['off'              ,SETTER             ],
      ['offset'           ,GETTER_FIRST       ],
      ['on'               ,SETTER             ],
      ['one'              ,SETTER             ],
      ['parent'           ,GETTER             ],
      ['parents'          ,GETTER             ],
      ['position'         ,GETTER_FIRST       ],
      ['prepend'          ,SETTER             ],
      ['prop'             ,MIX_GETTER_FIRST   ,null],
      //['ready'],
      ['remove'           ,SETTER             ],
      ['removeAttr'       ,SETTER             ],
      ['removeClass'      ,SETTER             ],
      ['removeData'       ,SETTER             ],
      ['replaceWith'      ,SETTER             ],
      ['text'             ,MIX_GETTER_FIRST   ,''],
      ['toggleClass'      ,SETTER             ],
      //--- ['triggerHandle'],
      ['unbind'           ,SETTER             ],
      ['val'              ,MIX_GETTER_FIRST   ,''],
      ['wrap'             ,SETTER             ]
    ], funcsI = funcs.length;
    
    
    // comportamento padrão;
  while( funcsI-- ){ 
    var el = funcs[funcsI];
    _normalElementCall(proto, el[0], el[1], el.length>2? el[2] : 0);
  }
  
  
  proto.children = function(str){
    return $( _childrenAndContents(this, str, 'children') );
  };
  proto.contents = function(str){
    return $( _childrenAndContents(this, str, 'childNodes') );
  };
  proto.eq = function(val){
    return $([ this[val] ]);
  };
  proto.removeDuplicates = function(){
    _removeEquals(this);
    return this;
  };
  
    // bloquear a iteração desses elementos:
  $.blockProperties();
  


  //===========================================================================
  //    Funções auxiliares
  
  
  function _normalElementCall(proto, funcName, mode, valorQuandoLenZero ){
    if( $.isUndef(valorQuandoLenZero) ) valorQuandoLenZero = null;
    
    switch(mode){
      case GETTER:
        proto[funcName] = function(){
          var el, arr = [], i = 0, j, res = _forEachApply(this, ElementProto[funcName], arguments);
          for(; i < res.length; i++){
            el = res[i];
            if( $.is$(el) ){
              for(j = 0; j < el.length; j++) arr.push( el[j] );
            }else{
              arr.push( el );
            }
          }
          return $(arr);
        };
        break;
      case SETTER:
        proto[funcName] = function(){
          _forEachApply(this, ElementProto[funcName], arguments);
          return this;
        };
        break;
      case GETTER_FIRST:
        proto[funcName] = function(){
          if( !this.length ) return valorQuandoLenZero ;
          return _forEachApply( [this[0]] , ElementProto[funcName], arguments)[0];
        };
        break;
      case MIX:
        
        break;
      case MIX_GETTER_FIRST:
        proto[funcName] = function(){
          if( !this.length ) return !arguments.length? valorQuandoLenZero :this;
          return _forEachApply( !arguments.length?[this[0]]:this , ElementProto[funcName], arguments)[0];
        };
        break;
    }
    
  }
  function _forEachApply(arr, func, arrApply) {
    var ret = [], len = arr.length;
    for (var i = 0; i < len; i++)
      ret.push(func.apply(arr[i], arrApply));
    return ret;
  }
  function _defineProperty(obj, intConf, prop ) {
    if (!intConf)
      intConf = 0;
    
    Object.defineProperty(obj, prop, {
      configurable: !!(1 & intConf),
      enumerable: !!(2 & intConf),
      writable: !!(4 & intConf),
      iterable: !!(8 & intConf)
        //value: conf.value,
        //get: conf.get,
        //set: conf.set
    });
  }
  
  function _removeEquals( arr ){
    var len = arr.length, i = len, j;
    while(i--){
      j = len - i;
      while(--j){
        if( arr[i] === arr[i+j] ) arr.splice(i+j, 1);
      }
    }
    return arr;
  }
  /* */
  function _elStr( objOrStr ){
    return $.isString(objOrStr) && /^\s*</.test(objOrStr);
  }
  function _createElFromStr( str ){
    var div = document.createElement('div'),
        frag = document.createDocumentFragment(),
        len, i;
    div.innerHTML = str;
    len = i = div.childNodes.length;
    while(i--){
      frag.appendChild( div.childNodes[len-i-1] );
    }
    return frag;
  }
  
  function _childrenAndContents( that, str, attr ){
    var res = [], len = that.length, i = len, j, lenJ, arrJ, el;
    while( i-- ){
      arrJ = that[len-i-1][attr]; //  <<---  "children" (sem textos) ou "childNodes" (com textos)
      j = lenJ = arrJ.length;
      while( j-- ){
        el = arrJ[lenJ-j-1];
        if( !str || (el.nodeType !== 3 && el.matches(str)) ) res.push( el );
      }
    }
    return res;
  }
  
  /*
  function _toDataKeyStr( key ){
    key = key.replace(/^data-/, '');
    var reg = /-([\w\d])/g, letra = null;
    while( (letra = reg.exec(key)) ){
      key = key.replace( letra[0], letra[1].toUpperCase() );
    }
    return key;
  }
  /* */
  function _toDataAttrStr( key ){
    var reg = /[A-Z]/g, letra = null;
    while( (letra = reg.exec(key)) ){
      key = key.replace( letra[0], '-'+letra[0].toLowerCase() );
    }
    key = 'data-'+ key;
    return key;
  }
  function _getDataAttr(el, key){
    return el.getAttribute( _toDataAttrStr(key) );
  }



  //===========================================================================
  //    Publicando funções

  if (!window.$)
    window.$ = $;
  if (!window.$$)
    window.$$ = $;
  
  
  
  

})(window, document);
