function getURLParameter(param) {
  var pageURL = window.location.search.substring(1)
  var URLVariables = pageURL.split('&')
  for (var i = 0; i < URLVariables.length; i++) {
    var parameterName = URLVariables[i].split('=')
    if (parameterName[0] == param) {
      return parameterName[1]
    }
  }
}

// Use custom protocol to open Quiet app
document.addEventListener(
  'click',
  function (event) {
    if (!event.target.matches('#joincommunity')) return
    event.preventDefault()

    var invitationCode = getURLParameter('code')

    navigator.getInstalledRelatedApps().then(relatedApps => {
      for (let app of relatedApps) {
        console.log({ app })
      }
    })

    if (invitationCode) {
      if (navigator.getInstalledRelatedApps) {
        navigator.getInstalledRelatedApps().then(relatedApps => {
          if (relatedApps.length === 0) {
            window.location = 'https://play.google.com/store/apps/details?id=com.quietmobile&pli=1'
            return
          }
        })
      }

      window.location = `quiet://?code=${invitationCode}`
    }
  },
  false
)
