
$(function(){
  animate();
  function animate() {
      requestAnimationFrame(animate);
      TWEEN.update();
  }
  
  var el = $('.bloco1');
  var press = { y: 0, x: 0 }, config = { from: press };
  
  el.hammer('pan',{ direction: Hammer.DIRECTION_ALL, threshold: 0 });
  el.on('panstart', function(ev){
    if( config.tween ) config.tween.stop();
  });
  el.on('panmove', function(ev){
    _setPos(ev);
  });
  function _panEnd(ev){
    _setPos(ev);
    press = {
      x: ev.deltaX + config.from.x ,
      y: ev.deltaY + config.from.y  
    };
    $('.velocidadeG').text( ev.velocity );
    $('.velocidadeX').text( ev.velocityX );
    $('.velocidadeY').text( ev.velocityY );
    
    if( !ev.velocityX && !ev.velocityY ) return;
    
    config = { from: press, vX: ev.velocityX, vY: ev.velocityY, time:1000 };
    el.anim(config);
  }
  el.on('panend',_panEnd);
  el.on('pancancel',_panEnd);
  
  function _setPos(ev){
    el.css('transform',
    ' translate3D('+ (ev.deltaX + config.from.x) +'px, '+ (ev.deltaY + config.from.y) +'px, 0px) ');
  }
  
  //-------------------------------------------------------------------------
  
  var ir = true, blocoIr = $('.bloco2');
  $('.moverBox button')[0].on('tap',function(ev){
    if(ir){
      blocoIr.anim({ to:{ x: 150, y: 50 } });
      ir = false;
    }else{
      blocoIr.anim({ to:{ x: 0, y: 0 } });
      // from:{ x: 150, y: 50 },
      ir = true;
    }
  });
  
  $('.moverBox button')[1].on('tap',function(ev){
    blocoIr.anim({ to: $('.dest') });
  });
  
  $('.moverBox button')[2].on('tap',function(ev){
    blocoIr.anim({ to: $('.dest'), time: 1000,
        curveX: [0.0 , 0.0] ,
        curveY: [1.0 , 1.0] });
  });
  
  
  var atualSel = null;
  $('.quadro1 .item').on('tap',function(ev){
    if( atualSel ){
      atualSel.anim({ to: {x:0, y:0}, 
        curveX: [0.0 , 0.0] ,
        curveY: [0.5 , 0.5] });
    }
    if( atualSel !== this ){
      this.anim({ to: $('.quadro1 .selecionadoPosicao'), time: 500,
          curveX: [0.0 , 2.0] ,
          curveY: [0.5 , 2.0] });
      atualSel = this;
    }
    else atualSel = null;
  });
  
});
