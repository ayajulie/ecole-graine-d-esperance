

// transparent navbar
const navbar = document.getElementById('navbar');
const logo = document.getElementById('logo');
let scrolled = false; //we haven't started scoll yet

window.onscroll = function () {
  if (window.pageYOffset > 500) {  //under 100px 
    navbar.classList.remove('top');     // remove the class "top" (the transparent bg)
    logo.src = "./img/logo-color.png";
  } else {
    navbar.classList.add('top');
    logo.src = "./img/logo-white.png";
    scrolled = false;
  }
};


// Smooth Scrolling
$('.navbar a, .btn').on('click', function (e) {
  if (this.hash !== '') {
    e.preventDefault();

    const hash = this.hash;

    $('html, body').animate(
      {
        scrollTop: $(hash).offset().top - 100,
      },
      800
    );
  }
});



//-----slideshow
var slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "block";
  dots[slideIndex - 1].className += " active";
}

const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", mobileMenu);

function mobileMenu() {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
}
const navLink = document.querySelectorAll(".nav-link");

navLink.forEach(n => n.addEventListener("click", closeMenu));

function closeMenu() {
  hamburger.classList.remove("active");
  navMenu.classList.remove("active");
}


// display cards 

const links = document.querySelectorAll('.card-link');
const cards = document.querySelectorAll('.card');

// hide all cards except the first one
cards.forEach((card, index) => {
  if (index !== 0) {
    card.style.display = 'none';
  }
});

links.forEach(link => {
  link.addEventListener('click', function () {
    // hide all cards
    cards.forEach(card => {
      card.style.display = 'none';
    });
    // show the corresponding card
    const cardId = this.getAttribute('data-card');
    const card = document.getElementById(cardId);
    card.style.display = 'flex';
  });
});
