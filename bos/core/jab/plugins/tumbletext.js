/* TumbleText */
window.addEventListener("load",function(){for(var e=document.querySelectorAll(".tumbletext"),n=0;n<e.length;n++){var t=e[n].innerText.split(" ");e[n].innerHTML="";for(var a=0;a<t.length;a++){var r=document.createElement("span");r.innerText=t[a];var l=0+(e.length+a)/10;r.style.animationDelay=l+"s",e[n].appendChild(r)}}});