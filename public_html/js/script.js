
$(function(){
  animate();
  function animate() {
      requestAnimationFrame(animate);
      TWEEN.update();
  }
  
  
  var el = $('.bloco1');
  var press = { y: 0, x: 0 }, config = { from: press };
  
  var mc = new Hammer.Manager( el[0] );
  mc.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
  
  
  mc.on('panstart', function(ev){
    if( config.tween ) config.tween.stop();
  });
  mc.on('panmove', function(ev){
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
  mc.on('panend',_panEnd);
  mc.on('pancancel',_panEnd);
  
  function _setPos(ev){
    el.css('transform',
    ' translate3D('+ (ev.deltaX + config.from.x) +'px, '+ (ev.deltaY + config.from.y) +'px, 0px) ');
  }
  
  //-------------------------------------------------------------------------
  
  var ir = true, blocoIr = $('.bloco2');
  new Hammer($('.moverBox button')[0]).on('tap',function(ev){
    if(ir){
      blocoIr.anim({ to:{ x: 150, y: 50 } });
      ir = false;
    }else{
      blocoIr.anim({ to:{ x: 0, y: 0 } });
      // from:{ x: 150, y: 50 },
      ir = true;
    }
  });
  
  new Hammer($('.moverBox button')[1]).on('tap',function(ev){
    blocoIr.anim({ to: $('.dest') });
  });
  
  new Hammer($('.moverBox button')[2]).on('tap',function(ev){
    blocoIr.anim({ to: $('.dest'), time: 1000,
        curveX: [0.0 , 0.0] ,
        curveY: [1.0 , 1.0] });
  });
  
  
  var atualSel = null;
  $('.quadro1 .item').on('click',function(ev){
    this.anim({ to: $('.quadro1 .selecionadoPosicao'), 
        curveX: [0.0 , 0.0] ,
        curveY: [0.5 , 0.5] });
    if( atualSel ){
      atualSel.anim({ to: {x:0, y:0}, 
        curveX: [0.0 , 0.0] ,
        curveY: [0.5 , 0.5] });
    }
    if( atualSel !== this ) atualSel = this;
    else atualSel = null;
  });
  
});
