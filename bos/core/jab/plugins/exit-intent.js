/* EXIT INTENT */
!function(y){function x(){y(".ei-container").fadeOut(function(){y(this).remove()}),y(".ei-layer").fadeOut(function(){y(this).remove()}),y.removeData(document.body,"stick_var")}y.stickToMe=function(e){var l=y.extend({},{layer:"",fadespeed:400,trigger:["top"],maxtime:0,mintime:0,delay:0,interval:0,maxamount:0,cookie:!1,bgclickclose:!0,escclose:!0,onleave:function(e){},disableleftscroll:!0},e);y(l.layer).hide();var u,r,m=(new Date).getTime(),f=y(window).height(),g=y(window).width(),t=!1,p=0,v=0,b=!0,k=0;/Chrome/.test(navigator.userAgent)&&(r=!0,y(document).width()>g&&1==l.disableleftscroll&&(b=!1));var o=parseFloat(y(l.layer).css("height")),n=parseFloat(y(l.layer).css("width")),i={backgroundcss:{"z-index":"1000",display:"none"},boxcss:{"z-index":"1000",position:"fixed",left:"50%",top:"50%",height:o+"px",width:n+"px","margin-left":-n/2+"px","margin-top":-o/2+"px"}};function h(){t=!1,y(document).bind("mousemove.bindoffset",function(e){t&&(y(document).bind("mouseleave",function(e){setTimeout(function(){c(e)},l.delay)}),y(document).unbind("mousemove.bindoffset")),t=!0})}function c(e){var t,o,n=document.documentElement?document.documentElement.scrollTop:document.body.scrollTop,i=document.documentElement?document.documentElement.scrollLeft:document.body.scrollLeft,n=y(document).scrollTop()>n?y(document).scrollTop():n,i=y(document).scrollLeft()>i?y(document).scrollLeft():i;o=-1==Math.round(e.pageX)||-1==Math.round(e.pageY)||-3==e.pageX||-3==e.pageY?(t=-k+n,u-i):(t=-e.pageY+n,e.pageX-i);var c,a,d=f/g*o-f,s=-f/g*o<=t?d<=t?"top":"right":d<=t?"left":"bottom";/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)&&t<0&&-f<t&&0<o&&o<g||(-1==y.inArray(s,l.trigger)&&-1==y.inArray("all",l.trigger)||(c=(new Date).getTime())-m>=l.mintime&&(c-m<=l.maxtime||0==l.maxtime)&&(p<l.maxamount||0==l.maxamount)&&(c-v>=l.interval||0==l.interval)&&b&&(a=function(e){for(var t=e+"=",o=document.cookie.split(";"),n=0;n<o.length;n++){for(var i=o[n];" "==i.charAt(0);)i=i.substring(1);if(-1!=i.indexOf(t))return i.substring(t.length,i.length)}return 0}("ck_stick_visit"),(0==l.cookie||1==l.cookie&&(a<l.maxamount||0==l.maxamount))&&(l.onleave.call(this,s),""!=l.layer&&1!=y.data(document.body,"stick_var")&&(y.data(document.body,"stick_var",1),y('<div class="ei-layer"></div>').appendTo("body").css(l.backgroundcss).fadeIn(l.fadespeed),y('<div class="ei-container"></div>').appendTo("body"),y(l.layer).clone().show().css(l.boxcss).appendTo(".ei-container"),l.bgclickclose&&y(".ei-layer").click(function(){x()}),l.escclose&&y("body").keyup(function(e){27==e.which&&x()})),p++,1==l.cookie&&(a++,document.cookie="ck_stick_visit="+a+"; path=/"),v=(new Date).getTime())),r&&(y(document).unbind("mouseleave"),h()))}y.extend(!0,l,i),y(document).bind("mousemove",function(e){u=e.pageX,k=e.pageY}),y(document).bind("mouseleave",function(e){setTimeout(function(){c(e)},l.delay)}),r&&(y(document).unbind("mouseleave"),h()),y(window).resize(function(e){f=y(window).height(),g=y(window).width()})},y.stick_close=function(){x()}}(jQuery);