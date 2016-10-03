
(function($){
  var configKey = '$.MinJqTransition.Config';
  
  function _defaultConfig(that){
    var myConf = {};
    that.data(configKey, myConf);
    myConf.autoStop = true;
    myConf.vX = 1;
    myConf.vY = 1;
    myConf.vZ = 0;
    myConf.correction = 10 ;
    myConf.easing = TWEEN.Easing.Quadratic.Out;
    myConf.interpolation = TWEEN.Interpolation.Bezier;
    myConf.time = 300;
    myConf.curveX = 1;
    myConf.curveY = 1;
    myConf.curveZ = 1;
    return myConf;
  }
  
  /**
   * Parâmetros de configuração:
   * - from : Pode ser um objeto com { x, y, z }. 
   *          Caso não seja informado, usará a última posição de animação.
   * - to : Pode ser um objeto com { x, y, z } ou um objeto do MinJq, ou um "Element" do DOM.
   *        Caso não seja informado, então a animação será de "momentum".
   * - autoStop : Informa se a animação anterior deve ser parada automaticamente
   *              antes de começar a nova (padrão para "true").
   * - vX, vY, vZ : velocidades de movimentação, caso seja usado "momentum".
   * - correction : número que será multiplicado pelo tempo atual quando for usado "momentum".
   *                Isso fará com que a animação do momentum seja mais rápida ou devagar 
   *                (prefira usar "time" ao invés desse parâmetro!).
   * - easing : Script/cálculo para a animação (suavização).
   *            Deve ser um dos modelos disponíveis na lib TweenJs (Easing).
   * - time : tempo que será executada a animação.
   * - interpolation : O script de interpolação.
   *                   Deve ser um dos modelos disponíveis na lib TweenJs (Interpolation).
   * - curveX, curveY, curveZ : um vetor com as configurações da curva de interpolação.
   *           Em bezier será usado: P0(0,0) - [ P1(x,y) - P2(x,y) ] - P3(1,1).
   *           Esses valores devem estar entre 0 e 1, o ponto inicial e final não deve
   *            ser informado, eles serão 0 e 1 sempre (respectivamente).
   * 
   * 
   * @param {object} config Object with configurations.
   * @returns {object} Object with configurations.
   */
  $.fnElement.animConfig = function(config){
    var myConf = this.data(configKey);
    if( !myConf ){
      myConf = _defaultConfig(this);
    }
    if( $.isObj(config) ){
      if( $.isDef(config.autoStop) ) myConf.autoStop = !!config.autoStop;
      if( $.isDef(config.vX) ) myConf.vX = config.vX;
      if( $.isDef(config.vY) ) myConf.vY = config.vY;
      if( $.isDef(config.vZ) ) myConf.vZ = config.vZ;
      if( $.isDef(config.curveX) ) myConf.curveX = config.curveX;
      if( $.isDef(config.curveY) ) myConf.curveY = config.curveY;
      if( $.isDef(config.curveZ) ) myConf.curveZ = config.curveZ;
      if( $.isDef(config.correction) ) myConf.correction = config.correction;
      if( $.isDef(config.easing) ) myConf.easing = config.easing;
      if( $.isDef(config.interpolation) ) myConf.interpolation = config.interpolation;
      if( $.isDef(config.time) ) myConf.time = config.time;
    }
    return myConf;
  };
  $.fnElement.anim = function(config){
    if(!config) config = {};
    var momentum = !config.to;
    var myConf = this.animConfig(config);
    
    myConf.from = config.from || myConf.pos || {x: 0, y: 0, z: 0};
    myConf.to = config.to || {x: 0, y: 0, z: 0};
    
    myConf.from.x = myConf.from.x||0;
    myConf.from.y = myConf.from.y||0;
    myConf.from.z = myConf.from.z||0;
    var isEl = false;
    if( !momentum && ($.is$(myConf.to) || $.isElement(myConf.to)) ){
      isEl = true;
    }else{
      if(!myConf.to.x) myConf.to.x = 0;
      if(!myConf.to.y) myConf.to.y = 0;
      if(!myConf.to.z) myConf.to.z = 0;
    }
    
    //---  agora começa as execuções:
    if( myConf.autoStop && myConf.tween ) myConf.tween.stop();
    
    if( momentum ) _animMomentum.call(this, myConf);
    else _animTo.call(this, myConf, isEl);
    return this;
  };
  
  function _animMomentum(config){
    var that = this, from = config.from; 
    var tween = new TWEEN.Tween({ t: 1 });
    tween.to({ t: 0 }, config.time);
    tween.easing(config.easing);
    tween.onUpdate(function(){
      var t = this.t;
      var x = from.x + config.vX * t *config.correction ;
      var y = from.y + config.vY * t *config.correction ;
      var z = from.z + config.vZ * t *config.correction ;
      from.x = x;
      from.y = y;
      from.z = z;
      that.style.transform = ' translate3D('+ (x) +'px, '+ (y) +'px, '+ (z) +'px) ';
      config.pos = { x:x, y:y, z:z };
    });
    tween.start();
    config.tween = tween;
    return config;
  }
  function _animTo(config, isEl){
    var that = this;
    if( isEl ){
      var from = config.from;
      var el = $(config.to);
      var off = el.offset();
      var meOff = that.offset();
      
      var difx = off.left - meOff.left - (from.x||0) ; 
      var dify = off.top - meOff.top - (from.y||0) ; 
      var difz = from.z||0 ; 
      var ix = from.x||0;
      var iy = from.y||0;
      var iz = from.z||0;
    }else{
      var difx = config.to.x - config.from.x ; 
      var dify = config.to.y - config.from.y ; 
      var difz = config.to.z - config.from.z ; 
      var ix = config.from.x;
      var iy = config.from.y;
      var iz = config.from.z;
    }
    
    var curveX = config.curveX || 1;
    var curveY = config.curveY || 1;
    var curveZ = config.curveZ || 1;
    if( $.isArray(curveX) ) curveX.push(1);
    if( $.isArray(curveY) ) curveY.push(1);
    if( $.isArray(curveZ) ) curveZ.push(1);
    var tween = new TWEEN.Tween({ cx:0, cy:0, cz:0 });
    tween.to({ cx: curveX, cy: curveY, cz: curveZ }, config.time);
    tween.easing(config.easing);
    tween.interpolation(config.interpolation);
    tween.onUpdate(function(){
      var x = ix + this.cx * difx ;
      var y = iy + this.cy * dify ;
      var z = iz + this.cz * difz ;
      that.style.transform = ' translate3D('+ (x) +'px, '+ (y) +'px, '+ (z) +'px) ';
      config.pos = { x:x, y:y, z:z };
    });
    tween.start();
    config.tween = tween;
    return config;
  }
  
  
  $._normalElementCall('animConfig', $.MODE_GETTER_FIRST, null);
  $._normalElementCall('anim', $.MODE_SETTER);
  $.blockProperties();
})($$);
