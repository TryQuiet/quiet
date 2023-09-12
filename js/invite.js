// Use custom protocol to open Quiet app
document.addEventListener(
  'click',
  function (event) {
    if (!event.target.matches('#joincommunity')) return
    event.preventDefault()

    var hash = window.location.hash

    var invitationCode = hash.substring(1)

    // Ensure backward compatibility
    if (hash.includes("code=")) {
      invitationCode = hash.substring(6)
    }

    if (!invitationCode) {
      window.alert('Sorry, no invitation code has been passed with the URL.')
      return
    }

    if (invitationCode) {
      window.location = `quiet://?${invitationCode}`
    }
  },
  false
)
