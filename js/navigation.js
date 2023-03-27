function isNavigationOpen() {
  var menu = document.querySelector('[role="navigation"]')
  return menu.classList.contains('w--nav-dropdown-open')
}

function toggleNavigation() {
  var menu = document.querySelector('[role="navigation"]')

  menu.classList.toggle('w--nav-dropdown-open')
  menu.toggleAttribute('data-nav-menu-open')

  var items = document.getElementsByClassName('w-nav-link')

  for (let item of items) {
    item.classList.toggle('w--nav-link-open')
  }
}

// Toggle navigation if clicked outside it
document.addEventListener('click', function (event) {
  const nav = document.querySelector('.w-nav-menu')
  if (
    !nav.contains(event.target) && 
    isNavigationOpen()
  ) {
    toggleNavigation()
  }
})

// Toggle navigation on "hamburger" click
document.addEventListener('click', function (event) {
  const button = document.querySelector('.w-nav-button')

  if (!button.contains(event.target)) return
  event.preventDefault()

  toggleNavigation()
})

// Close expanded navigation above certain window width
window.addEventListener('resize', function (_event) {
  if (
    window.innerWidth > 991 && 
    isNavigationOpen()
  ) {
    toggleNavigation()
  }
})
