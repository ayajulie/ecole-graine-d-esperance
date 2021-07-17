
// transparent navbar
const navbar = document.getElementById('navbar');
let scrolled = false; //we haven't started scoll yet

window.onscroll = function () {
  if (window.pageYOffset > 500) {  //under 100px 
    navbar.classList.remove('top');     // remove the class "top" (the transparent bg)
    // if (!scrolled) {
    //   navbar.style.transform = 'translateY(-70px)';
    // }
    // setTimeout(function () {
    //   navbar.style.transform = 'translateY(0)';
    //   scrolled = true;
    // }, 200);
  } else {
    navbar.classList.add('top');
    scrolled = false;
  }
};

// Smooth Scrolling
$('#navbar a, .btn').on('click', function (e) {
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
