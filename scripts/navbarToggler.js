"use strict";

var navbar = document.querySelector('.navbar');
var navbarTogBtn = document.querySelector('.navbar-tog__btn');
var toggleFlag = false;
navbarTogBtn.addEventListener('click', function () {
  console.log('click');
  toggleFlag = !toggleFlag;
  toggleFlag ? navbar.style.top = '88px' : navbar.style.top = '-100%';
});