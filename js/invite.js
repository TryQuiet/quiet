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

    if (invitationCode?.length < 56) {
      window.alert("Sorry, this doesn't seem to be a valid invitation code.")
      return
    }

    // Backward compatibility for only-address invitation code
    if (invitationCode?.length === 56) {
      window.location = `quiet://?code=${invitationCode}`
      return
    }

    window.location = `quiet://?${invitationCode}`
  },
  false
)

// Detects platform and display correct links on tryquiet.org/join
function getPlatform() {
  const primaryActionEl = document.getElementById("qt-download-action")
  const platform = navigator.userAgent

  if (/iPhone|iPad|iPod/i.test(platform)) {
    primaryActionEl.innerHTML = `
  <a href="https://testflight.apple.com/join/yaUjeiW7" class="qt-hero-badge w-inline-block">
          <img src="../images/badge-app-store.png" loading="lazy" srcset="../images/badge-app-store-p-500.png 500w, ../images/badge-app-store.png 730w" sizes="(max-width: 479px) 160px, 150px" alt="Quiet for iOS App Store download">
          </a>
  `;

} else if (/Macintosh|Mac OS X/i.test(platform)) {
    primaryActionEl.innerHTML = `
    <a href="https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fdesktop%402.3.1/Quiet-2.3.1.dmg" class="qt-hero-badge w-inline-block">
      <img src="../images/badge-mac.png" loading="lazy" srcset="../images/badge-mac-p-500.png 500w, ../images/badge-mac.png 730w" sizes="(max-width: 479px) 160px, 150px" alt="Quiet for macOS download">
      </a>
  `;

} else if (/Windows/i.test(platform)) {
  primaryActionEl.innerHTML = `
 <a href="https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fdesktop%402.3.1/Quiet.Setup.2.3.1.exe" class="qt-hero-badge w-inline-block">
        <img src="../images/badge-windows.png" loading="lazy" srcset="../images/badge-windows-p-500.png 500w, ../images/badge-windows.png 730w" sizes="(max-width: 479px) 160px, 150px" alt="Quiet for Windows download">
        </a>
`;

} else if (/Linux/i.test(platform) && !/Android/i.test(platform)) {
  primaryActionEl.innerHTML = `
<a href="https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fdesktop%402.3.1/Quiet-2.3.1.AppImage" class="qt-hero-badge w-inline-block">
        <img src="../images/badge-linux.png" loading="lazy" srcset="../images/badge-linux-p-500.png 500w, ../images/badge-linux.png 730w" sizes="(max-width: 479px) 160px, 150px" alt="Quiet for Linux download">
        </a>
`;

} else if (/Android/i.test(platform)) {
  primaryActionEl.innerHTML = `
    <a href="https://play.google.com/store/apps/details?id=com.quietmobile" class="qt-hero-badge w-inline-block" style="display: block; margin: 0 auto 20px; text-align: center;">
      <img src="../images/badge-google-play.png" loading="lazy" srcset="../images/badge-google-play-p-500.png 500w, ../images/badge-google-play.png 712w" sizes="(max-width: 479px) 160px, 150px" alt="Quiet for Google Play store download button">
    </a>
    <a href="https://github.com/TryQuiet/quiet/releases/download/%40quiet%2Fmobile%402.3.1/app-standard-release.apk" target="_blank">
      Or you can download the Quiet .apk directly
    </a>
`;

} else {
  primaryActionEl.innerHTML = `
  <a href="../index.html#Downloads" target="_blank">Download
  </a>
`;
}
    
  }


onload = getPlatform
