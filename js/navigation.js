function toggleNavigation() {
  var menu = document.querySelector('[role="navigation"]')

  menu.classList.toggle('w--nav-dropdown-open')
  menu.toggleAttribute('data-nav-menu-open')

  var items = document.getElementsByClassName('w-nav-link')

  for (let item of items) {
    item.classList.toggle('w--nav-link-open')
  }
}

// Toggle navigation on "hamburger" click
document.addEventListener('click', function (event) {
  if (!event.target.matches('.w-nav-button')) return
  event.preventDefault()

  toggleNavigation()
})

// Close expanded navigation above certain window width
window.addEventListener('resize', function (_event) {
  if (window.innerWidth > 991) {
    var menu = document.querySelector('[role="navigation"]')

    if (menu.classList.contains('w--nav-dropdown-open')) {
      toggleNavigation()
    }
  }
})
